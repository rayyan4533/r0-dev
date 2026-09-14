"use server";

import { getCurrentUser } from "@/features/auth/actions";
import { inngest } from "@/features/inngest/client";
import { db } from "@/prisma/db";

const MessageRole = db.enums.public.MessageRole.members;
const MessageType = db.enums.public.MessageType.members;
type MessageRole = (typeof MessageRole)[keyof typeof MessageRole];
type MessageType = (typeof MessageType)[keyof typeof MessageType];

/**
 * Create a new user message in a project and kick off an agent run.
 *
 * Verifies the caller owns the target project, stores the message, then sends a
 * `code-agent/run` event so the coding agent generates a response.
 *
 * @param value - The message content typed by the user.
 * @param projectId - The project the message belongs to.
 * @returns The newly created message record.
 * @throws If the user is unauthorized or the project is not found.
 */
export const createMessage = async (value: string, projectId: string) => {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const project = await db.orm.public.Project
    .where({
      id: projectId,
      userId: user.id,
    })
    .first();

  if (!project) {
    throw new Error("Project not found");
  }

  const newMessage = await db.orm.public.Message.create({
    projectId,
    content: value,
    role: MessageRole.USER,
    type: MessageType.RESULT,
  });

  await inngest.send({
    name: "code-agent/run",
    data: {
      value,
      projectId,
    },
  });

  return newMessage;
};

/**
 * List all messages for a project, oldest first, including their fragments.
 *
 * Ensures the signed-in user owns the project before returning anything.
 *
 * @param projectId - The project whose messages should be returned.
 * @returns The project's messages (with related fragments) ordered by `updatedAt`.
 * @throws If the user is unauthorized or the project is not found.
 */
export const getMessages = async (projectId: string) => {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const project = await db.orm.public.Project
    .where({
      id: projectId,
      userId: user.id,
    })
    .first();

  if (!project) {
    throw new Error("Project not found or unauthorized");
  }

  return await db.orm.public.Message
    .where({
      projectId,
    })
    .include("fragments")
    .orderBy((m) => m.updatedAt.asc())
    .all();
};
