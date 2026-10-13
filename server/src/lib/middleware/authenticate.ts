import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { config } from "../../config";

export interface AuthRequest extends Request {
  userId?: string;
  userRole?: string;
}

export function authenticate(req: AuthRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ message: "Authorization header missing or invalid" });
    return;
  }

  const token = authHeader.replace("Bearer ", "");
  try {
    const payload = jwt.verify(token, config.auth.jwtSecret) as jwt.JwtPayload;
    req.userId = String(payload.sub);
    req.userRole = String(payload.role ?? "");
    next();
  } catch {
    res.status(401).json({ message: "Invalid or expired token" });
  }
}
