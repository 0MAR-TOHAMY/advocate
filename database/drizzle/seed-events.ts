import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";
import { nanoid } from "nanoid";

import { firms, users, cases, events } from "../schema/index.js";
import { eq } from "drizzle-orm";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: resolve(__dirname, "../config/.env") });

const DATABASE_URL = process.env.DATABASE_URL || "postgresql://root:strongpassword@localhost:5432/legal_case_manager";

async function seedEvents() {
  console.log("📆 Seeding only events (public + private)...");
  const client = postgres(DATABASE_URL);
  const db = drizzle(client);
  try {
    const [firm] = await db.select().from(firms).limit(1);
    if (!firm) throw new Error("No firm found. Seed base data first.");

    const [user] = await db.select().from(users).where(eq(users.firmId, firm.id)).limit(1);
    if (!user) throw new Error("No user found for firm.");

    const [firstCase] = await db.select().from(cases).where(eq(cases.firmId, firm.id)).limit(1);

    const dayMs = 24 * 60 * 60 * 1000;
    const now = Date.now();
    const d1 = new Date(now + 1 * dayMs);
    const d2 = new Date(now + 2 * dayMs);
    const d3 = new Date(now + 3 * dayMs);
    const d4 = new Date(now + 5 * dayMs);

    const values = [
      {
        id: nanoid(),
        firmId: firm.id,
        caseId: null,
        title: "Personal Planning",
        description: "Weekly personal planning session",
        eventType: "meeting",
        location: "Office",
        meetingLink: null,
        startTime: d1,
        endTime: new Date(d1.getTime() + 60 * 60 * 1000),
        allDay: false,
        reminderMinutes: 30,
        reminderSent: false,
        status: "scheduled",
        attendees: JSON.stringify([user.email]),
        createdBy: user.id,
        assignedTo: user.id,
      },
      {
        id: nanoid(),
        firmId: firm.id,
        caseId: null,
        title: "Personal Deadline",
        description: "Submit timesheets",
        eventType: "deadline",
        location: "Portal",
        meetingLink: null,
        startTime: d2,
        endTime: null,
        allDay: true,
        reminderMinutes: 120,
        reminderSent: false,
        status: "scheduled",
        attendees: JSON.stringify([user.email]),
        createdBy: user.id,
        assignedTo: user.id,
      },
    ];

    if (firstCase) {
      values.push(
        {
          id: nanoid(),
          firmId: firm.id,
          caseId: firstCase.id,
          title: "Case Review Meeting",
          description: "Review case documents",
          eventType: "meeting",
          location: "Room C",
          meetingLink: null,
          startTime: d3,
          endTime: new Date(d3.getTime() + 90 * 60 * 1000),
          allDay: false,
          reminderMinutes: 60,
          reminderSent: false,
          status: "scheduled",
          attendees: JSON.stringify([user.email]),
          createdBy: user.id,
          assignedTo: user.id,
        },
        {
          id: nanoid(),
          firmId: firm.id,
          caseId: firstCase.id,
          title: "Court Filing Deadline",
          description: "File documents with court",
          eventType: "deadline",
          location: "Court",
          meetingLink: null,
          startTime: d4,
          endTime: null,
          allDay: true,
          reminderMinutes: 180,
          reminderSent: false,
          status: "scheduled",
          attendees: JSON.stringify([user.email]),
          createdBy: user.id,
          assignedTo: user.id,
        }
      );
    }

    await db.insert(events).values(values);
    console.log("✅ Events seeded successfully");
  } catch (error) {
    console.error("❌ Error seeding events only:", error);
    throw error;
  } finally {
    await client.end();
  }
}

seedEvents()
  .then(() => process.exit(0))
  .catch((err) => { console.error(err); process.exit(1); });

export default seedEvents;
