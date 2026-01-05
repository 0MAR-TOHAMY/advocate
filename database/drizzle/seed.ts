import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";
import { nanoid } from "nanoid";

import {
  firms,
  users,
  clients,
  subscriptionPlans,

  cases,
  generalWork,
  events,
  documents,
  notes,
  caseUpdates,
  reminders,
  hearings,
  judgments,
  calendars,
  calendarEvents,
} from "../schema/index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: resolve(__dirname, "../config/.env") });

const DATABASE_URL = process.env.DATABASE_URL || "postgresql://root:strongpassword@localhost:5432/legal_case_manager";

async function seed() {
  console.log("🌱 Starting database seed...");

  const client = postgres(DATABASE_URL);
  const db = drizzle(client);

  try {
    console.log("📦 Seeding subscription plans...");

    const freePlanId = nanoid();
    const essentialPlanId = nanoid();
    const professionalPlanId = nanoid();
    const enterprisePlanId = nanoid();

    await db.insert(subscriptionPlans).values([
      {
        id: freePlanId,
        planType: "free",
        name: "Free Trial",
        description: "45-day free trial - Perfect for trying out the platform",
        price: "0.00",
        currency: "USD",
        billingPeriod: "monthly",
        trialDays: 45,
        maxCases: 10,
        maxStorageGB: 2,
        maxUsers: 2,
        hasAdvancedAutomation: false,
        hasClientPortal: false,
        hasApiAccess: false,
        hasPrioritySupport: false,
        hasDedicatedAccountManager: false,
        hasCustomIntegrations: false,
        hasWhiteLabel: false,
        isActive: true,
      },
      {
        id: essentialPlanId,
        planType: "essential",
        name: "Essential",
        description: "Perfect for solo practitioners and small firms",
        price: "49.00",
        currency: "USD",
        billingPeriod: "monthly",
        trialDays: 14,
        maxCases: 50,
        maxStorageGB: 10,
        maxUsers: 3,
        hasAdvancedAutomation: false,
        hasClientPortal: false,
        hasApiAccess: false,
        hasPrioritySupport: false,
        hasDedicatedAccountManager: false,
        hasCustomIntegrations: false,
        hasWhiteLabel: false,
        isActive: true,
      },
      {
        id: professionalPlanId,
        planType: "professional",
        name: "Professional",
        description: "For growing firms with advanced needs",
        price: "99.00",
        currency: "USD",
        billingPeriod: "monthly",
        trialDays: 14,
        maxCases: 200,
        maxStorageGB: 50,
        maxUsers: 10,
        hasAdvancedAutomation: true,
        hasClientPortal: true,
        hasApiAccess: true,
        hasPrioritySupport: true,
        hasDedicatedAccountManager: false,
        hasCustomIntegrations: false,
        hasWhiteLabel: false,
        isActive: true,
      },
      {
        id: enterprisePlanId,
        planType: "enterprise",
        name: "Enterprise",
        description: "Unlimited power for large firms",
        price: "199.00",
        currency: "USD",
        billingPeriod: "monthly",
        trialDays: 14,
        maxCases: null,
        maxStorageGB: null,
        maxUsers: null,
        hasAdvancedAutomation: true,
        hasClientPortal: true,
        hasApiAccess: true,
        hasPrioritySupport: true,
        hasDedicatedAccountManager: true,
        hasCustomIntegrations: true,
        hasWhiteLabel: true,
        isActive: true,
      },
    ]);

    console.log("🏢 Seeding demo firm...");

    const demoFirmId = nanoid();
    await db.insert(firms).values({
      id: demoFirmId,
      name: "Al Qasimi Legal Consultancy",
      logoUrl: "https://example.com/logo.png",
      primaryColor: "#1e40af",
      secondaryColor: "#3b82f6",
      timezone: "Asia/Dubai",
      reminderAdvanceNoticeDays: 7,
      address: "Dubai International Financial Centre, Dubai, UAE",
      phone: "+971-4-123-4567",
      email: "info@alqasimilegal.ae",
      licenseNumber: "LC-2024-001",
      isActive: true,
    });

    console.log("👥 Seeding demo users...");

    const adminUserId = nanoid();
    const lawyerUserId = nanoid();

    await db.insert(users).values([
      {
        id: adminUserId,
        name: "Ahmed Al Qasimi",
        email: "ahmed@alqasimilegal.ae",
        loginMethod: "email",
        role: "admin",
        firmId: demoFirmId,
        stripeCustomerId: null,
      },
      {
        id: lawyerUserId,
        name: "Fatima Hassan",
        email: "fatima@alqasimilegal.ae",
        loginMethod: "email",
        role: "user",
        firmId: demoFirmId,
        stripeCustomerId: null,
      },
    ]);

    console.log("👤 Seeding demo clients...");

    const client1Id = nanoid();
    const client2Id = nanoid();

    await db.insert(clients).values([
      {
        id: client1Id,
        firmId: demoFirmId,
        clientNumber: "CLT-2024-001",
        name: "Mohammed Abdullah Trading LLC",
        clientType: "company",
        phone: "+971-50-123-4567",
        email: "mohammed@tradingllc.ae",
        address: "Business Bay, Dubai, UAE",
        city: "Dubai",
        country: "United Arab Emirates",
        nationalId: null,
        passportNumber: null,
        tradeLicenseNumber: "TL-2024-12345",
        taxNumber: "TAX-UAE-001",
        notes: "Long-standing corporate client",
        status: "active",
        createdBy: adminUserId,
      },
      {
        id: client2Id,
        firmId: demoFirmId,
        clientNumber: "CLT-2024-002",
        name: "Sarah Al Mansoori",
        clientType: "individual",
        phone: "+971-55-987-6543",
        email: "sarah.almansoori@email.com",
        address: "Jumeirah, Dubai, UAE",
        city: "Dubai",
        country: "United Arab Emirates",
        nationalId: "784-1990-1234567-8",
        passportNumber: "A12345678",
        tradeLicenseNumber: null,
        taxNumber: null,
        notes: "Family law matter",
        status: "active",
        createdBy: lawyerUserId,
      },
    ]);

    console.log("⚖️  Seeding demo cases...");

    const case1Id = nanoid();
    const case2Id = nanoid();

    await db.insert(cases).values([
      {
        id: case1Id,
        firmId: demoFirmId,
        clientId: client1Id,
        caseNumber: "COM-2024-001",
        internalReferenceNumber: "INT-001",
        caseYear: 2024,
        title: "Commercial Dispute - Contract Breach",
        description: "Contract breach case involving supply agreement",
        caseType: "commercial",
        customCaseType: null,
        claimAmount: "500000.00",
        currency: "AED",
        collectedAmount: "0",
        status: "active",
        priority: "high",
        caseStage: "first_instance",
        customCaseStage: null,
        relatedCaseGroupId: null,
        clientName: "Mohammed Abdullah Trading LLC",
        clientType: "company",
        clientPhone: "+971-50-123-4567",
        clientEmail: "mohammed@tradingllc.ae",
        clientAddress: "Business Bay, Dubai, UAE",
        clientCapacity: "Plaintiff",
        additionalClients: null,
        opposingParty: "Global Supplies FZE",
        opposingPartyCapacity: "Defendant",
        opposingPartyPhone: "+971-4-999-8888",
        opposingPartyEmail: "legal@globalsupplies.ae",
        opposingPartyAddress: "Jebel Ali Free Zone, Dubai, UAE",
        additionalParties: null,
        parentCaseId: null,
        relationshipType: null,
        poaDocumentId: null,
        poaExpiryDate: null,
        poaReminderSent: false,
        court: "Dubai Courts - Commercial Court",
        judge: "Judge Abdullah Al Hashimi",
        filingDate: new Date("2024-01-15"),
        nextHearingDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        lastHearingDate: new Date("2024-10-15"),
        judgmentDate: null,
        closedDate: null,
        assignedTo: lawyerUserId,
        createdBy: adminUserId,
        password: null,
      },
      {
        id: case2Id,
        firmId: demoFirmId,
        clientId: client2Id,
        caseNumber: "FAM-2024-002",
        internalReferenceNumber: "INT-002",
        caseYear: 2024,
        title: "Custody Arrangement",
        description: "Child custody arrangement case",
        caseType: "family",
        customCaseType: null,
        claimAmount: null,
        currency: "AED",
        collectedAmount: "0",
        status: "active",
        priority: "medium",
        caseStage: "under_preparation",
        customCaseStage: null,
        relatedCaseGroupId: null,
        clientName: "Sarah Al Mansoori",
        clientType: "individual",
        clientPhone: "+971-55-987-6543",
        clientEmail: "sarah.almansoori@email.com",
        clientAddress: "Jumeirah, Dubai, UAE",
        clientCapacity: "Petitioner",
        additionalClients: null,
        opposingParty: "Khalid Al Mansoori",
        opposingPartyCapacity: "Respondent",
        opposingPartyPhone: null,
        opposingPartyEmail: null,
        opposingPartyAddress: null,
        additionalParties: null,
        parentCaseId: null,
        relationshipType: null,
        poaDocumentId: null,
        poaExpiryDate: null,
        poaReminderSent: false,
        court: "Dubai Personal Status Court",
        judge: null,
        filingDate: new Date("2024-11-01"),
        nextHearingDate: null,
        lastHearingDate: null,
        judgmentDate: null,
        closedDate: null,
        assignedTo: lawyerUserId,
        createdBy: lawyerUserId,
        password: null,
      },
    ]);

    console.log("📅 Seeding demo calendar...");

    const calendarId = nanoid();
    await db.insert(calendars).values({
      id: calendarId,
      firmId: demoFirmId,
      ownerId: lawyerUserId,
      title: "Court Hearings",
      description: "Calendar for all court hearings and legal appointments",
      color: "#3b82f6",
      visibility: "private",
      defaultTimezone: "Asia/Dubai",
      isDefault: true,
    });

    console.log("📆 Seeding demo events...");

    const upcomingHearingDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await db.insert(calendarEvents).values({
      id: nanoid(),
      calendarId: calendarId,
      firmId: demoFirmId,
      ownerId: lawyerUserId,
      title: "Commercial Dispute Hearing",
      description: "First hearing for contract breach case",
      location: "Dubai Courts - Commercial Court, Room 301",
      startUtc: upcomingHearingDate,
      endUtc: new Date(upcomingHearingDate.getTime() + 2 * 60 * 60 * 1000),
      startTz: "Asia/Dubai",
      endTz: "Asia/Dubai",
      allDay: false,
      recurrenceRule: null,
      recurrenceExceptions: null,
      recurrenceAdditions: null,
      parentEventId: null,
      eventType: "hearing",
      status: "confirmed",
      visibility: "private",
      tags: ["commercial", "hearing", "high-priority"],
      attachments: null,
      metadata: { caseId: case1Id, clientId: client1Id },
      version: 1,
    });

    console.log("🗓️  Seeding events for dashboard...");
    const inThreeDays = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
    const inNineDays = new Date(Date.now() + 9 * 24 * 60 * 60 * 1000);

    await db.insert(events).values([
      {
        id: nanoid(),
        firmId: demoFirmId,
        caseId: case1Id,
        title: "Client Meeting - Case Strategy",
        description: "Discuss contract breach strategy and next steps",
        eventType: "meeting",
        location: "Al Qasimi Legal Office, Meeting Room A",
        meetingLink: null,
        startTime: inThreeDays,
        endTime: new Date(inThreeDays.getTime() + 60 * 60 * 1000),
        allDay: false,
        reminderMinutes: 60,
        reminderSent: false,
        status: "scheduled",
        attendees: JSON.stringify(["ahmed@alqasimilegal.ae", "fatima@alqasimilegal.ae"]),
        createdBy: adminUserId,
        assignedTo: lawyerUserId,
      },
      {
        id: nanoid(),
        firmId: demoFirmId,
        caseId: case2Id,
        title: "Filing Deadline - Custody Documents",
        description: "Submit required custody documents to court",
        eventType: "deadline",
        location: "Dubai Personal Status Court",
        meetingLink: null,
        startTime: inNineDays,
        endTime: null,
        allDay: true,
        reminderMinutes: 120,
        reminderSent: false,
        status: "scheduled",
        attendees: JSON.stringify(["fatima@alqasimilegal.ae"]),
        createdBy: lawyerUserId,
        assignedTo: lawyerUserId,
      },
    ]);

    console.log("🗓️  Seeding personal (private) events...");
    const dayMs = 24 * 60 * 60 * 1000;
    const tomorrow = new Date(Date.now() + 1 * dayMs);
    const inTwoDays = new Date(Date.now() + 2 * dayMs);
    const inSixDays = new Date(Date.now() + 6 * dayMs);

    await db.insert(events).values([
      {
        id: nanoid(),
        firmId: demoFirmId,
        caseId: null,
        title: "Personal Meeting",
        description: "One-on-one meeting to review personal tasks",
        eventType: "meeting",
        location: "Office B",
        meetingLink: null,
        startTime: tomorrow,
        endTime: new Date(tomorrow.getTime() + 45 * 60 * 1000),
        allDay: false,
        reminderMinutes: 30,
        reminderSent: false,
        status: "scheduled",
        attendees: JSON.stringify(["fatima@alqasimilegal.ae"]),
        createdBy: lawyerUserId,
        assignedTo: lawyerUserId,
      },
      {
        id: nanoid(),
        firmId: demoFirmId,
        caseId: null,
        title: "Submit Personal Documents",
        description: "Deadline to organize and submit personal paperwork",
        eventType: "deadline",
        location: "Home",
        meetingLink: null,
        startTime: inTwoDays,
        endTime: null,
        allDay: true,
        reminderMinutes: 120,
        reminderSent: false,
        status: "scheduled",
        attendees: JSON.stringify(["fatima@alqasimilegal.ae"]),
        createdBy: lawyerUserId,
        assignedTo: lawyerUserId,
      },
      {
        id: nanoid(),
        firmId: demoFirmId,
        caseId: null,
        title: "Workout & Wellness",
        description: "Personal wellness session",
        eventType: "other",
        location: "Gym",
        meetingLink: null,
        startTime: inSixDays,
        endTime: new Date(inSixDays.getTime() + 90 * 60 * 1000),
        allDay: false,
        reminderMinutes: 15,
        reminderSent: false,
        status: "scheduled",
        attendees: JSON.stringify([]),
        createdBy: lawyerUserId,
        assignedTo: lawyerUserId,
      },
    ]);

    console.log("🧾 Seeding documents...");
    await db.insert(documents).values([
      {
        id: nanoid(),
        firmId: demoFirmId,
        caseId: case1Id,
        title: "Supply Agreement",
        filename: "supply-agreement.pdf",
        description: "Original supply agreement between parties",
        documentType: "document",
        fileUrl: "https://example.com/docs/supply-agreement.pdf",
        fileSize: 245760,
        mimeType: "application/pdf",
        documentDate: "2023-12-15",
        uploadedBy: adminUserId,
      },
      {
        id: nanoid(),
        firmId: demoFirmId,
        caseId: case2Id,
        title: "Custody Memorandum",
        filename: "custody-memorandum.pdf",
        description: "Memorandum outlining custody arguments",
        documentType: "memorandum",
        fileUrl: "https://example.com/docs/custody-memorandum.pdf",
        fileSize: 163840,
        mimeType: "application/pdf",
        documentDate: "2024-11-10",
        uploadedBy: lawyerUserId,
      },
    ]);

    console.log("⏰ Seeding reminders...");
    await db.insert(reminders).values([
      {
        id: nanoid(),
        firmId: demoFirmId,
        reminderType: "deadline",
        relatedEntityType: "case",
        relatedEntityId: case1Id,
        title: "Submit Evidence",
        message: "Prepare and submit all evidence documents",
        dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        status: "active",
        priority: "high",
        isAutoGenerated: false,
        metadata: { caseNumber: "COM-2024-001" } as unknown as any,
        createdBy: adminUserId,
      },
      {
        id: nanoid(),
        firmId: demoFirmId,
        reminderType: "custom",
        relatedEntityType: "case",
        relatedEntityId: case2Id,
        title: "Call Client",
        message: "Confirm availability for court filing",
        dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        status: "active",
        priority: "medium",
        isAutoGenerated: false,
        metadata: null,
        createdBy: lawyerUserId,
      },
      {
        id: nanoid(),
        firmId: demoFirmId,
        reminderType: "document_expiry",
        relatedEntityType: "document",
        relatedEntityId: null,
        title: "POA Expiry",
        message: "Power of Attorney expires soon",
        dueDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
        status: "snoozed",
        priority: "low",
        isAutoGenerated: true,
        metadata: null,
        createdBy: adminUserId,
      },
    ]);

    console.log("⚖️  Seeding hearings...");
    await db.insert(hearings).values({
      id: nanoid(),
      firmId: demoFirmId,
      caseId: case1Id,
      hearingNumber: 1,
      hearingDate: upcomingHearingDate,
      hearingTime: "10:00",
      hearingType: "offline",
      stage: "first_instance",
      assignedTo: lawyerUserId,
      timeSpent: "2:00",
      isPostponed: false,
      showInClientPortal: false,
      hasJudgment: false,
      createdBy: adminUserId,
    });

    console.log("✅ Database seeded successfully!");
    console.log("\n📊 Seed Summary:");
    console.log("  - 3 Subscription Plans");
    console.log("  - 1 Demo Firm");
    console.log("  - 2 Demo Users");
    console.log("  - 1 Active Subscription");
    console.log("  - 2 Demo Clients");
    console.log("  - 2 Demo Cases");
    console.log("  - 1 Demo Calendar");
    console.log("  - 1 Demo Event");
    console.log("\n🔐 Demo Credentials:");
    console.log("  Admin: ahmed@alqasimilegal.ae");
    console.log("  Lawyer: fatima@alqasimilegal.ae");

  } catch (error) {
    console.error("❌ Error seeding database:", error);
    throw error;
  } finally {
    await client.end();
  }
}

// Run seed if called directly
seed()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

export default seed;
