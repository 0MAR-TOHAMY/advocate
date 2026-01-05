import Stripe from "stripe";
import * as dotenv from "dotenv";
import { resolve } from "path";

dotenv.config({ path: ".env.local" });

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
    apiVersion: "2024-06-20",
});

async function findMappings() {
    try {
        const products = await stripe.products.list({ limit: 50, active: true });
        console.log("--- STRIPE_DATA_START ---");
        for (const prod of products.data) {
            const prices = await stripe.prices.list({ product: prod.id, active: true });
            console.log(`Product: ${prod.name} (${prod.id})`);
            prices.data.forEach(p => {
                console.log(`  Price: ${p.id} | ${p.unit_amount} ${p.currency} | ${p.recurring?.interval}`);
            });
        }
        console.log("--- STRIPE_DATA_END ---");
    } catch (error) {
        console.error("FAILED:", error.message);
    }
}

findMappings();
