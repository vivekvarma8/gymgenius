import "reflect-metadata";
import { createApp } from "./app";
import { config } from "./config";
import { AppDataSource } from "./shared/database/data-source";
import { seedAdminUser } from "./shared/database/seed-admin";
import { seedMembers } from "./shared/database/seed-members";
import { startDailyReminderCron } from "./modules/notifications/reminder.cron";

async function start(): Promise<void> {
  await AppDataSource.initialize();
  await AppDataSource.runMigrations();
  await seedAdminUser();
  await seedMembers();
  startDailyReminderCron();

  const app = createApp();
  const port = config.server.port;

  app.listen(port, () => {
    console.log(`GymGenius API listening on port ${port}`);
  });
}

start().catch((error) => {
  console.error("Failed to start application", error);
  process.exit(1);
});
