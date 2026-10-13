import { config } from "../../config";
import { Member } from "../../shared/entities/member.entity";

export interface SendMessageResult {
  success: boolean;
  to: string;
  phone: string;
  sender: string;
  message: string;
  waLink: string;
  webLink: string;
  type: string;
  timestamp: string;
  error?: string;
}

export interface DispatchedLogEntry extends SendMessageResult {
  id: string;
  memberName?: string;
}

// In-memory log of recent dispatched WhatsApp messages for audit and dashboard visibility
const dispatchLog: DispatchedLogEntry[] = [];

export class WhatsAppService {
  private senderPhone: string;
  private gymName: string;

  constructor() {
    this.senderPhone = "+91 7396498929";
    this.gymName = "GymGenius Fitness";
  }

  /**
   * Normalizes a phone number into international WhatsApp format (e.g. 917396498929)
   */
  normalizePhone(phone: string): string {
    const cleaned = phone.replace(/\D/g, "");
    if (cleaned.length === 10) {
      return `91${cleaned}`;
    }
    return cleaned;
  }

  getSenderPhone(): string {
    return this.senderPhone;
  }

  formatDate(date?: Date | string | null): string {
    if (!date) return "N/A";
    const d = new Date(date);
    if (isNaN(d.getTime())) return String(date);
    return d.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric"
    });
  }

  // --- CUSTOM TEMPLATE GENERATORS ---

  /**
   * 7 Days before expiry reminder
   */
  buildExpiring7DaysMessage(member: Member | { firstName: string; lastName?: string; membershipPlan?: string; expiryAt?: Date | string }): string {
    const name = `${member.firstName}${member.lastName ? " " + member.lastName : ""}`;
    const plan = member.membershipPlan ?? "Gym";
    const expiryStr = this.formatDate(member.expiryAt);

    return (
      `*${this.gymName} - Membership Renewal Notice*\n\n` +
      `Hello ${name},\n\n` +
      `Your ${plan} membership is scheduled to expire in 7 days on ${expiryStr}.\n\n` +
      `Renew early to lock in your rate and keep your workout routine uninterrupted.\n\n` +
      `Reply to this message or WhatsApp us directly at ${this.senderPhone} to renew.\n\n` +
      `GymGenius Fitness Club`
    );
  }

  /**
   * 1 Day before expiry urgent reminder
   */
  buildExpiring1DayMessage(member: Member | { firstName: string; lastName?: string; membershipPlan?: string; expiryAt?: Date | string }): string {
    const name = `${member.firstName}${member.lastName ? " " + member.lastName : ""}`;
    const plan = member.membershipPlan ?? "Gym";
    const expiryStr = this.formatDate(member.expiryAt);

    return (
      `*${this.gymName} - Urgent Renewal Notice: 1 Day Remaining*\n\n` +
      `Hello ${name},\n\n` +
      `This is a priority reminder that your ${plan} membership expires tomorrow (${expiryStr}).\n\n` +
      `Please renew today to avoid any interruption in your biometric entry and gym access.\n\n` +
      `Contact & Quick Renewal: ${this.senderPhone}\n\n` +
      `GymGenius Fitness Club`
    );
  }

  /**
   * Membership expired follow-up notice
   */
  buildExpiredMessage(member: Member | { firstName: string; lastName?: string; membershipPlan?: string; expiryAt?: Date | string }): string {
    const name = `${member.firstName}${member.lastName ? " " + member.lastName : ""}`;
    const plan = member.membershipPlan ?? "Gym";
    const expiryStr = this.formatDate(member.expiryAt);

    return (
      `*${this.gymName} - Membership Expired*\n\n` +
      `Hello ${name},\n\n` +
      `Your ${plan} membership expired on ${expiryStr}.\n\n` +
      `Renew your plan to reactivate your gym access and continue your training goals.\n\n` +
      `WhatsApp our front desk at ${this.senderPhone} to renew.\n\n` +
      `GymGenius Fitness Club`
    );
  }

  /**
   * Pending payment reminder
   */
  buildPendingPaymentMessage(member: Member | { firstName: string; lastName?: string; membershipPlan?: string; pendingAmount?: number }): string {
    const name = `${member.firstName}${member.lastName ? " " + member.lastName : ""}`;
    const plan = member.membershipPlan ?? "Gym";
    const dues = member.pendingAmount ?? 0;

    return (
      `*${this.gymName} - Pending Fee Reminder*\n\n` +
      `Hello ${name},\n\n` +
      `This is a reminder regarding your ${plan} membership. You have an outstanding balance of Rs. ${dues}.\n\n` +
      `Kindly clear your pending dues at the gym counter or via UPI at your earliest convenience to keep your account active.\n\n` +
      `For payment details or UPI QR code, WhatsApp us at ${this.senderPhone}.\n\n` +
      `Thank you.`
    );
  }

  /**
   * Personalized diet plan delivery
   */
  buildDietPlanMessage(member: Member | { firstName: string; lastName?: string }, dietPlanText: string): string {
    const name = `${member.firstName}${member.lastName ? " " + member.lastName : ""}`;

    return (
      `*${this.gymName} - Personalized Nutrition Plan*\n\n` +
      `Hello ${name},\n\n` +
      `Here is your custom diet program designed for your fitness goals:\n\n` +
      `${dietPlanText}\n\n` +
      `Hydration: Drink at least 3-4 liters of water daily.\n` +
      `Questions or dietary adjustments? Chat with our trainers at ${this.senderPhone}.\n\n` +
      `GymGenius Fitness Club`
    );
  }

  /**
   * Personalized workout plan delivery
   */
  buildWorkoutPlanMessage(member: Member | { firstName: string; lastName?: string }, workoutPlanText: string): string {
    const name = `${member.firstName}${member.lastName ? " " + member.lastName : ""}`;

    return (
      `*${this.gymName} - Personalized Workout Split*\n\n` +
      `Hello ${name},\n\n` +
      `Here is your custom training split:\n\n` +
      `${workoutPlanText}\n\n` +
      `Proper form and control come before heavy weight. Stay consistent.\n` +
      `Need guidance on any exercise? Contact us at ${this.senderPhone}.\n\n` +
      `GymGenius Fitness Club`
    );
  }

  /**
   * Dispatches a message to the target recipient phone without using WhatsApp Cloud API.
   * Generates direct wa.me and WhatsApp Web links and logs the dispatch.
   */
  async sendMessage(
    recipient: string,
    message: string,
    type: string = "custom",
    memberName?: string
  ): Promise<SendMessageResult> {
    const cleanPhone = this.normalizePhone(recipient);
    if (!cleanPhone || cleanPhone.length < 8) {
      return {
        success: false,
        to: recipient,
        phone: cleanPhone,
        sender: this.senderPhone,
        message,
        waLink: "",
        webLink: "",
        type,
        timestamp: new Date().toISOString(),
        error: `Invalid phone number: ${recipient}`
      };
    }

    const encoded = encodeURIComponent(message);
    const waLink = `https://wa.me/${cleanPhone}?text=${encoded}`;
    const webLink = `https://web.whatsapp.com/send?phone=${cleanPhone}&text=${encoded}`;

    const result: SendMessageResult = {
      success: true,
      to: recipient,
      phone: cleanPhone,
      sender: this.senderPhone,
      message,
      waLink,
      webLink,
      type,
      timestamp: new Date().toISOString()
    };

    // Store in dispatch log
    dispatchLog.unshift({
      ...result,
      id: `wa_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      memberName
    });

    if (dispatchLog.length > 200) {
      dispatchLog.pop();
    }

    console.log(`[WhatsApp Dispatch] Dispatched (${type}) to ${cleanPhone} from ${this.senderPhone}`);

    // Automatically launch WhatsApp Web / App on Windows if in local environment
    try {
      if (process.platform === "win32") {
        const { exec } = require("child_process");
        exec(`start "" "${waLink}"`);
      }
    } catch (err) {
      // Non-critical fallback
    }

    return result;
  }

  getRecentLogs(): DispatchedLogEntry[] {
    return dispatchLog;
  }
}

export const whatsAppService = new WhatsAppService();
