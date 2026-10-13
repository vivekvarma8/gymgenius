import bcrypt from "bcryptjs";
import { AppDataSource } from "./data-source";
import { User } from "../entities/user.entity";
import { config } from "../../config";

export async function seedAdminUser(): Promise<void> {
  const repository = AppDataSource.getRepository(User);
  const passwordHash = await bcrypt.hash(config.auth.adminPassword, 10);

  // Check if admin with target email exists
  let admin = await repository.findOneBy({ email: config.auth.adminEmail });
  if (admin) {
    admin.passwordHash = passwordHash;
    admin.isActive = true;
    await repository.save(admin);
    return;
  }

  // Check if an existing admin exists under a previous email and update it
  admin = await repository.findOneBy({ role: "admin" });
  if (admin) {
    admin.email = config.auth.adminEmail;
    admin.passwordHash = passwordHash;
    admin.isActive = true;
    await repository.save(admin);
    return;
  }

  // Otherwise create new admin user
  const newAdmin = repository.create({
    email: config.auth.adminEmail,
    passwordHash,
    role: "admin",
    isActive: true
  });

  await repository.save(newAdmin);
}
