import cron from "node-cron";
import { AppDataSource } from "../../shared/database/data-source";
import { Member } from "../../shared/entities/member.entity";
import { emailService } from "../email/email.service";

function toDateString(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export interface ReminderJobResult {
  sevenDayCount: number;
  oneDayCount: number;
  expiredCount?: number;
  pendingPaymentCount?: number;
  timestamp: string;
}

/**
 * Runs the daily scan for members expiring in 7 days and 1 day,
 * and delivers official reminders through nodemailer emailService.
 */
export async function runDailyExpiryReminders(): Promise<ReminderJobResult> {
  const memberRepo = AppDataSource.getRepository(Member);
  const now = new Date();

  // 1. Members expiring in 7 days
  const date7 = new Date(now);
  date7.setDate(date7.getDate() + 7);
  const date7Str = toDateString(date7);

  // 2. Members expiring in 1 day (tomorrow)
  const date1 = new Date(now);
  date1.setDate(date1.getDate() + 1);
  const date1Str = toDateString(date1);

  console.log(`[Expiry Cron] Running daily scan at 6:00 AM. 7-day target: ${date7Str}, 1-day target: ${date1Str}`);

  // Query members expiring in 7 days
  const expiring7 = await memberRepo
    .createQueryBuilder("member")
    .where("member.expiryAt = :target", { target: date7Str })
    .andWhere("member.email IS NOT NULL")
    .andWhere("member.email != ''")
    .getMany();

  // Query members expiring in 1 day
  const expiring1 = await memberRepo
    .createQueryBuilder("member")
    .where("member.expiryAt = :target", { target: date1Str })
    .andWhere("member.email IS NOT NULL")
    .andWhere("member.email != ''")
    .getMany();

  let sevenDayCount = 0;
  for (const member of expiring7) {
    if (member.email) {
      await emailService.sendExpiryReminder7Days(member);
      sevenDayCount++;
    }
  }

  let oneDayCount = 0;
  for (const member of expiring1) {
    if (member.email) {
      await emailService.sendExpiryReminder1Day(member);
      oneDayCount++;
    }
  }

  console.log(`[Expiry Cron] 6:00 AM Scan Complete. Dispatched ${sevenDayCount} 7-day email reminders and ${oneDayCount} 1-day email reminders.`);

  return {
    sevenDayCount,
    oneDayCount,
    timestamp: new Date().toISOString()
  };
}

/**
 * Initializes the node-cron scheduled job to run every morning at 6:00 AM ('0 6 * * *')
 */
export function startDailyReminderCron(): void {
  // '0 6 * * *' = At 06:00 every day
  const schedule = "0 6 * * *";

  cron.schedule(schedule, async () => {
    try {
      console.log(`[Cron Scheduler] Triggering 6:00 AM daily expiry reminder routine...`);
      await runDailyExpiryReminders();
    } catch (error) {
      console.error("[Cron Scheduler] Error running daily expiry reminder routine:", error);
    }
  });

  console.log(`[Cron Scheduler] Registered daily expiry reminder job for 6:00 AM every morning (${schedule}).`);
}
