import type { MessageRole, MessageType } from "./enums";

export * from "./enums";

export interface Message {
  id: string;
  content: string;
  role: MessageRole;
  type: MessageType;
  createdAt: string;
  updatedAt: string;
  projectId: string;
  fragments?: Fragment | null;
}

export interface Fragment {
  id: string;
  messageId: string;
  sandboxUrl: string;
  title: string;
  files: any;
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  id: string;
  name: string;
  userId: number;
  createdAt: string;
  updatedAt: string;
  messages?: Message[];
}

export interface User {
  id: number;
  clerkId: string;
  email?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  name?: string | null;
  imageUrl?: string | null;
  createdAt: string;
  updatedAt: string;
  projects?: Project[];
}
