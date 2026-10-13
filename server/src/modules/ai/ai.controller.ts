import { Response } from "express";
import { z } from "zod";
import { AIService } from "./ai.service";
import { AuthRequest } from "../../lib/middleware/authenticate";

const aiService = new AIService();

const chatSchema = z.object({
  message: z.string().min(1).max(2000)
});

export class AIController {
  async chat(req: AuthRequest, res: Response): Promise<void> {
    const parseResult = chatSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({ errors: parseResult.error.format() });
      return;
    }

    if (!req.userId) {
      res.status(401).json({ message: "Authorization required." });
      return;
    }

    try {
      const result = await aiService.chat(req.userId, parseResult.data.message);
      res.status(200).json(result);
    } catch (error) {
      console.error("AI chat error", error);
      res.status(502).json({ message: "The AI assistant is temporarily unavailable. Please try again." });
    }
  }

  async reset(req: AuthRequest, res: Response): Promise<void> {
    if (!req.userId) {
      res.status(401).json({ message: "Authorization required." });
      return;
    }

    aiService.resetConversation(req.userId);
    res.status(204).send();
  }
}