import { Request, Response } from "express";
import { MessageService } from "./message.service";
import { z } from "zod";

const messageService = new MessageService();

const sendMessageSchema = z.object({
  identifier: z.string().min(1).optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
  intent: z.string().min(1).default("custom"),
  message: z.string().optional()
});

export class MessageController {
  async send(req: Request, res: Response): Promise<void> {
    const result = sendMessageSchema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({ errors: result.error.format() });
      return;
    }

    const identifier = result.data.identifier || result.data.phone || result.data.email;
    if (!identifier) {
      res.status(400).json({ error: "Recipient identifier, phone, or email is required." });
      return;
    }

    const response = await messageService.sendMemberMessage(
      identifier,
      result.data.intent,
      result.data.message
    );

    if (!response.success) {
      res.status(400).json({ success: false, message: response.detail, data: response.data });
      return;
    }

    res.status(200).json({ success: true, message: response.detail, data: response.data });
  }

  async getLogs(_req: Request, res: Response): Promise<void> {
    const logs = messageService.getLogs();
    res.status(200).json({ logs });
  }

  async triggerDailyCronScan(_req: Request, res: Response): Promise<void> {
    try {
      const scanResult = await messageService.runDailyScan();
      res.status(200).json({
        success: true,
        message: `Daily 6:00 AM scan executed manually. Dispatched ${scanResult.sevenDayCount} 7-day reminders and ${scanResult.oneDayCount} 1-day reminders.`,
        data: scanResult
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || "Failed to run scan." });
    }
  }
}
