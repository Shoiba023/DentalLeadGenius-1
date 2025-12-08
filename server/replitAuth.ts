// Referenced from javascript_log_in_with_replit blueprint
import passport from "passport";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import memoize from "memoizee";
import connectPg from "connect-pg-simple";
import { storage } from "./storage";

// Runtime check for Replit environment (must be a function, not a constant)
function isReplitEnvironment(): boolean {
  return !!process.env.REPL_ID;
}

// Dynamic imports for openid-client (only loaded when needed)
let client: typeof import("openid-client") | null = null;
let Strategy: typeof import("openid-client/passport").Strategy | null = null;

async function loadOidcDependencies() {
  if (!isReplitEnvironment()) {
    throw new Error("OIDC not available outside Replit");
  }
  if (!client) {
    client = await import("openid-client");
  }
  if (!Strategy) {
    const passportModule = await import("openid-client/passport");
    Strategy = passportModule.Strategy;
  }
  return { client, Strategy };
}

const getOidcConfig = memoize(
  async () => {
    const { client } = await loadOidcDependencies();
    return await client.discovery(
      new URL(process.env.ISSUER_URL ?? "https://replit.com/oidc"),
      process.env.REPL_ID!
    );
  },
  { maxAge: 3600 * 1000 }
);

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  return session({
    secret: process.env.SESSION_SECRET!,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: true,
      maxAge: sessionTtl,
    },
  });
}

function updateUserSession(
  user: any,
  tokens: any
) {
  user.claims = tokens.claims();
  user.access_token = tokens.access_token;
  user.refresh_token = tokens.refresh_token;
  user.expires_at = user.claims?.exp;
}

async function upsertUser(
  claims: any,
) {
  await storage.upsertUser({
    id: claims["sub"],
    email: claims["email"],
    firstName: claims["first_name"],
    lastName: claims["last_name"],
    profileImageUrl: claims["profile_image_url"],
  });
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  // Skip Replit OIDC setup if not running on Replit
  if (!isReplitEnvironment()) {
    console.log("[AUTH] Running outside Replit - OIDC disabled, using email/password auth only");
    
    passport.serializeUser((user: Express.User, cb) => cb(null, user));
    passport.deserializeUser((user: Express.User, cb) => cb(null, user));
    
    // Provide stub routes that redirect to email login
    app.get("/api/login", (req, res) => {
      res.redirect("/auth");
    });
    
    app.get("/api/callback", (req, res) => {
      res.redirect("/auth");
    });
    
    app.get("/api/logout", (req, res) => {
      req.logout(() => {
        res.redirect("/");
      });
    });
    
    return;
  }

  // Load OIDC dependencies dynamically (only on Replit)
  const { client: oidcClient, Strategy: OidcStrategy } = await loadOidcDependencies();
  const config = await getOidcConfig();

  const verify = async (
    tokens: any,
    verified: passport.AuthenticateCallback
  ) => {
    const user = {};
    updateUserSession(user, tokens);
    await upsertUser(tokens.claims());
    verified(null, user);
  };

  // Keep track of registered strategies
  const registeredStrategies = new Set<string>();

  // Helper function to ensure strategy exists for a domain
  const ensureStrategy = (domain: string) => {
    const strategyName = `replitauth:${domain}`;
    if (!registeredStrategies.has(strategyName)) {
      const strategy = new OidcStrategy!(
        {
          name: strategyName,
          config,
          scope: "openid email profile offline_access",
          callbackURL: `https://${domain}/api/callback`,
        },
        verify,
      );
      passport.use(strategy);
      registeredStrategies.add(strategyName);
    }
  };

  passport.serializeUser((user: Express.User, cb) => cb(null, user));
  passport.deserializeUser((user: Express.User, cb) => cb(null, user));

  app.get("/api/login", (req, res, next) => {
    ensureStrategy(req.hostname);
    passport.authenticate(`replitauth:${req.hostname}`, {
      prompt: "login consent",
      scope: ["openid", "email", "profile", "offline_access"],
    })(req, res, next);
  });

  app.get("/api/callback", (req, res, next) => {
    ensureStrategy(req.hostname);
    passport.authenticate(`replitauth:${req.hostname}`, {
      successReturnToOrRedirect: "/",
      failureRedirect: "/api/login",
    })(req, res, next);
  });

  app.get("/api/logout", (req, res) => {
    req.logout(() => {
      res.redirect(
        oidcClient.buildEndSessionUrl(config, {
          client_id: process.env.REPL_ID!,
          post_logout_redirect_uri: `${req.protocol}://${req.hostname}`,
        }).href
      );
    });
  });
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  // For non-Replit environments (email/password auth), check session
  if (!isReplitEnvironment()) {
    // Session-based auth check
    const session = req.session as any;
    if (session?.isAuthenticated && session?.userId) {
      return next();
    }
    return res.status(401).json({ message: "Unauthorized" });
  }

  // Replit OIDC authentication
  const user = req.user as any;

  if (!req.isAuthenticated() || !user.expires_at) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const now = Math.floor(Date.now() / 1000);
  if (now <= user.expires_at) {
    return next();
  }

  const refreshToken = user.refresh_token;
  if (!refreshToken) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  try {
    const { client: oidcClient } = await loadOidcDependencies();
    const config = await getOidcConfig();
    const tokenResponse = await oidcClient.refreshTokenGrant(config, refreshToken);
    updateUserSession(user, tokenResponse);
    return next();
  } catch (error) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }
};
