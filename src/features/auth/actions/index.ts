"use server";

import { db } from "@/prisma/db";
import { auth, currentUser } from "@clerk/nextjs/server";



export async function onBoardUser() {
    const clerkUser = await currentUser();

    if (!clerkUser) return null;

    const email =
        clerkUser.primaryEmailAddress?.emailAddress ??
        clerkUser.emailAddresses[0]?.emailAddress ??
        null;

    const name =
        clerkUser.fullName ??
        ([clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") || null);

    return await db.orm.public.User.upsert({
        create: {
            clerkId: clerkUser.id,
            email,
            firstName: clerkUser.firstName,
            lastName: clerkUser.lastName,
            name,
            imageUrl: clerkUser.imageUrl,
        },
        update: {
            email,
            firstName: clerkUser.firstName,
            lastName: clerkUser.lastName,
            name,
            imageUrl: clerkUser.imageUrl,
        },
        conflictOn: { clerkId: clerkUser.id },
    });
}

export const getCurrentUser = async () => {
    try {
        const clerkUser = await currentUser();

        if (!clerkUser) {
            return null;
        }

        let dbUser = await db.orm.public.User
            .where({ clerkId: clerkUser.id })
            .select("id", "email", "name", "imageUrl", "clerkId")
            .first();

        if (!dbUser) {
            await onBoardUser();
            dbUser = await db.orm.public.User
                .where({ clerkId: clerkUser.id })
                .select("id", "email", "name", "imageUrl", "clerkId")
                .first();
        }

        return dbUser;
    } catch (error) {
        console.error("❌ Error fetching current user:", error);
        return null;
    }
};
