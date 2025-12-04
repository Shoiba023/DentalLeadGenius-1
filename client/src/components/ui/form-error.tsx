import { cn } from "@/lib/utils";
import { AlertCircle, CheckCircle2 } from "lucide-react";

interface FormErrorProps {
  message?: string;
  className?: string;
}

export function FormError({ message, className }: FormErrorProps) {
  if (!message) return null;
  
  return (
    <div 
      className={cn(
        "flex items-center gap-2 text-sm text-destructive mt-1.5 animate-in fade-in slide-in-from-top-1 duration-200",
        className
      )}
      role="alert"
    >
      <AlertCircle className="h-4 w-4 flex-shrink-0" />
      <span>{message}</span>
    </div>
  );
}

interface FormSuccessProps {
  message?: string;
  className?: string;
}

export function FormSuccess({ message, className }: FormSuccessProps) {
  if (!message) return null;
  
  return (
    <div 
      className={cn(
        "flex items-center gap-2 text-sm text-green-600 dark:text-green-400 mt-1.5 animate-in fade-in slide-in-from-top-1 duration-200",
        className
      )}
      role="status"
    >
      <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
      <span>{message}</span>
    </div>
  );
}

interface FormAlertProps {
  type: "error" | "success" | "warning" | "info";
  message: string;
  className?: string;
}

export function FormAlert({ type, message, className }: FormAlertProps) {
  const styles = {
    error: "bg-destructive/10 text-destructive border-destructive/20",
    success: "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20",
    warning: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20",
    info: "bg-primary/10 text-primary border-primary/20",
  };

  return (
    <div 
      className={cn(
        "p-3 rounded-lg border text-sm animate-in fade-in slide-in-from-top-2 duration-200",
        styles[type],
        className
      )}
      role={type === "error" ? "alert" : "status"}
    >
      {message}
    </div>
  );
}

interface PasswordStrengthProps {
  password: string;
  className?: string;
}

export function PasswordStrength({ password, className }: PasswordStrengthProps) {
  const getStrength = (pwd: string): { level: number; label: string; color: string } => {
    let score = 0;
    
    if (pwd.length >= 6) score++;
    if (pwd.length >= 8) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[a-z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    
    if (score <= 2) return { level: 1, label: "Weak", color: "bg-red-500" };
    if (score <= 4) return { level: 2, label: "Fair", color: "bg-yellow-500" };
    return { level: 3, label: "Strong", color: "bg-green-500" };
  };

  if (!password) return null;

  const { level, label, color } = getStrength(password);

  return (
    <div className={cn("mt-2 space-y-1", className)}>
      <div className="flex gap-1">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className={cn(
              "h-1 flex-1 rounded-full transition-colors duration-200",
              i <= level ? color : "bg-muted"
            )}
          />
        ))}
      </div>
      <p className="text-xs text-muted-foreground">
        Password strength: <span className="font-medium">{label}</span>
      </p>
    </div>
  );
}