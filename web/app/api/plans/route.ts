import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { subscriptionPlans, storageAddOns } from "@/lib/schema";
import { eq, asc } from "drizzle-orm";

export async function GET() {
  try {
    // Get all active plans ordered by price
    const plans = await db
      .select()
      .from(subscriptionPlans)
      .where(eq(subscriptionPlans.isActive, true))
      .orderBy(asc(subscriptionPlans.pricePerUserMonthly));

    // Get all active storage add-ons
    const addOns = await db
      .select()
      .from(storageAddOns)
      .where(eq(storageAddOns.isActive, true))
      .orderBy(asc(storageAddOns.storageSizeGB));

    return NextResponse.json({ plans, addOns }, { status: 200 });
  } catch (error) {
    console.error("Error fetching plans:", error);
    return NextResponse.json({ message: "Error fetching plans" }, { status: 500 });
  }
}