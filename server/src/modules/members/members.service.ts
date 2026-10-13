import { parse } from "csv-parse/sync";
import XLSX from "xlsx";
import { In } from "typeorm";
import { AppDataSource } from "../../shared/database/data-source";
import { Member } from "../../shared/entities/member.entity";
import { createMemberSchema, CreateMemberInput } from "./members.validation";

const columnNames: Record<string, string[]> = {
  fullName: ["Full Name", "fullName", "full_name", "Name", "name"],
  firstName: ["firstName", "first_name", "firstname", "First Name", "FirstName"],
  lastName: ["lastName", "last_name", "lastname", "Last Name", "LastName"],
  email: ["email", "Email"],
  phone: ["phone", "Phone", "mobile", "Mobile", "Phone Number"],
  gender: ["gender", "Gender"],
  age: ["age", "Age"],
  height: ["height", "Height"],
  weight: ["weight", "Weight"],
  bmi: ["bmi", "BMI"],
  joinedAt: ["joinedAt", "joined_at", "joined", "Joined At", "JoinedAt", "Join Date"],
  expiryAt: ["expiryAt", "expiry_at", "Expiry Date", "ExpiryAt"],
  membershipPlan: ["membershipPlan", "Membership Plan", "plan", "Plan"],
  membershipStatus: ["membershipStatus", "Membership Status", "status", "Status"],
  paymentStatus: ["paymentStatus", "Payment Status"],
  amountPaid: ["amountPaid", "Amount Paid"],
  pendingAmount: ["pendingAmount", "Pending Amount"],
  trainerAssigned: ["trainerAssigned", "Trainer Assigned", "Trainer"],
  dietPlan: ["dietPlan", "Diet Plan"],
  workoutPlan: ["workoutPlan", "Workout Plan"],
  medicalNotes: ["medicalNotes", "Medical Notes"],
  emergencyContact: ["emergencyContact", "Emergency Contact"],
  address: ["address", "Address"],
  additionalNotes: ["additionalNotes", "Additional Notes", "Notes"]
};

function readCandidate(row: Record<string, unknown>, candidates: string[]): string | undefined {
  for (const candidate of candidates) {
    const cell = row[candidate];
    if (cell == null) {
      continue;
    }
    const value = typeof cell === "string" ? cell.trim() : String(cell).trim();
    if (value !== "") {
      return value;
    }
  }
  return undefined;
}

function splitFullName(fullName: string): { firstName: string; lastName?: string } {
  const parts = fullName.trim().split(/\s+/);
  const firstName = parts.shift() ?? fullName;
  const lastName = parts.length > 0 ? parts.join(" ") : undefined;
  return { firstName, lastName };
}

function normalizeRow(row: Record<string, unknown>): Record<string, unknown> {
  const normalized: Record<string, unknown> = {};

  const firstName = readCandidate(row, columnNames.firstName);
  const lastName = readCandidate(row, columnNames.lastName);
  const fullName = readCandidate(row, columnNames.fullName);

  if (firstName) {
    normalized.firstName = firstName;
    if (lastName) {
      normalized.lastName = lastName;
    }
  } else if (fullName) {
    const split = splitFullName(fullName);
    normalized.firstName = split.firstName;
    if (split.lastName) {
      normalized.lastName = split.lastName;
    }
  }

  for (const field of [
    "email",
    "phone",
    "gender",
    "joinedAt",
    "expiryAt",
    "membershipPlan",
    "membershipStatus",
    "paymentStatus",
    "trainerAssigned",
    "dietPlan",
    "workoutPlan",
    "medicalNotes",
    "emergencyContact",
    "address",
    "additionalNotes"
  ]) {
    const value = readCandidate(row, columnNames[field]);
    if (value !== undefined) {
      normalized[field] = value;
    }
  }

  for (const field of ["age", "height", "weight", "bmi", "amountPaid", "pendingAmount"]) {
    const value = readCandidate(row, columnNames[field]);
    if (value !== undefined) {
      const numeric = Number(value.replace(/[,$]/g, ""));
      if (!Number.isNaN(numeric)) {
        normalized[field] = numeric;
      }
    }
  }

  if (normalized.bmi === undefined && typeof normalized.height === "number" && typeof normalized.weight === "number") {
    const heightMeters = (normalized.height as number) / 100;
    if (heightMeters > 0) {
      normalized.bmi = Math.round((normalized.weight as number) / (heightMeters * heightMeters) * 10) / 10;
    }
  }

  return normalized;
}

function stripBom(text: string): string {
  return text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
}

function parseCsv(buffer: Buffer) {
  const text = stripBom(buffer.toString("utf8"));
  return parse(text, { columns: true, skip_empty_lines: true, trim: true }) as Record<string, unknown>[];
}

function parseExcel(buffer: Buffer) {
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    return [];
  }
  return XLSX.utils.sheet_to_json<Record<string, unknown>>(workbook.Sheets[sheetName], { defval: "" });
}

function parseMemberFile(buffer: Buffer, filename: string) {
  const lower = filename.toLowerCase();
  if (lower.endsWith(".csv")) {
    return parseCsv(buffer);
  }
  if (lower.endsWith(".xlsx") || lower.endsWith(".xls")) {
    return parseExcel(buffer);
  }
  throw new Error("Unsupported file type. Use CSV or Excel.");
}

export function parseDateInput(value?: string): Date | undefined {
  if (!value) {
    return undefined;
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

function toEntityInput(data: CreateMemberInput | Partial<CreateMemberInput>): Partial<Member> {
  const { joinedAt, expiryAt, ...rest } = data;
  const entityInput: Partial<Member> = { ...rest };
  if (joinedAt !== undefined) {
    entityInput.joinedAt = parseDateInput(joinedAt);
  }
  if (expiryAt !== undefined) {
    entityInput.expiryAt = parseDateInput(expiryAt);
  }
  return entityInput;
}

export const GYM_PLANS = [
  "General",
  "General Combo",
  "Premium",
  "Premium Couple",
  "Couple",
  "Super Premium",
  "Zumba",
  "Dance"
];

const planLookup = new Map(GYM_PLANS.map((plan) => [plan.toLowerCase(), plan]));

export class MembersService {
  async list(): Promise<Member[]> {
    const memberRepository = AppDataSource.getRepository(Member);
    return memberRepository.find({ order: { createdAt: "DESC" } });
  }

  async create(data: CreateMemberInput): Promise<Member> {
    const memberRepository = AppDataSource.getRepository(Member);
    const member = memberRepository.create(toEntityInput(data));
    return memberRepository.save(member);
  }

  async importFromFile(buffer: Buffer, filename: string): Promise<{ imported: number; skipped: number; errors: string[] }> {
    const records = parseMemberFile(buffer, filename);
    const errors: string[] = [];
    const membersToInsert: Partial<Member>[] = [];

    await AppDataSource.transaction(async (manager) => {
      for (let index = 0; index < records.length; index += 1) {
        const row = normalizeRow(records[index]);
        const parseResult = createMemberSchema.safeParse(row);
        if (!parseResult.success) {
          errors.push(`Row ${index + 2}: ${JSON.stringify(parseResult.error.flatten().fieldErrors)}`);
          continue;
        }

        const existing = await manager.getRepository(Member).findOneBy({ email: parseResult.data.email });
        if (existing) {
          errors.push(`Row ${index + 2}: Email already exists (${parseResult.data.email})`);
          continue;
        }

        membersToInsert.push(toEntityInput(parseResult.data));
      }

      if (membersToInsert.length > 0) {
        await manager.getRepository(Member).save(membersToInsert);
      }
    });

    return { imported: membersToInsert.length, skipped: errors.length, errors };
  }

  async getById(id: string): Promise<Member | null> {
    const memberRepository = AppDataSource.getRepository(Member);
    return memberRepository.findOneBy({ id });
  }

  async findByEmail(email: string): Promise<Member | null> {
    const memberRepository = AppDataSource.getRepository(Member);
    return memberRepository.findOneBy({ email });
  }

  async findByPhone(phone: string): Promise<Member | null> {
    const memberRepository = AppDataSource.getRepository(Member);
    return memberRepository.findOneBy({ phone });
  }

  async search(filters: {
    query?: string;
    membershipPlan?: string;
    membershipStatus?: string;
    paymentStatus?: string;
    trainerAssigned?: string;
    minAge?: number;
    maxAge?: number;
    joinedFrom?: string;
    joinedTo?: string;
    expiryFrom?: string;
    expiryTo?: string;
    expiringInDays?: number;
    hasPendingPayment?: boolean;
    limit?: number;
  }): Promise<Member[]> {
    const memberRepository = AppDataSource.getRepository(Member);
    const qb = memberRepository.createQueryBuilder("member");

    if (filters.query) {
      qb.andWhere(
        "(member.firstName ILIKE :q OR member.lastName ILIKE :q OR member.email ILIKE :q OR member.phone ILIKE :q)",
        { q: `%${filters.query}%` }
      );
    }

    if (filters.membershipPlan) {
      qb.andWhere("LOWER(member.membershipPlan) = LOWER(:plan)", { plan: filters.membershipPlan });
    }

    if (filters.membershipStatus) {
      qb.andWhere("LOWER(member.membershipStatus) = LOWER(:status)", { status: filters.membershipStatus });
    }

    if (filters.paymentStatus) {
      qb.andWhere("LOWER(member.paymentStatus) = LOWER(:payment)", { payment: filters.paymentStatus });
    }

    if (filters.trainerAssigned) {
      qb.andWhere("member.trainerAssigned ILIKE :trainer", { trainer: `%${filters.trainerAssigned}%` });
    }

    if (filters.minAge !== undefined) {
      qb.andWhere("member.age >= :minAge", { minAge: filters.minAge });
    }

    if (filters.maxAge !== undefined) {
      qb.andWhere("member.age <= :maxAge", { maxAge: filters.maxAge });
    }

    if (filters.joinedFrom) {
      qb.andWhere("member.joinedAt >= :joinedFrom", { joinedFrom: filters.joinedFrom });
    }

    if (filters.joinedTo) {
      qb.andWhere("member.joinedAt <= :joinedTo", { joinedTo: filters.joinedTo });
    }

    if (filters.expiryFrom) {
      qb.andWhere("member.expiryAt >= :expiryFrom", { expiryFrom: filters.expiryFrom });
    }

    if (filters.expiryTo) {
      qb.andWhere("member.expiryAt <= :expiryTo", { expiryTo: filters.expiryTo });
    }

    if (filters.expiringInDays !== undefined) {
      const now = new Date();
      const targetDate = new Date(now.getTime() + filters.expiringInDays * 24 * 60 * 60 * 1000);
      qb.andWhere("member.expiryAt >= :now AND member.expiryAt <= :targetDate", { now, targetDate });
    }

    if (filters.hasPendingPayment) {
      qb.andWhere("(LOWER(member.paymentStatus) = 'pending' OR member.pendingAmount > 0)");
    }

    qb.orderBy("member.createdAt", "DESC");

    if (filters.limit) {
      qb.take(filters.limit);
    }

    return qb.getMany();
  }

  async update(id: string, data: Partial<CreateMemberInput>): Promise<Member | null> {
    const memberRepository = AppDataSource.getRepository(Member);
    const member = await memberRepository.findOneBy({ id });
    if (!member) {
      return null;
    }
    Object.assign(member, toEntityInput(data));
    return memberRepository.save(member);
  }

  async remove(id: string): Promise<boolean> {
    const memberRepository = AppDataSource.getRepository(Member);
    const result = await memberRepository.delete({ id });
    return result.affected === 1;
  }

  async removeMany(ids: string[]): Promise<number> {
    if (!ids || ids.length === 0) return 0;
    const memberRepository = AppDataSource.getRepository(Member);
    const result = await memberRepository.delete({ id: In(ids) });
    return result.affected ?? 0;
  }

  async removeAll(): Promise<number> {
    const memberRepository = AppDataSource.getRepository(Member);
    const result = await memberRepository.delete({});
    return result.affected ?? 0;
  }

  async getStats(): Promise<{
    totalMembers: number;
    activeMembers: number;
    expiredMembers: number;
    newThisMonth: number;
    monthlyRevenue: number;
    expiringSoon: number;
    planDistribution: Record<string, number>;
  }> {
    const members = await this.list();
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const stats = {
      totalMembers: members.length,
      activeMembers: 0,
      expiredMembers: 0,
      newThisMonth: 0,
      monthlyRevenue: 0,
      expiringSoon: 0,
      planDistribution: Object.fromEntries(GYM_PLANS.map((plan) => [plan, 0])) as Record<string, number>
    };

    for (const member of members) {
      const status = member.membershipStatus?.toLowerCase();
      if (status === "active") stats.activeMembers += 1;
      if (status === "expired") stats.expiredMembers += 1;

      if (member.joinedAt && new Date(member.joinedAt) >= startOfMonth) {
        stats.newThisMonth += 1;
      }

      if (member.createdAt && new Date(member.createdAt) >= startOfMonth) {
        stats.monthlyRevenue += member.amountPaid ?? 0;
      }

      if (member.expiryAt) {
        const expiry = new Date(member.expiryAt);
        if (expiry >= now && expiry <= in7Days) {
          stats.expiringSoon += 1;
        }
      }

      if (member.membershipPlan) {
        const canonical = planLookup.get(member.membershipPlan.toLowerCase()) ?? member.membershipPlan;
        stats.planDistribution[canonical] = (stats.planDistribution[canonical] ?? 0) + 1;
      }
    }

    return stats;
  }
}