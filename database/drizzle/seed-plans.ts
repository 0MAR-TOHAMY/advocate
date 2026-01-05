/**
 * Seed script for subscription plans and storage add-ons
 * Run with: npm run db:seed:plans
 * 
 * NOTE: You need to create Stripe products/prices manually and update the IDs below
 */

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";
import { subscriptionPlans, storageAddOns } from "../schema/index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: resolve(__dirname, "../config/.env") });

const DATABASE_URL = process.env.DATABASE_URL || "postgresql://root:strongpassword@localhost:5432/legal_case_manager";

// ============================================================================
// PLANS DATA (update Stripe IDs after creating products in Stripe Dashboard)
// ============================================================================
const PLANS = [
    {
        id: "plan_free",
        planType: "free" as const,
        name: "Free",
        description: "45-day free trial with unlimited access",
        pricePerUserMonthly: 0,
        pricePerUserYearly: null,
        minUsers: 1,
        maxUsers: null, // Unlimited
        storagePerUserGB: null, // Unlimited
        trialDays: 45,
        isContactSales: false,
        stripePriceIdMonthly: null,
        stripePriceIdYearly: null,
        stripeProductId: null,
    },
    {
        id: "plan_essential",
        planType: "essential" as const,
        name: "Essential",
        description: "For small firms with up to 2 users",
        pricePerUserMonthly: 2900, // $29.00 in cents
        pricePerUserYearly: 27840, // $278.40/year (20% off)
        minUsers: 1,
        maxUsers: 2,
        storagePerUserGB: 32,
        trialDays: 0,
        isContactSales: false,
        stripePriceIdMonthly: "price_essential_monthly", // TODO: Update with real Stripe price ID
        stripePriceIdYearly: "price_essential_yearly", // TODO: Update with real Stripe price ID
        stripeProductId: "prod_essential", // TODO: Update with real Stripe product ID
    },
    {
        id: "plan_professional",
        planType: "professional" as const,
        name: "Professional",
        description: "For growing firms with 3-20 users",
        pricePerUserMonthly: 5500, // $55.00 in cents
        pricePerUserYearly: 52800, // $528/year (20% off)
        minUsers: 3,
        maxUsers: 20,
        storagePerUserGB: 64,
        trialDays: 0,
        isContactSales: false,
        stripePriceIdMonthly: "price_professional_monthly", // TODO: Update
        stripePriceIdYearly: "price_professional_yearly", // TODO: Update
        stripeProductId: "prod_professional", // TODO: Update
    },
    {
        id: "plan_elite",
        planType: "elite" as const,
        name: "Elite",
        description: "For large firms with 21-50 users",
        pricePerUserMonthly: 7500, // $75.00 in cents
        pricePerUserYearly: 72000, // $720/year (20% off)
        minUsers: 21,
        maxUsers: 50,
        storagePerUserGB: null, // Unlimited
        trialDays: 0,
        isContactSales: false,
        stripePriceIdMonthly: "price_elite_monthly", // TODO: Update
        stripePriceIdYearly: "price_elite_yearly", // TODO: Update
        stripeProductId: "prod_elite", // TODO: Update
    },
    {
        id: "plan_custom",
        planType: "custom" as const,
        name: "Custom",
        description: "For enterprise firms with 50+ users - Contact sales",
        pricePerUserMonthly: 0, // Quote required
        pricePerUserYearly: null,
        minUsers: 50,
        maxUsers: null,
        storagePerUserGB: null,
        trialDays: 0,
        isContactSales: true,
        stripePriceIdMonthly: null,
        stripePriceIdYearly: null,
        stripeProductId: null,
    },
];

// ============================================================================
// STORAGE ADD-ONS DATA
// ============================================================================
const ADD_ONS = [
    {
        id: "addon_tiny",
        name: "Tiny Boost",
        storageSizeGB: 10,
        priceMonthly: "4.90",
        stripePriceId: "price_addon_tiny", // TODO: Update
    },
    {
        id: "addon_small",
        name: "Small Upgrade",
        storageSizeGB: 25,
        priceMonthly: "9.90",
        stripePriceId: "price_addon_small", // TODO: Update
    },
    {
        id: "addon_medium",
        name: "Medium Top-Up",
        storageSizeGB: 50,
        priceMonthly: "17.00",
        stripePriceId: "price_addon_medium", // TODO: Update
    },
    {
        id: "addon_standard",
        name: "Standard Add-On",
        storageSizeGB: 100,
        priceMonthly: "29.00",
        stripePriceId: "price_addon_standard", // TODO: Update
    },
    {
        id: "addon_large",
        name: "Large Pack",
        storageSizeGB: 500,
        priceMonthly: "99.00",
        stripePriceId: "price_addon_large", // TODO: Update
    },
    {
        id: "addon_1tb",
        name: "1 TB Pack",
        storageSizeGB: 1000,
        priceMonthly: "149.00",
        stripePriceId: "price_addon_1tb", // TODO: Update
    },
];

// ============================================================================
// SEED FUNCTION
// ============================================================================
async function seedPlans() {
    console.log("🌱 Seeding subscription plans and add-ons...");

    const client = postgres(DATABASE_URL);
    const db = drizzle(client);

    try {
        console.log("\n📦 Seeding subscription plans...");

        for (const plan of PLANS) {
            await db.insert(subscriptionPlans).values({
                ...plan,
                isActive: true,
                createdAt: new Date(),
                updatedAt: new Date(),
            }).onConflictDoUpdate({
                target: subscriptionPlans.id,
                set: {
                    ...plan,
                    updatedAt: new Date(),
                },
            });
            console.log(`  ✅ ${plan.name}`);
        }

        console.log("\n📦 Seeding storage add-ons...");

        for (const addon of ADD_ONS) {
            await db.insert(storageAddOns).values({
                ...addon,
                currency: "USD",
                isActive: true,
                createdAt: new Date(),
                updatedAt: new Date(),
            }).onConflictDoUpdate({
                target: storageAddOns.id,
                set: {
                    ...addon,
                    updatedAt: new Date(),
                },
            });
            console.log(`  ✅ ${addon.name}`);
        }

        console.log("\n✨ Seeding complete!");
        console.log("\n⚠️  IMPORTANT: Update Stripe Price IDs in this file after creating products in Stripe Dashboard");

    } catch (error) {
        console.error("❌ Seeding failed:", error);
        throw error;
    } finally {
        await client.end();
    }
}

seedPlans()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
