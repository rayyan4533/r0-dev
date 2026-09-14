"use server";

import { db } from "@/prisma/db";
import { auth, currentUser } from "@clerk/nextjs/server";



export async function onBoardUser() {
    const { userId } = await auth();

    if (!userId) return;

    const clerkUser = await currentUser();

    if (!clerkUser) return;

    const email =
        clerkUser.primaryEmailAddress?.emailAddress ??
        clerkUser.emailAddresses[0]?.emailAddress ??
        null;

    const name =
        clerkUser.fullName ??
        ([clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") || null);

    await db.orm.public.User.upsert({
        create: {
            clerkId: userId,
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
        conflictOn: { clerkId: userId },
    });
}

export const getCurrentUser = async () => {
    try {
        const user = await currentUser();

        if (!user) {
            return null;
        }

        const dbUser = await db.orm.public.User
            .select("id", "email", "name", "imageUrl", "clerkId")
            .first({
                clerkId: user.id,
            });

        return dbUser;
    } catch (error) {
        console.error("❌ Error fetching current user:", error);
        return null;
    }
};
