// src/app/api/inngest/route.ts
import { inngest } from "@/feature/inngest/client";
import { processTask } from "@/feature/inngest/functions";
import { serve } from "inngest/next";


export const { GET, POST, PUT } = serve({
    client: inngest,
    functions: [processTask],
});