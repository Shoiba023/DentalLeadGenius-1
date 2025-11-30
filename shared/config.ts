/**
 * Site Configuration
 * 
 * Centralized configuration for branding, contact details, and site URLs.
 * This file is imported by both frontend and backend to ensure consistency.
 */

// Site branding
export const SITE_NAME = "DentalLeadGenius";
export const SITE_TAGLINE = "AI-Powered Lead Generation for Dental Clinics";

// Main site URL (used for canonical links, emails, etc.)
export const SITE_URL = "https://dentalleadgenius.com";

// Support email address
export const SUPPORT_EMAIL = "support@dentalleadgenius.com";

// Company info for emails and legal pages
export const COMPANY_INFO = {
  name: SITE_NAME,
  email: SUPPORT_EMAIL,
  website: SITE_URL,
};

// Email sender configuration (used when sending emails)
export const EMAIL_FROM_NAME = SITE_NAME;
export const EMAIL_FROM_ADDRESS = SUPPORT_EMAIL;

// Social media links (if applicable)
export const SOCIAL_LINKS = {
  // Add social links as needed
  // twitter: "https://twitter.com/dentalleadgenius",
  // linkedin: "https://linkedin.com/company/dentalleadgenius",
};
