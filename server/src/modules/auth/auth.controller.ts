import { Request, Response } from "express";
import { AuthService } from "./auth.service";
import { loginSchema, refreshTokenSchema } from "./auth.validation";

const authService = new AuthService();

export class AuthController {
  async login(req: Request, res: Response): Promise<void> {
    const parseResult = loginSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({ errors: parseResult.error.format() });
      return;
    }

    const { email, password } = parseResult.data;
    try {
      const result = await authService.login(email, password);
      res.status(200).json(result);
    } catch (error) {
      res.status(401).json({ message: (error as Error).message });
    }
  }

  async refreshToken(req: Request, res: Response): Promise<void> {
    const parseResult = refreshTokenSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({ errors: parseResult.error.format() });
      return;
    }

    try {
      const result = await authService.refreshToken(parseResult.data.refreshToken);
      res.status(200).json(result);
    } catch (error) {
      res.status(401).json({ message: (error as Error).message });
    }
  }
}
