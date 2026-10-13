import dotenv from "dotenv";
import fs from "fs";
import path from "path";

function findEnvFile(startDir: string): string | null {
  let currentDir = startDir;

  while (true) {
    const candidate = path.join(currentDir, ".env");
    if (fs.existsSync(candidate)) {
      return candidate;
    }

    const parentDir = path.dirname(currentDir);
    if (parentDir === currentDir) {
      return null;
    }

    currentDir = parentDir;
  }
}

const envPath = findEnvFile(process.cwd());
if (envPath) {
  dotenv.config({ path: envPath });
} else {
  dotenv.config();
}

function getEnv(key: string, fallback?: string): string {
  const value = process.env[key] ?? fallback;
  if (value === undefined) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

export const config = {
  server: {
    port: Number(process.env.PORT ?? 4000),
    nodeEnv: process.env.NODE_ENV ?? "development",
    corsOrigin: getEnv("CORS_ORIGIN", "*")
  },
  database: {
    host: getEnv("DB_HOST", "localhost"),
    port: Number(getEnv("DB_PORT", "5432")),
    username: getEnv("DB_USER", "postgres"),
    password: getEnv("DB_PASSWORD", "password"),
    database: getEnv("DB_NAME", "lions_gym_crm")
  },
  auth: {
    jwtSecret: getEnv("JWT_SECRET", "changeme"),
    jwtExpiry: getEnv("JWT_EXPIRY", "1h"),
    adminEmail: getEnv("ADMIN_EMAIL", "gymgenius@gmail.com"),
    adminPassword: getEnv("ADMIN_PASSWORD", "@gymgenius_123")
  },
  ai: {
    provider: getEnv("AI_PROVIDER", "gemini"),
    get apiKey(): string {
      if (!process.env.GEMINI_API_KEY && !process.env.AI_API_KEY) {
        if (envPath) dotenv.config({ path: envPath, override: true });
      }
      return process.env.GEMINI_API_KEY ?? process.env.AI_API_KEY ?? "";
    },
    get model(): string {
      return process.env.GEMINI_MODEL ?? "gemini-1.5-flash";
    }
  },
  email: {
    host: process.env.SMTP_HOST ?? "smtp.gmail.com",
    port: Number(process.env.SMTP_PORT ?? 587),
    user: process.env.SMTP_USER ?? process.env.ADMIN_EMAIL ?? "lionsfitnessgym20@gmail.com",
    pass: process.env.SMTP_PASS ?? process.env.ADMIN_PASSWORD ?? "@lionsfitnessgym_20",
    from: process.env.SMTP_FROM ?? "GymGenius Fitness <lionsfitnessgym20@gmail.com>",
    gymName: process.env.GYM_NAME ?? "GymGenius Fitness"
  }
};
