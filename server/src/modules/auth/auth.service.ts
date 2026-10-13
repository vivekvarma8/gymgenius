import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { AppDataSource } from "../../shared/database/data-source";
import { User } from "../../shared/entities/user.entity";
import { config } from "../../config";

interface AuthResult {
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
}

export class AuthService {
  async login(email: string, password: string): Promise<AuthResult> {
    const userRepository = AppDataSource.getRepository(User);
    const user = await userRepository.findOneBy({ email });

    if (!user || !user.isActive) {
      throw new Error("Invalid credentials");
    }

    const passwordMatches = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatches) {
      throw new Error("Invalid credentials");
    }

    const accessToken = jwt.sign({ sub: user.id, role: user.role }, config.auth.jwtSecret, {
      expiresIn: config.auth.jwtExpiry as any
    });
    const refreshToken = jwt.sign({ sub: user.id, type: "refresh" }, config.auth.jwtSecret, {
      expiresIn: "7d"
    });

    return { accessToken, refreshToken, expiresIn: config.auth.jwtExpiry };
  }

  async refreshToken(token: string): Promise<AuthResult> {
    try {
      const payload = jwt.verify(token, config.auth.jwtSecret) as jwt.JwtPayload;
      if (payload.type !== "refresh" || !payload.sub) {
        throw new Error("Invalid refresh token");
      }

      const userRepository = AppDataSource.getRepository(User);
      const user = await userRepository.findOneBy({ id: String(payload.sub) });
      if (!user || !user.isActive) {
        throw new Error("Invalid refresh token");
      }

      const accessToken = jwt.sign({ sub: user.id, role: user.role }, config.auth.jwtSecret, {
        expiresIn: config.auth.jwtExpiry as any
      });
      const refreshToken = jwt.sign({ sub: user.id, type: "refresh" }, config.auth.jwtSecret, {
        expiresIn: "7d"
      });

      return { accessToken, refreshToken, expiresIn: config.auth.jwtExpiry };
    } catch {
      throw new Error("Invalid refresh token");
    }
  }
}
