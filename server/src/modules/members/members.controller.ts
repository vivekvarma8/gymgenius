import { Request, Response } from "express";
import { MembersService } from "./members.service";
import { createMemberSchema, updateMemberSchema } from "./members.validation";

const membersService = new MembersService();

export class MembersController {
  async list(_req: Request, res: Response): Promise<void> {
    const members = await membersService.list();
    res.status(200).json({ data: members });
  }

  async stats(_req: Request, res: Response): Promise<void> {
    const stats = await membersService.getStats();
    res.status(200).json({ data: stats });
  }

  async create(req: Request, res: Response): Promise<void> {
    const parseResult = createMemberSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({ errors: parseResult.error.format() });
      return;
    }

    const member = await membersService.create(parseResult.data);
    res.status(201).json({ data: member });
  }

  async importMembers(req: Request, res: Response): Promise<void> {
    const file = (req as Request & { file?: Express.Multer.File }).file;
    if (!file) {
      res.status(400).json({ message: "CSV or Excel file is required." });
      return;
    }

    try {
      const result = await membersService.importFromFile(file.buffer, file.originalname);
      res.status(200).json(result);
    } catch (error) {
      res.status(400).json({ message: (error as Error).message });
    }
  }

  async getById(req: Request, res: Response): Promise<void> {
    const member = await membersService.getById(req.params.id);
    if (!member) {
      res.status(404).json({ message: "Member not found" });
      return;
    }
    res.status(200).json({ data: member });
  }

  async update(req: Request, res: Response): Promise<void> {
    const parseResult = updateMemberSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({ errors: parseResult.error.format() });
      return;
    }

    const member = await membersService.update(req.params.id, parseResult.data);
    if (!member) {
      res.status(404).json({ message: "Member not found" });
      return;
    }

    res.status(200).json({ data: member });
  }

  async remove(req: Request, res: Response): Promise<void> {
    const deleted = await membersService.remove(req.params.id);
    if (!deleted) {
      res.status(404).json({ message: "Member not found" });
      return;
    }

    res.status(204).send();
  }

  async removeBulk(req: Request, res: Response): Promise<void> {
    const { ids, all } = (req.body || {}) as { ids?: string[]; all?: boolean };
    if (all) {
      const count = await membersService.removeAll();
      res.status(200).json({ message: `Successfully deleted all members`, count });
      return;
    }

    if (!Array.isArray(ids) || ids.length === 0) {
      res.status(400).json({ message: "An array of member ids is required." });
      return;
    }

    const count = await membersService.removeMany(ids);
    res.status(200).json({ message: `Successfully deleted ${count} members`, count });
  }
}