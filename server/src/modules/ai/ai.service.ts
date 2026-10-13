import { GoogleGenerativeAI } from "@google/generative-ai";
import { config } from "../../config";
import { memberToolDeclarations, executeMemberTool, findMember } from "./ai.tools";
import { emailService } from "../email/email.service";

interface ConversationEntry {
  role: "user" | "model";
  parts: Array<{ text?: string }>;
}

const SYSTEM_PROMPT = `You are GymGenius AI, the elite gym management and fitness training assistant for GymGenius Fitness.

Your primary specialties:
1. GENERATE WORKOUT ROUTINES: Design structured, professional gym workout splits (Push Pull Legs, Upper/Lower, Bro Split, Full Body, 3 to 6 days/week) with targeted exercises, sets, reps, warmups, and recovery guidelines.
2. GENERATE DIET & NUTRITION PLANS: Design personalized meal protocols (High Protein, Muscle Building, Fat Loss, Clean Bulk, Vegetarian, Vegan, Keto, Intermittent Fasting) with meal schedules, calorie estimations, and macronutrient balances.
3. SEARCH & FILTER MEMBERS: Search members across active status, expired, expiring in 7 days, pending payment dues, or specific membership packages.
4. MANAGE MEMBERS: Add new gym members or update member details when asked.
5. SEND EMAIL REMINDERS: Deliver official email notices (via nodemailer) for 7-day expiry, 1-day expiry, expired follow-ups, pending payment dues, workout plans, diet plans, or custom updates.
6. SEND BULK EMAIL ANNOUNCEMENTS: Broadcast custom announcements or messages via nodemailer to member groups (premium, general, zumba, dance, couple, active, expired, pending dues, or all).

Guidelines:
- Output clean, beautifully formatted Markdown with bold headings, clean bullet points, and organized sections.
- Strictly DO NOT use any emojis in your responses.
- Never mention WhatsApp; all notifications and reminders in GymGenius are sent via email through Nodemailer.
- Always be encouraging, authoritative, and professional.`;

const userConversations = new Map<string, ConversationEntry[]>();

export class AIService {
  private genAI: GoogleGenerativeAI | null = null;
  private lastApiKey: string = "";

  constructor() {
    if (config.ai.apiKey) {
      this.genAI = new GoogleGenerativeAI(config.ai.apiKey);
    }
  }

  private getClient(): GoogleGenerativeAI | null {
    const key = config.ai.apiKey;
    if (!key) return null;
    if (!this.genAI || this.lastApiKey !== key) {
      this.genAI = new GoogleGenerativeAI(key);
      this.lastApiKey = key;
    }
    return this.genAI;
  }

  /**
   * Fast deterministic handler for direct action requests (diet plans, workout splits, member filtering, email reminders).
   */
  private async tryDeterministicAction(userMessage: string): Promise<{ handled: boolean; reply: string }> {
    const msg = userMessage.trim().toLowerCase();

    // 1. BULK EMAIL ANNOUNCEMENT TO A GROUP
    // e.g. "send message to all the premium members", "send mail to all premium members: gym closed tomorrow", "send email to all members with pending dues"
    const isBulkGroup = (msg.includes("all ") || msg.includes("all the ") || msg.includes("every ") || msg.includes("bulk")) &&
      (msg.includes("premium") || msg.includes("general") || msg.includes("zumba") || msg.includes("dance") || msg.includes("couple") || msg.includes("expired") || msg.includes("pending") || msg.includes("member")) &&
      (msg.includes("send") || msg.includes("mail") || msg.includes("email") || msg.includes("message") || msg.includes("broadcast"));

    if (isBulkGroup) {
      let targetGroup = "all";
      if (msg.includes("premium")) targetGroup = "premium";
      else if (msg.includes("general")) targetGroup = "general";
      else if (msg.includes("zumba")) targetGroup = "zumba";
      else if (msg.includes("dance")) targetGroup = "dance";
      else if (msg.includes("couple")) targetGroup = "couple";
      else if (msg.includes("expired")) targetGroup = "expired";
      else if (msg.includes("active")) targetGroup = "active";
      else if (msg.includes("pending") || msg.includes("due")) targetGroup = "pending_dues";

      let customMsg = "";
      const colonIdx = userMessage.indexOf(":");
      if (colonIdx !== -1) {
        customMsg = userMessage.slice(colonIdx + 1).trim();
      } else {
        const quoteMatch = userMessage.match(/["'](.*?)["']/);
        if (quoteMatch) {
          customMsg = quoteMatch[1].trim();
        } else {
          const thatMatch = userMessage.match(/(?:that|saying|message|with)\s+(.*)$/i);
          if (thatMatch) customMsg = thatMatch[1].trim();
        }
      }

      if (!customMsg) {
        if (targetGroup === "premium") {
          customMsg = "Dear Premium Member, thank you for being a valued member of GymGenius Fitness. We have updated elite equipment and premium personal training sessions available for you on the gym floor.";
        } else if (targetGroup === "pending_dues") {
          customMsg = "Dear GymGenius Member, this is a friendly reminder to clear your pending membership dues at the front desk or via UPI to ensure your access is uninterrupted.";
        } else if (targetGroup === "expired") {
          customMsg = "We miss training with you at GymGenius Fitness! Visit the front desk this week to renew your membership and receive an updated workout routine.";
        } else {
          customMsg = "Dear GymGenius Member, this is an official announcement and update from the gym management team.";
        }
      }

      const toolRes = await executeMemberTool("send_bulk_email", {
        targetGroup,
        subject: `GymGenius Official Announcement: ${targetGroup.toUpperCase()} Members`,
        message: customMsg
      });

      return {
        handled: true,
        reply: toolRes.message || "Bulk email announcement dispatched successfully via Nodemailer."
      };
    }

    // 2. SEND DIRECT EMAIL TO A SPECIFIC MEMBER
    // e.g. "send mail to vivek varma about the expiry", "send workout plan to vivek varma", "send mail to vivek varma diet plan"
    const isDirectMemberEmail = (
      msg.includes("send mail") ||
      msg.includes("send email") ||
      msg.includes("send message") ||
      msg.includes("mail to") ||
      msg.includes("email to") ||
      msg.includes("send workout") ||
      msg.includes("send diet") ||
      (msg.includes("send") && (msg.includes("to ") || msg.includes("mail")))
    ) && !msg.includes("to all") && !msg.includes("to the all");

    if (isDirectMemberEmail) {
      let targetName = "";
      // Match pattern like "to Vivek Varma" or "for Vivek Varma"
      const toMatch = userMessage.match(/(?:to|for)\s+([a-zA-Z\s]+?)(?:\s+(?:about|regarding|with|his|her|the|diet|workout|plan|expiry|expired|pending)|:|$)/i);
      if (toMatch) {
        const candidate = toMatch[1].replace(/^(?:mail|email|message|to)\s+/i, "").trim();
        if (candidate && candidate.toLowerCase() !== "all" && candidate.toLowerCase() !== "the all" && candidate.toLowerCase() !== "members") {
          targetName = candidate;
        }
      }

      if (!targetName) {
        const generalMatch = userMessage.match(/(?:send\s+)?(?:mail|email|message)\s+(?:to\s+)?([a-zA-Z\s]+?)(?:\s+(?:about|regarding|with|for|his|her|the|diet|workout|plan|expiry|expired|pending)|:|$)/i);
        if (generalMatch) {
          const candidate = generalMatch[1].replace(/^(?:mail|email|message|to)\s+/i, "").trim();
          if (candidate && candidate.toLowerCase() !== "all" && candidate.toLowerCase() !== "members") {
            targetName = candidate;
          }
        }
      }

      if (targetName) {
        let noticeType = "custom";
        if (msg.includes("expiry") || msg.includes("expire") || msg.includes("renewal")) {
          noticeType = "expiry";
        } else if (msg.includes("workout plan") || msg.includes("workout routine") || msg.includes("workout split") || msg.includes("workout")) {
          noticeType = "workout_plan";
        } else if (msg.includes("diet plan") || msg.includes("diet") || msg.includes("nutrition")) {
          noticeType = "diet_plan";
        } else if (msg.includes("pending") || msg.includes("dues") || msg.includes("payment") || msg.includes("fee")) {
          noticeType = "pending_payment";
        }

        let customMsg = "";
        const colonIdx = userMessage.indexOf(":");
        if (colonIdx !== -1) {
          customMsg = userMessage.slice(colonIdx + 1).trim();
        }

        const toolRes = await executeMemberTool("send_email_reminder", {
          identifier: targetName,
          noticeType,
          customMessage: customMsg
        });

        return {
          handled: true,
          reply: toolRes.message || `Email notice processed successfully for ${targetName}.`
        };
      }
    }

    // 3. Direct Diet Plan Generation request
    if (
      msg.includes("diet plan") ||
      msg.includes("diet") ||
      msg.includes("nutrition plan") ||
      msg.includes("meal plan")
    ) {
      // Extract member name if specified (e.g. "for rahul" or "for rahul sharma")
      const forMatch = userMessage.match(/(?:for|to)\s+([a-zA-Z\s]+?)(?:\s+(?:and|with|diet|goal)|$)/i);
      const targetName = forMatch ? forMatch[1].trim() : "";

      let goal = "Muscle Building & High Protein";
      if (msg.includes("weight loss") || msg.includes("fat loss")) goal = "Fat Loss & Calorie Deficit";
      else if (msg.includes("bulk") || msg.includes("muscle")) goal = "Muscle Hypertrophy & Clean Bulk";
      else if (msg.includes("keto")) goal = "Ketogenic Low-Carb";
      else if (msg.includes("tone") || msg.includes("lean")) goal = "Lean Muscle Tone & Conditioning";

      let dietPref = "High Protein Balanced";
      if (msg.includes("veg") && !msg.includes("non")) dietPref = "High Protein Vegetarian";
      else if (msg.includes("vegan")) dietPref = "High Protein 100% Plant-Based Vegan";
      else if (msg.includes("non-veg") || msg.includes("chicken")) dietPref = "High Protein Non-Vegetarian";

      const toolRes = await executeMemberTool("generate_diet_plan", {
        identifier: targetName,
        goal,
        dietaryPreference: dietPref,
        sendViaEmail: false
      });

      const planData = toolRes.data as any;
      const planContent = planData?.dietPlan || toolRes.message;

      return {
        handled: true,
        reply: `${planContent}\n\n**Protocol Saved:** ${toolRes.message}`
      };
    }

    // 4. Direct Workout Plan Generation request
    if (
      msg.includes("workout plan") ||
      msg.includes("workout split") ||
      msg.includes("workout routine") ||
      msg.includes("training split") ||
      msg.includes("workout") ||
      msg.includes("exercise routine")
    ) {
      const forMatch = userMessage.match(/(?:for|to)\s+([a-zA-Z\s]+?)(?:\s+(?:and|with|workout|goal)|$)/i);
      const targetName = forMatch ? forMatch[1].trim() : "";

      let days = 5;
      const dayMatch = msg.match(/(\d+)\s*(?:-| )?day/);
      if (dayMatch) {
        days = Math.min(6, Math.max(3, Number(dayMatch[1])));
      }

      let goal = "Muscle Hypertrophy & Strength";
      if (msg.includes("fat loss") || msg.includes("cutting")) goal = "Fat Loss, Conditioning & Core";
      else if (msg.includes("strength") || msg.includes("power")) goal = "Strength & Powerlifting";

      const toolRes = await executeMemberTool("generate_workout_plan", {
        identifier: targetName,
        goal,
        daysPerWeek: days,
        sendViaEmail: false
      });

      const planData = toolRes.data as any;
      const planContent = planData?.workoutPlan || toolRes.message;

      return {
        handled: true,
        reply: `${planContent}\n\n**Protocol Saved:** ${toolRes.message}`
      };
    }

    // 5. Direct Email Reminder / Broadcast request
    if (
      msg.includes("email reminder") ||
      msg.includes("send reminder") ||
      msg.includes("send email") ||
      msg.includes("mail reminder")
    ) {
      // 7-day expiry
      if (msg.includes("7 day") || msg.includes("7-day") || msg.includes("seven day")) {
        const res = await executeMemberTool("broadcast_reminders", { category: "expiring_7d" });
        return {
          handled: true,
          reply: res.message || "7-Day expiry email reminders scan executed successfully via Nodemailer."
        };
      }
      // 1-day expiry
      if (msg.includes("1 day") || msg.includes("1-day") || msg.includes("urgent")) {
        const res = await executeMemberTool("broadcast_reminders", { category: "expiring_1d" });
        return {
          handled: true,
          reply: res.message || "1-Day urgent expiry email reminders scan executed successfully via Nodemailer."
        };
      }
      // Pending dues
      if (msg.includes("pending") || msg.includes("dues") || msg.includes("payment")) {
        const res = await executeMemberTool("broadcast_reminders", { category: "pending_payment" });
        return {
          handled: true,
          reply: res.message || "Pending balance email reminders scan executed successfully via Nodemailer."
        };
      }
    }

    // 4. Direct Member Filter / Search request
    if (
      msg.includes("filter") ||
      msg.includes("pending payment") ||
      msg.includes("expiring in 7 days") ||
      msg.includes("expired members") ||
      msg.includes("show members") ||
      msg.includes("list members")
    ) {
      const hasPending = msg.includes("pending");
      const isExpiring7 = msg.includes("7 days") || msg.includes("expiring");
      const isExpired = msg.includes("expired");

      let statusFilter: string | undefined;
      if (isExpired) statusFilter = "expired";
      else if (msg.includes("active")) statusFilter = "active";

      const res = await executeMemberTool("search_members", {
        hasPendingPayment: hasPending || undefined,
        expiringInDays: isExpiring7 ? 7 : undefined,
        membershipStatus: statusFilter,
        limit: 20
      });

      const memberData = res.data as any;
      const list = memberData?.members || [];

      if (list.length === 0) {
        return {
          handled: true,
          reply: `**Member Search Results**\n\nNo members found matching the specified criteria.`
        };
      }

      const rows = list
        .slice(0, 15)
        .map(
          (m: any, idx: number) =>
            `${idx + 1}. **${m.name}** | Plan: ${m.plan || "General"} | Status: ${m.status || "Active"} | Email: ${m.email || "N/A"}${m.pendingAmount > 0 ? " | Pending: INR " + m.pendingAmount : ""}`
        )
        .join("\n");

      return {
        handled: true,
        reply: `**Filtered Members (${list.length} found):**\n\n${rows}`
      };
    }

    return { handled: false, reply: "" };
  }

  async chat(userId: string, userMessage: string): Promise<{ reply: string }> {
    // 1. Check if user prompt is a direct intent that can be handled immediately
    const directAction = await this.tryDeterministicAction(userMessage);
    if (directAction.handled) {
      return { reply: directAction.reply };
    }

    const client = this.getClient();
    if (!config.ai.apiKey || !client) {
      return {
        reply:
          `**GymGenius AI Assistant Ready**\n\n` +
          `Available capabilities:\n` +
          `- **Generate Diet Plans**: "Generate a high-protein muscle building diet plan for Rahul"\n` +
          `- **Generate Workout Splits**: "Generate a 5-day workout routine for Rahul focusing on strength"\n` +
          `- **Filter Members**: "Show members with pending payments" or "Filter members expiring in 7 days"\n` +
          `- **Send Email Reminders**: "Send email reminder to member for pending dues"\n\n` +
          `Please enter an instruction or select a quick action.`
      };
    }

    // Valid Gemini models
    const candidateModels = [
      config.ai.model || "gemini-1.5-flash",
      "gemini-1.5-pro",
      "gemini-2.0-flash"
    ];

    for (const modelName of candidateModels) {
      try {
        const model = client.getGenerativeModel({
          model: modelName,
          systemInstruction: SYSTEM_PROMPT
        });

        if (!userConversations.has(userId)) {
          userConversations.set(userId, []);
        }
        const history = userConversations.get(userId)!;

        // Build conversation prompt with recent context
        const promptParts = [
          ...history.slice(-6).map((h) => `${h.role === "user" ? "Owner" : "GymGenius AI"}: ${h.parts[0]?.text ?? ""}`),
          `Owner: ${userMessage}`,
          `GymGenius AI:`
        ].join("\n\n");

        const result = await model.generateContent(promptParts);
        const replyText = result.response.text();

        // Save conversation history
        history.push({ role: "user", parts: [{ text: userMessage }] });
        history.push({ role: "model", parts: [{ text: replyText }] });
        if (history.length > 20) {
          history.splice(0, history.length - 20);
        }

        return { reply: replyText };
      } catch (err: any) {
        console.warn(`[AIService] Model ${modelName} error:`, err.message);
        continue;
      }
    }

    // Fallback if all Gemini models are busy
    const fallback = await this.tryDeterministicAction(userMessage);
    if (fallback.handled) {
      return { reply: fallback.reply };
    }

    return {
      reply:
        `**GymGenius AI Fitness Protocol**\n\n` +
        `I can create personalized workout splits and custom diet protocols for your gym members, filter member records, and send email reminders via Nodemailer.\n\n` +
        `Try typing:\n` +
        `- "Generate a high-protein diet plan for Rahul"\n` +
        `- "Generate a 5-day Push Pull Legs workout split"\n` +
        `- "Show members with pending payments"`
    };
  }

  resetConversation(userId: string): void {
    userConversations.delete(userId);
  }
}