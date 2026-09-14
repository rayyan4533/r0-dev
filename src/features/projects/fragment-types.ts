import type { Fragment } from "@/generated/prisma/client";
import { MessageRole, MessageType } from "@/generated/prisma/enums";

export type { Fragment };
export { MessageRole, MessageType };

export type ProjectFragment = Fragment & {
  files: Record<string, string>;
};

export function parseFragmentFiles(
  files: Fragment["files"]
): Record<string, string> {
  if (!files || typeof files !== "object" || Array.isArray(files)) {
    return {};
  }

  return files as Record<string, string>;
}
