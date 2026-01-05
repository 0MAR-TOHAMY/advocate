
import { db } from "../lib/db";
import { roles, permissions, rolePermissions, firmUsers } from "../lib/schema";
import { Permissions } from "../lib/auth/permissions";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";

async function main() {
    console.log("🌱 Seeding Permissions...");

    // 1. Ensure all system permissions exist in `permissions` table
    const allPerms = Object.values(Permissions);

    for (const permKey of allPerms) {
        const existing = await db.query.permissions.findFirst({
            where: eq(permissions.key, permKey)
        });

        if (!existing) {
            console.log(`Creating permission: ${permKey}`);
            await db.insert(permissions).values({
                id: nanoid(),
                key: permKey,
                description: `System permission for ${permKey}`,
                category: "system"
            });
        }
    }

    // 2. Grant ALL permissions to 'Admin' and 'Owner' roles in ALL firms
    // This is a simplified "Fix All" script.
    // In reality, we might want to do this per-firm or just for global roles if they exist.
    // Assuming roles are per-firm, we iterate all roles with name 'Admin' or 'Owner'.

    const adminRoles = await db.query.roles.findMany({
        with: {
            rolePermissions: true
        }
    });

    for (const role of adminRoles) {
        if (["admin", "owner"].includes(role.name.toLowerCase())) {
            console.log(`Granting all permissions to role: ${role.name} (${role.id})`);

            // Find permissions not yet assigned
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const currentPermIds = (role as any).rolePermissions.map((rp: any) => rp.permissionId);

            const allSystemPerms = await db.select().from(permissions);

            const missingPerms = allSystemPerms.filter(p => !currentPermIds.includes(p.id));

            if (missingPerms.length > 0) {
                await db.insert(rolePermissions).values(
                    missingPerms.map(p => ({
                        id: nanoid(),
                        roleId: role.id,
                        permissionId: p.id
                    }))
                );
                console.log(`Added ${missingPerms.length} permissions to role ${role.id}`);
            }
        }
    }

    console.log("✅ Seeding Complete.");
    process.exit(0);
}

main().catch((err) => {
    console.error("Error seeding permissions:", err);
    process.exit(1);
});
