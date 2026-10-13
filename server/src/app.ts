import express, { Express } from "express";
import cors from "cors";
import helmet from "helmet";
import { json } from "body-parser";
import { healthRouter } from "./modules/health/health.router";
import { authRouter } from "./modules/auth/auth.router";
import { membersRouter } from "./modules/members/members.router";
import { messageRouter } from "./modules/messages/message.router";
import { apiRateLimiter, authRateLimiter } from "./lib/middleware/request-rate-limit";
import { config } from "./config";
import { aiRouter } from "./modules/ai/ai.router";

export function createApp(): Express {
  const app = express();
  app.set("trust proxy", 1);

  app.use(helmet());
  app.use(cors({ origin: config.server.corsOrigin, optionsSuccessStatus: 200 }));
  app.use(json());
  app.use(apiRateLimiter);

  app.use("/api/v1/health", healthRouter);
  app.use("/api/v1/auth", authRateLimiter, authRouter);
  app.use("/api/v1/members", membersRouter);
  app.use("/api/v1/messages", messageRouter);
  app.use("/api/v1/ai", aiRouter);

  app.use((req, res) => {
    res.status(404).json({ message: "Not Found" });
  });

  app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error(err);
    res.status(500).json({ message: "Internal Server Error" });
  });

  return app;
}
