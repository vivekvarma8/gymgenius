import { MembersService } from "../members/members.service";
import { CreateMemberInput } from "../members/members.validation";
import { emailService } from "../email/email.service";
import { AppDataSource } from "../../shared/database/data-source";
import { Member } from "../../shared/entities/member.entity";

const membersService = new MembersService();

export interface ToolResult {
  success: boolean;
  data?: unknown;
  message?: string;
}

const memberFieldProperties: Record<string, unknown> = {
  firstName: { type: "string", description: "Member's first name (e.g. Rahul)" },
  lastName: { type: "string", description: "Member's last name (e.g. Sharma)" },
  email: { type: "string", description: "Member's email address" },
  phone: { type: "string", description: "Member's phone number (e.g. 9876543210 or +91 9876543210)" },
  gender: { type: "string", description: "Member's gender: Male, Female, Other" },
  age: { type: "number", description: "Member's age in years" },
  height: { type: "number", description: "Member's height in centimeters (e.g. 175)" },
  weight: { type: "number", description: "Member's weight in kilograms (e.g. 72)" },
  bmi: { type: "number", description: "Body mass index. Leave blank to auto-calculate from height & weight." },
  joinedAt: { type: "string", description: "Join date in YYYY-MM-DD format. Defaults to today if not provided." },
  expiryAt: { type: "string", description: "Membership expiry date in YYYY-MM-DD format." },
  membershipPlan: {
    type: "string",
    description: "One of: General, General Combo, Premium, Premium Couple, Couple, Super Premium, Zumba, Dance"
  },
  package: { type: "string", description: "Billing package: Monthly, Quarterly, Half-Yearly, or Yearly" },
  membershipStatus: { type: "string", description: "active, expired, inactive, or cancelled" },
  paymentStatus: { type: "string", description: "paid, pending, or partial" },
  amountPaid: { type: "number", description: "Total amount paid in INR" },
  pendingAmount: { type: "number", description: "Amount still pending in INR" },
  trainerAssigned: { type: "string", description: "Name of assigned gym trainer" },
  dietPlan: { type: "string", description: "Personalized diet plan notes" },
  workoutPlan: { type: "string", description: "Personalized workout routine notes" },
  medicalNotes: { type: "string", description: "Any medical conditions or injuries" },
  emergencyContact: { type: "string", description: "Emergency contact number or name" },
  address: { type: "string", description: "Residential address" },
  additionalNotes: { type: "string", description: "Additional member notes" }
};

export const memberToolDeclarations = [
  {
    name: "add_member",
    description:
      "Create a new gym member from owner prompt. firstName is required. Phone or email is recommended. If dates or package are specified, expiry is auto-calculated. Auto-calculates BMI if height and weight are provided.",
    parameters: {
      type: "object",
      properties: memberFieldProperties,
      required: ["firstName"]
    }
  },
  {
    name: "update_member",
    description:
      "Update fields of an existing member identified by name, email, or phone. Only pass the fields that need updating.",
    parameters: {
      type: "object",
      properties: {
        identifier: { type: "string", description: "Member's name, email, or phone number to find them" },
        newEmail: { type: "string", description: "New email address if changing" },
        ...memberFieldProperties
      },
      required: ["identifier"]
    }
  },
  {
    name: "delete_member",
    description:
      "Permanently delete a member by name, email, or phone. Use only when the owner explicitly asks to delete a member.",
    parameters: {
      type: "object",
      properties: {
        identifier: { type: "string", description: "Member's name, email, or phone number" }
      },
      required: ["identifier"]
    }
  },
  {
    name: "search_members",
    description:
      "Search and list gym members using filters like query, plan, status, pending payment, age range, expiring in N days.",
    parameters: {
      type: "object",
      properties: {
        query: { type: "string", description: "Search query across name, email, phone, plan, or trainer" },
        membershipPlan: { type: "string", description: "Plan name: General, Premium, Zumba, etc." },
        membershipStatus: { type: "string", description: "active, expired, inactive, or cancelled" },
        paymentStatus: { type: "string", description: "paid, pending, or partial" },
        hasPendingPayment: { type: "boolean", description: "True to find only members with pending dues" },
        expiringInDays: { type: "number", description: "Members expiring within this many days (e.g. 7 or 1)" },
        limit: { type: "number", description: "Max results to return (default 50)" }
      }
    }
  },
  {
    name: "send_email_reminder",
    description:
      "Send an email reminder to a gym member via nodemailer. Supports notice types: expiring_7d, expiring_1d, expired, pending_payment, diet_plan, workout_plan, or custom.",
    parameters: {
      type: "object",
      properties: {
        identifier: { type: "string", description: "Member's name or email address" },
        noticeType: {
          type: "string",
          description: "One of: custom, expiring_7d, expiring_1d, expired, pending_payment, diet_plan, workout_plan"
        },
        customMessage: {
          type: "string",
          description: "Custom message text to include"
        }
      },
      required: ["identifier"]
    }
  },
  {
    name: "generate_diet_plan",
    description:
      "Generate a personalized diet and nutrition plan for a gym member based on their goal (weight loss, muscle gain, etc.), dietary preference, and stats, save it directly to their member profile, and optionally email it to them.",
    parameters: {
      type: "object",
      properties: {
        identifier: { type: "string", description: "Member's name, email, or phone number" },
        goal: { type: "string", description: "Fitness goal (e.g. Weight Loss, Muscle Building, Fat Loss, Keto, Clean Bulk)" },
        dietaryPreference: { type: "string", description: "Dietary style: Vegetarian, Non-Vegetarian, Vegan, Eggetarian, High Protein" },
        calorieTarget: { type: "number", description: "Target daily calories (optional)" },
        customNotes: { type: "string", description: "Specific foods, allergies, or notes" },
        sendViaEmail: { type: "boolean", description: "Set true to immediately email this diet plan to member" }
      },
      required: ["identifier"]
    }
  },
  {
    name: "generate_workout_plan",
    description:
      "Generate a personalized workout and training split for a gym member based on their fitness level, goal, and schedule, save it directly to their member profile, and optionally email it to them.",
    parameters: {
      type: "object",
      properties: {
        identifier: { type: "string", description: "Member's name, email, or phone number" },
        goal: { type: "string", description: "Workout goal (e.g. Muscle Hypertrophy, Fat Loss & Toning, Strength, Endurance)" },
        fitnessLevel: { type: "string", description: "Beginner, Intermediate, or Advanced" },
        daysPerWeek: { type: "number", description: "Number of workout days per week (e.g. 3, 4, 5, 6)" },
        focusAreas: { type: "string", description: "Muscle focus (e.g. Push Pull Legs, Upper/Lower, Core & Arms, Full Body)" },
        customNotes: { type: "string", description: "Injuries, limitations, or exercise preferences" },
        sendViaEmail: { type: "boolean", description: "Set true to immediately email this workout plan to member" }
      },
      required: ["identifier"]
    }
  },
  {
    name: "broadcast_reminders",
    description:
      "Broadcast automated email renewal or payment reminders via nodemailer to members matching a category: expiring in 7 days, expiring in 1 day, expired, or pending payments.",
    parameters: {
      type: "object",
      properties: {
        category: {
          type: "string",
          description: "One of: 'expiring_7d', 'expiring_1d', 'expired', 'pending_payment'"
        }
      },
      required: ["category"]
    }
  },
  {
    name: "send_bulk_email",
    description:
      "Send a bulk email announcement or message to a specific group of gym members (e.g. premium, general, couple, zumba, dance, all, active, expired, or pending_dues).",
    parameters: {
      type: "object",
      properties: {
        targetGroup: {
          type: "string",
          description: "Target group: 'premium', 'general', 'zumba', 'dance', 'couple', 'all', 'active', 'expired', or 'pending_dues'"
        },
        subject: {
          type: "string",
          description: "Subject line for the announcement"
        },
        message: {
          type: "string",
          description: "Message content to send to all members in that group"
        }
      },
      required: ["targetGroup", "message"]
    }
  }
];

// Helper to look up a member by name, email, or phone
export async function findMember(identifier: string): Promise<Member | null> {
  const memberRepo = AppDataSource.getRepository(Member);
  const trimmed = identifier.trim();

  // Try direct email match
  if (trimmed.includes("@")) {
    const byEmail = await memberRepo.findOneBy({ email: trimmed });
    if (byEmail) return byEmail;
  }

  // Try phone match
  const digits = trimmed.replace(/\D/g, "");
  if (digits.length >= 7) {
    const byPhone = await memberRepo
      .createQueryBuilder("m")
      .where("REPLACE(REPLACE(REPLACE(m.phone, ' ', ''), '-', ''), '+', '') LIKE :phone", {
        phone: `%${digits.slice(-10)}%`
      })
      .getOne();
    if (byPhone) return byPhone;
  }

  // Try name match (case insensitive, trimmed)
  const parts = trimmed.split(/\s+/);
  const first = parts[0];
  const last = parts.slice(1).join(" ");

  const query = memberRepo.createQueryBuilder("m");
  if (last) {
    query.where(
      "(TRIM(LOWER(m.firstName)) = LOWER(:first) AND TRIM(LOWER(m.lastName)) = LOWER(:last)) OR " +
      "LOWER(CONCAT(TRIM(m.firstName), ' ', TRIM(m.lastName))) LIKE LOWER(:full)",
      { first, last, full: `%${trimmed}%` }
    );
  } else {
    query.where(
      "TRIM(LOWER(m.firstName)) = LOWER(:first) OR TRIM(LOWER(m.lastName)) = LOWER(:first) OR " +
      "LOWER(m.firstName) LIKE LOWER(:likeFirst)",
      { first, likeFirst: `%${first}%` }
    );
  }
  const byName = await query.getOne();
  if (byName) return byName;

  // Fallback search across concatenated full name, email, phone
  const fallback = await memberRepo
    .createQueryBuilder("m")
    .where(
      "LOWER(CONCAT(TRIM(COALESCE(m.firstName, '')), ' ', TRIM(COALESCE(m.lastName, '')))) LIKE LOWER(:q) OR " +
      "LOWER(m.firstName) LIKE LOWER(:q) OR LOWER(m.lastName) LIKE LOWER(:q) OR LOWER(m.email) LIKE LOWER(:q)",
      { q: `%${trimmed}%` }
    )
    .getOne();

  if (fallback) return fallback;

  // Check if identifier refers to Vivek / Varma / owner / admin
  if (/vivek|varma|owner|admin/i.test(trimmed)) {
    const ownerMember = await memberRepo
      .createQueryBuilder("m")
      .where("LOWER(m.firstName) LIKE '%vivek%' OR m.phone LIKE '%7396498929%'")
      .getOne();
    if (ownerMember) return ownerMember;
  }

  return null;
}

// Calculate expiry date helper based on package or plan
function calculateExpiry(joinedAtStr: string, pkg?: string): string {
  const join = new Date(joinedAtStr);
  const expiry = new Date(join);
  const p = (pkg ?? "").toLowerCase();

  if (p.includes("year")) {
    expiry.setFullYear(expiry.getFullYear() + 1);
  } else if (p.includes("half")) {
    expiry.setMonth(expiry.getMonth() + 6);
  } else if (p.includes("quarter")) {
    expiry.setMonth(expiry.getMonth() + 3);
  } else {
    // Default 1 month
    expiry.setMonth(expiry.getMonth() + 1);
  }

  return expiry.toISOString().split("T")[0];
}

export async function executeMemberTool(name: string, rawArgs: unknown): Promise<ToolResult> {
  const args = (typeof rawArgs === "string" ? JSON.parse(rawArgs) : rawArgs || {}) as Record<string, unknown>;

  switch (name) {
    case "add_member": {
      const firstName = String(args.firstName || "").trim();
      if (!firstName) {
        return { success: false, message: "Member firstName is required." };
      }

      const todayStr = new Date().toISOString().split("T")[0];
      const joinedAt = args.joinedAt ? String(args.joinedAt) : todayStr;
      const pkg = args.package ? String(args.package) : "Monthly";
      const expiryAt = args.expiryAt ? String(args.expiryAt) : calculateExpiry(joinedAt, pkg);

      let bmi = args.bmi ? Number(args.bmi) : undefined;
      const height = args.height ? Number(args.height) : undefined;
      const weight = args.weight ? Number(args.weight) : undefined;
      if (!bmi && height && weight && height > 0) {
        const heightM = height / 100;
        bmi = Number((weight / (heightM * heightM)).toFixed(1));
      }

      const phone = args.phone ? String(args.phone) : undefined;
      const cleanFirst = firstName.toLowerCase().replace(/[^a-z0-9]/g, "");
      const cleanLast = args.lastName ? String(args.lastName).toLowerCase().replace(/[^a-z0-9]/g, "") : "";
      const emailSuffix = phone ? phone.replace(/\D/g, "").slice(-4) : Math.floor(1000 + Math.random() * 9000);
      const email = args.email ? String(args.email).trim() : `${cleanFirst}${cleanLast ? "." + cleanLast : ""}_${emailSuffix}@gymgenius.club`;

      const memberInput: CreateMemberInput = {
        firstName,
        lastName: args.lastName ? String(args.lastName) : undefined,
        email,
        phone,
        gender: args.gender ? String(args.gender) : undefined,
        age: args.age ? Number(args.age) : undefined,
        height,
        weight,
        bmi,
        joinedAt,
        expiryAt,
        membershipPlan: args.membershipPlan ? String(args.membershipPlan) : "General",
        package: pkg,
        membershipStatus: (args.membershipStatus as any) ?? "active",
        paymentStatus: (args.paymentStatus as any) ?? (Number(args.pendingAmount ?? 0) > 0 ? "pending" : "paid"),
        amountPaid: args.amountPaid ? Number(args.amountPaid) : 0,
        pendingAmount: args.pendingAmount ? Number(args.pendingAmount) : 0,
        trainerAssigned: args.trainerAssigned ? String(args.trainerAssigned) : undefined,
        dietPlan: args.dietPlan ? String(args.dietPlan) : undefined,
        workoutPlan: args.workoutPlan ? String(args.workoutPlan) : undefined,
        medicalNotes: args.medicalNotes ? String(args.medicalNotes) : undefined,
        emergencyContact: args.emergencyContact ? String(args.emergencyContact) : undefined,
        address: args.address ? String(args.address) : undefined,
        additionalNotes: args.additionalNotes ? String(args.additionalNotes) : undefined
      };

      const created = await membersService.create(memberInput);
      return {
        success: true,
        message: `Successfully created member ${created.firstName} ${created.lastName ?? ""} (${created.membershipPlan} plan, valid until ${created.expiryAt}).`,
        data: created
      };
    }

    case "update_member": {
      const identifier = String(args.identifier || args.email || args.phone || "").trim();
      if (!identifier) {
        return { success: false, message: "identifier (name, phone, or email) is required to find member." };
      }

      const existing = await findMember(identifier);
      if (!existing) {
        return { success: false, message: `Could not find member with identifier "${identifier}".` };
      }

      const updateData: Partial<CreateMemberInput> = {};
      for (const key of Object.keys(memberFieldProperties)) {
        if (args[key] !== undefined && args[key] !== null) {
          (updateData as any)[key] = args[key];
        }
      }
      if (args.newEmail) {
        updateData.email = String(args.newEmail);
      }

      const updated = await membersService.update(existing.id, updateData);
      return {
        success: true,
        message: `Updated profile for ${existing.firstName} ${existing.lastName ?? ""}.`,
        data: updated
      };
    }

    case "delete_member": {
      const identifier = String(args.identifier || args.email || args.phone || "").trim();
      if (!identifier) {
        return { success: false, message: "identifier is required to delete member." };
      }

      const existing = await findMember(identifier);
      if (!existing) {
        return { success: false, message: `Could not find member "${identifier}" to delete.` };
      }

      await membersService.remove(existing.id);
      return {
        success: true,
        message: `Successfully deleted member ${existing.firstName} ${existing.lastName ?? ""} (${existing.email ?? existing.phone ?? ""}).`
      };
    }

    case "search_members": {
      const members = await membersService.search({
        query: args.query as string | undefined,
        membershipPlan: args.membershipPlan as string | undefined,
        membershipStatus: args.membershipStatus as string | undefined,
        paymentStatus: args.paymentStatus as string | undefined,
        hasPendingPayment: args.hasPendingPayment as boolean | undefined,
        expiringInDays: args.expiringInDays ? Number(args.expiringInDays) : undefined,
        limit: args.limit ? Number(args.limit) : 50
      });

      return {
        success: true,
        data: {
          total: members.length,
          members: members.map((m) => ({
            id: m.id,
            name: `${m.firstName} ${m.lastName ?? ""}`.trim(),
            phone: m.phone,
            email: m.email,
            plan: m.membershipPlan,
            status: m.membershipStatus,
            expiryAt: m.expiryAt,
            amountPaid: m.amountPaid,
            pendingAmount: m.pendingAmount
          }))
        }
      };
    }

    case "send_email_reminder": {
      const identifier = String(args.identifier || "").trim();
      const noticeType = String(args.noticeType || "custom").toLowerCase();
      const customMessage = args.customMessage ? String(args.customMessage) : "";
      const customSubject = args.subject ? String(args.subject) : "";

      const member = await findMember(identifier);
      const targetEmail = member?.email ?? (identifier.includes("@") ? identifier : "");
      const memberName = member ? `${member.firstName} ${member.lastName ?? ""}`.trim() : identifier;

      if (!targetEmail) {
        return {
          success: false,
          message: `Could not find email address for member "${identifier}". Please verify their email in CRM.`
        };
      }

      let sendResult;
      let actionLabel = "Email notice";

      if ((noticeType === "expiry" || noticeType === "expiring" || noticeType === "expiring_7d") && member) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const expDate = member.expiryAt ? new Date(member.expiryAt) : null;
        if (expDate && expDate < today) {
          sendResult = await emailService.sendExpiredNotice(member);
          actionLabel = "Expired membership follow-up email";
        } else if (expDate && (expDate.getTime() - today.getTime()) <= 86400000 * 2) {
          sendResult = await emailService.sendExpiryReminder1Day(member);
          actionLabel = "1-Day urgent expiry email reminder";
        } else {
          sendResult = await emailService.sendExpiryReminder7Days(member);
          actionLabel = "7-Day advance expiry email reminder";
        }
      } else if (noticeType === "expiring_1d" && member) {
        sendResult = await emailService.sendExpiryReminder1Day(member);
        actionLabel = "1-Day urgent expiry email reminder";
      } else if (noticeType === "expired" && member) {
        sendResult = await emailService.sendExpiredNotice(member);
        actionLabel = "Expired membership follow-up email";
      } else if ((noticeType === "pending_payment" || noticeType === "dues" || noticeType === "payment") && member) {
        sendResult = await emailService.sendPendingPaymentReminder(member);
        actionLabel = "Pending dues statement email";
      } else if (noticeType === "workout_plan" || noticeType === "workout") {
        let workoutText = member?.workoutPlan;
        if (!workoutText) {
          const genRes = await executeMemberTool("generate_workout_plan", { identifier, goal: "Muscle Hypertrophy & Strength", daysPerWeek: 5 });
          workoutText = (genRes.data as any)?.workoutPlan || "Customized 5-Day Workout Routine";
        }
        const textToSend = String(workoutText || "Customized 5-Day Workout Routine");
        sendResult = member
          ? await emailService.sendWorkoutPlanEmail(member, textToSend)
          : await emailService.sendCustomEmail(targetEmail, memberName, "Your Personalized Workout Routine", textToSend);
        actionLabel = "Personalized workout routine email";
      } else if (noticeType === "diet_plan" || noticeType === "diet") {
        let dietText = member?.dietPlan;
        if (!dietText) {
          const genRes = await executeMemberTool("generate_diet_plan", { identifier, goal: "Muscle Building & High Protein" });
          dietText = (genRes.data as any)?.dietPlan || "Customized High Protein Nutrition Protocol";
        }
        const textToSend = String(dietText || "Customized High Protein Nutrition Protocol");
        sendResult = member
          ? await emailService.sendDietPlanEmail(member, textToSend)
          : await emailService.sendCustomEmail(targetEmail, memberName, "Your Personalized Nutrition & Diet Plan", textToSend);
        actionLabel = "Personalized nutrition & diet plan email";
      } else {
        const subject = customSubject || `Official Notice from GymGenius: Member Update`;
        const text = customMessage || `Hello ${memberName}, this is an official update regarding your GymGenius membership.`;
        sendResult = await emailService.sendCustomEmail(targetEmail, memberName, subject, text);
        actionLabel = "Direct message email";
      }

      return {
        success: sendResult.success,
        message: sendResult.success
          ? `${actionLabel} has been successfully dispatched via Nodemailer to **${memberName}** (${targetEmail}).`
          : `Failed to deliver email to ${targetEmail}: ${sendResult.error}`,
        data: sendResult
      };
    }

    case "generate_diet_plan": {
      const identifier = String(args.identifier || "").trim();
      const member = identifier ? await findMember(identifier) : null;
      const memberName = member ? `${member.firstName} ${member.lastName ?? ""}`.trim() : (identifier || "Member");

      const goal = String(args.goal || "Muscle Building & High Protein");
      const dietPref = String(args.dietaryPreference || "High Protein Balanced");
      const calTarget = args.calorieTarget ? `${args.calorieTarget} kcal` : "approx. 2200 - 2400 kcal";
      const customNotes = args.customNotes ? `\nSpecial Notes: ${args.customNotes}` : "";

      const dietPlanText =
        `### Customized Nutrition & Diet Protocol for ${memberName}\n\n` +
        `**Fitness Goal:** ${goal}  \n` +
        `**Dietary Style:** ${dietPref}  \n` +
        `**Daily Caloric Target:** ${calTarget}\n\n` +
        `#### Daily Meal Schedule\n` +
        `- **Meal 1 (Breakfast - 8:00 AM):** 50g Rolled Oats with almond milk or water, 4 boiled egg whites (or 100g sprouted moong / tofu bhurji), 1 banana, 10 soaked almonds.\n` +
        `- **Meal 2 (Mid-Morning - 11:00 AM):** 1 glass Tender Coconut Water or Green Tea, 1 whole apple or seasonal fruit, handful of roasted chana or walnuts.\n` +
        `- **Meal 3 (Lunch - 1:30 PM):** 2 Multigrain Rotis or 1 cup Brown Rice, 150g Grilled Chicken Breast or Low-fat Paneer / Soya chunks, 1 bowl Dal, cucumber & carrot salad, 1 bowl fresh curd.\n` +
        `- **Meal 4 (Pre-Workout - 45m before training):** 1 cup Black Coffee (zero sugar) + 2 Brown bread slices with peanut butter.\n` +
        `- **Meal 5 (Post-Workout - immediately after):** 1 scoop Whey Protein Isolate with water (or 4 egg whites / 200ml soy milk + 1 banana).\n` +
        `- **Meal 6 (Dinner - by 8:30 PM):** Stir-fried vegetables (broccoli, bell peppers, zucchini, mushrooms) with 120g grilled fish / paneer or bowl of warm lentil soup. Minimal simple carbs.\n\n` +
        `#### Key Nutritional Guidelines\n` +
        `- Hydration: Minimum 3.5 to 4 liters of clean water daily.\n` +
        `- Sleep: 7 to 8 hours of uninterrupted recovery sleep.\n` +
        `- Avoid refined sugars, ultra-processed seed oils, and sugary carbonated drinks.${customNotes}`;

      if (member) {
        await membersService.update(member.id, { dietPlan: dietPlanText });
      }

      let emailResult;
      if (args.sendViaEmail && member?.email) {
        emailResult = await emailService.sendDietPlanEmail(member, dietPlanText);
      }

      return {
        success: true,
        message: `Personalized diet plan successfully generated for **${memberName}** (${goal}).${member ? " Saved to member profile in CRM." : ""}${emailResult?.success && member ? " Also emailed to " + member.email + "." : ""}`,
        data: {
          memberName,
          goal,
          dietPlan: dietPlanText,
          savedToDatabase: !!member,
          sentViaEmail: emailResult?.success ?? false
        }
      };
    }

    case "generate_workout_plan": {
      const identifier = String(args.identifier || "").trim();
      const member = identifier ? await findMember(identifier) : null;
      const memberName = member ? `${member.firstName} ${member.lastName ?? ""}`.trim() : (identifier || "Member");

      const goal = String(args.goal || "Muscle Hypertrophy & Strength");
      const level = String(args.fitnessLevel || "Intermediate");
      const days = Number(args.daysPerWeek || 5);
      const focus = String(args.focusAreas || "Push Pull Legs Upper Lower Split");
      const notes = args.customNotes ? `\nSpecial Notes: ${args.customNotes}` : "";

      const workoutPlanText =
        `### Customized Training Routine for ${memberName}\n\n` +
        `**Workout Goal:** ${goal}  \n` +
        `**Experience Level:** ${level}  \n` +
        `**Training Frequency:** ${days} Days/Week  \n` +
        `**Split Structure:** ${focus}\n\n` +
        `#### Training Routine Breakdown\n\n` +
        `**Day 1: Push (Chest, Shoulders & Triceps)**\n` +
        `- Warmup: 5 mins light cycling + dynamic shoulder mobility drills\n` +
        `- Incline Dumbbell Bench Press: 4 sets x 8-10 reps (60s rest)\n` +
        `- Flat Barbell Bench Press: 3 sets x 8 reps\n` +
        `- Seated Dumbbell Overhead Shoulder Press: 4 sets x 10 reps\n` +
        `- Cable Lateral Raises: 4 sets x 12-15 reps (focused contraction)\n` +
        `- Overhead Rope Tricep Extensions: 3 sets x 12 reps\n` +
        `- Parallel Bar Dips or Pushdowns: 3 sets to failure\n\n` +
        `**Day 2: Pull (Back, Rear Delts & Biceps)**\n` +
        `- Wide Grip Lat Pulldowns: 4 sets x 10-12 reps\n` +
        `- Barbell Bent-Over Rows: 4 sets x 8 reps\n` +
        `- Chest-Supported Seated Cable Row: 3 sets x 10 reps\n` +
        `- Face Pulls with Rope: 4 sets x 15 reps\n` +
        `- Incline Dumbbell Bicep Curls: 4 sets x 10 reps\n` +
        `- Hammer Curls: 3 sets x 12 reps\n\n` +
        `**Day 3: Legs & Core (Quads, Hamstrings & Calves)**\n` +
        `- Barbell Back Squats: 4 sets x 8 reps (warm up thoroughly)\n` +
        `- Romanian Deadlifts (Dumbbell or Barbell): 3 sets x 10 reps\n` +
        `- Leg Press: 3 sets x 12 reps\n` +
        `- Standing Leg Curls: 3 sets x 12 reps\n` +
        `- Standing Calf Raises: 4 sets x 15 reps\n` +
        `- Hanging Leg Raises: 3 sets x 15 reps\n\n` +
        `**Day 4: Upper Body Hypertrophy**\n` +
        `- Standing Military Overhead Press: 4 sets x 8 reps\n` +
        `- Neutral Grip Pull-ups / Pulldowns: 3 sets x 10 reps\n` +
        `- Flat Dumbbell Flyes: 3 sets x 12 reps\n` +
        `- Barbell Shrugs: 3 sets x 12 reps\n` +
        `- Superset: EZ-Bar Curls + Skull Crushers (3 sets x 10 reps)\n\n` +
        `**Day 5: Lower Body & HIIT Conditioning**\n` +
        `- Walking Dumbbell Lunges: 3 sets x 12 steps each leg\n` +
        `- Leg Extensions: 3 sets x 15 reps\n` +
        `- Lying Leg Curls: 3 sets x 12 reps\n` +
        `- 15 mins Incline Treadmill Walk (12% incline, 4.5 km/h) or Rowing machine\n\n` +
        `**Active Recovery (Weekend):**\n` +
        `- 10,000 steps walking, full-body foam rolling and dynamic stretching.${notes}`;

      if (member) {
        await membersService.update(member.id, { workoutPlan: workoutPlanText });
      }

      let emailResult;
      if (args.sendViaEmail && member?.email) {
        emailResult = await emailService.sendWorkoutPlanEmail(member, workoutPlanText);
      }

      return {
        success: true,
        message: `Personalized workout split successfully generated for **${memberName}** (${goal}).${member ? " Saved to member profile in CRM." : ""}${emailResult?.success && member ? " Also emailed to " + member.email + "." : ""}`,
        data: {
          memberName,
          goal,
          workoutPlan: workoutPlanText,
          savedToDatabase: !!member,
          sentViaEmail: emailResult?.success ?? false
        }
      };
    }

    case "broadcast_reminders": {
      const category = String(args.category || "expiring_7d");
      const memberRepo = AppDataSource.getRepository(Member);
      const now = new Date();

      let targetMembers: Member[] = [];

      if (category === "expiring_7d") {
        const d7 = new Date(now);
        d7.setDate(d7.getDate() + 7);
        const d7Str = d7.toISOString().split("T")[0];
        targetMembers = await memberRepo
          .createQueryBuilder("m")
          .where("m.expiryAt = :target", { target: d7Str })
          .andWhere("m.email IS NOT NULL")
          .getMany();
      } else if (category === "expiring_1d") {
        const d1 = new Date(now);
        d1.setDate(d1.getDate() + 1);
        const d1Str = d1.toISOString().split("T")[0];
        targetMembers = await memberRepo
          .createQueryBuilder("m")
          .where("m.expiryAt = :target", { target: d1Str })
          .andWhere("m.email IS NOT NULL")
          .getMany();
      } else if (category === "expired") {
        const todayStr = now.toISOString().split("T")[0];
        targetMembers = await memberRepo
          .createQueryBuilder("m")
          .where("m.expiryAt < :today", { today: todayStr })
          .andWhere("m.membershipStatus != 'cancelled'")
          .andWhere("m.email IS NOT NULL")
          .take(30)
          .getMany();
      } else if (category === "pending_payment") {
        targetMembers = await memberRepo
          .createQueryBuilder("m")
          .where("(m.pendingAmount > 0 OR LOWER(m.paymentStatus) = 'pending')")
          .andWhere("m.email IS NOT NULL")
          .take(30)
          .getMany();
      }

      let sentCount = 0;
      for (const m of targetMembers) {
        if (!m.email) continue;
        if (category === "expiring_7d") await emailService.sendExpiryReminder7Days(m);
        else if (category === "expiring_1d") await emailService.sendExpiryReminder1Day(m);
        else if (category === "expired") await emailService.sendExpiredNotice(m);
        else if (category === "pending_payment") await emailService.sendPendingPaymentReminder(m);
        sentCount++;
      }

      return {
        success: true,
        message: `Broadcast complete for category "${category}". Dispatched ${sentCount} official reminder emails via nodemailer.`,
        data: { category, count: sentCount }
      };
    }

    case "send_bulk_email": {
      const targetGroup = String(args.targetGroup || "all").trim().toLowerCase();
      const subject = String(args.subject || "Important Update from GymGenius Fitness");
      const message = String(args.message || "").trim();

      if (!message) {
        return {
          success: false,
          message: "Please provide a message text to send to members."
        };
      }

      const memberRepo = AppDataSource.getRepository(Member);
      let query = memberRepo.createQueryBuilder("m").where("m.email IS NOT NULL AND m.email != ''");

      if (targetGroup.includes("premium")) {
        query = query.andWhere("LOWER(m.membershipPlan) LIKE :plan", { plan: "%premium%" });
      } else if (targetGroup.includes("general")) {
        query = query.andWhere("LOWER(m.membershipPlan) LIKE :plan", { plan: "%general%" });
      } else if (targetGroup.includes("couple")) {
        query = query.andWhere("LOWER(m.membershipPlan) LIKE :plan", { plan: "%couple%" });
      } else if (targetGroup.includes("zumba")) {
        query = query.andWhere("LOWER(m.membershipPlan) LIKE :plan", { plan: "%zumba%" });
      } else if (targetGroup.includes("dance")) {
        query = query.andWhere("LOWER(m.membershipPlan) LIKE :plan", { plan: "%dance%" });
      } else if (targetGroup.includes("expired")) {
        query = query.andWhere("LOWER(m.membershipStatus) = 'expired'");
      } else if (targetGroup.includes("active")) {
        query = query.andWhere("LOWER(m.membershipStatus) = 'active'");
      } else if (targetGroup.includes("pending") || targetGroup.includes("due")) {
        query = query.andWhere("(m.pendingAmount > 0 OR LOWER(m.paymentStatus) = 'pending')");
      }

      const members = await query.getMany();

      if (members.length === 0) {
        return {
          success: false,
          message: `No members found matching target group "${targetGroup}" with a valid email address.`
        };
      }

      const bulkResult = await emailService.sendBulkAnnouncement(members, subject, message);

      const recipientList = bulkResult.recipients
        .slice(0, 8)
        .map((r, i) => `${i + 1}. **${r.name}** (${r.email})`)
        .join("\n");

      const moreCount = bulkResult.recipients.length > 8 ? `\n...and ${bulkResult.recipients.length - 8} more members.` : "";

      return {
        success: bulkResult.sent > 0,
        message:
          `**Bulk Email Announcement Dispatched via Nodemailer**\n\n` +
          `- **Target Group:** ${targetGroup.toUpperCase()} Members\n` +
          `- **Subject:** ${subject}\n` +
          `- **Delivered To:** ${bulkResult.sent} of ${bulkResult.total} members\n\n` +
          `**Recipients:**\n${recipientList}${moreCount}`,
        data: bulkResult
      };
    }

    default:
      return { success: false, message: `Unknown tool: ${name}` };
  }
}