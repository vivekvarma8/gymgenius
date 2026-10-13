import { emailService, SendEmailResult, EmailLogEntry } from "../email/email.service";
import { findMember } from "../ai/ai.tools";
import { runDailyExpiryReminders, ReminderJobResult } from "../notifications/reminder.cron";

export class MessageService {
  async sendMemberMessage(
    recipientIdentifier: string,
    intent: string,
    customText?: string
  ): Promise<{ success: boolean; detail: string; data?: SendEmailResult }> {
    const member = await findMember(recipientIdentifier);
    const targetEmail = member?.email ?? (recipientIdentifier.includes("@") ? recipientIdentifier : "");
    const memberName = member ? `${member.firstName} ${member.lastName ?? ""}`.trim() : recipientIdentifier;

    if (!targetEmail) {
      return {
        success: false,
        detail: `No valid email address found for member "${recipientIdentifier}".`
      };
    }

    let sendResult: SendEmailResult;

    if (intent === "expiring_7d" && member) {
      sendResult = await emailService.sendExpiryReminder7Days(member);
    } else if (intent === "expiring_1d" && member) {
      sendResult = await emailService.sendExpiryReminder1Day(member);
    } else if (intent === "expired" && member) {
      sendResult = await emailService.sendExpiredNotice(member);
    } else if (intent === "pending_payment" && member) {
      sendResult = await emailService.sendPendingPaymentReminder(member);
    } else if (intent === "diet_plan" && member && member.dietPlan) {
      sendResult = await emailService.sendDietPlanEmail(member, member.dietPlan);
    } else if (intent === "workout_plan" && member && member.workoutPlan) {
      sendResult = await emailService.sendWorkoutPlanEmail(member, member.workoutPlan);
    } else {
      const subject = `Official Notice from GymGenius: ${intent.replace(/_/g, " ").toUpperCase()}`;
      const text = customText ?? `Hello ${memberName}, this is an official message from GymGenius regarding your membership.`;
      sendResult = await emailService.sendEmail(targetEmail, subject, `<p>${text}</p>`, text);
    }

    if (!sendResult.success) {
      return { success: false, detail: sendResult.error || "Failed to send email.", data: sendResult };
    }

    return {
      success: true,
      detail: `Email notification sent successfully to ${sendResult.to}.`,
      data: sendResult
    };
  }

  getLogs(): EmailLogEntry[] {
    return emailService.getRecentLogs();
  }

  async runDailyScan(): Promise<ReminderJobResult> {
    return runDailyExpiryReminders();
  }
}

