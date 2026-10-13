import { AppDataSource } from "./data-source";
import { Member } from "../entities/member.entity";
import { config } from "../../config";

function generateDummyMembers(count: number): Partial<Member>[] {
  const members: Partial<Member>[] = [];
  for (let index = 1; index <= count; index += 1) {
    const padded = String(index).padStart(3, "0");
    members.push({
      firstName: `Member${padded}`,
      lastName: `Test${padded}`,
      email: `member${padded}@example.com`,
      phone: `+1000000${String(index).padStart(3, "0")}`,
      joinedAt: new Date(2024, 0, (index % 28) + 1),
      metadata: {
        plan: index % 3 === 0 ? "Premium" : "Standard",
        status: index % 4 === 0 ? "inactive" : "active"
      }
    });
  }
  return members;
}

export async function seedMembers(): Promise<void> {
  // Dummy data is a local-dev convenience only. Never auto-insert fake members
  // outside development — a fresh production/staging DB should start empty.
  if (config.server.nodeEnv !== "development") {
    return;
  }

  const repository = AppDataSource.getRepository(Member);
  const existingCount = await repository.count();
  if (existingCount > 0) {
    return;
  }

  const dummyMembers = generateDummyMembers(200);
  const members = repository.create(dummyMembers);
  await repository.save(members);
}