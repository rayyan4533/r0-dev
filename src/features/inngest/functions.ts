import dns from "node:dns";
dns.setDefaultResultOrder?.("ipv4first");

import { db } from "@/prisma/db";
import { inngest } from "./client";
import { Sandbox } from "@e2b/code-interpreter";

export const MessageRole = db.enums.public.MessageRole.members;
export const MessageType = db.enums.public.MessageType.members;
export type MessageRole = (typeof MessageRole)[keyof typeof MessageRole];
export type MessageType = (typeof MessageType)[keyof typeof MessageType];

import { createAgent, createNetwork, createState, createTool, gemini } from "@inngest/agent-kit"
import { FRAGMENT_TITLE_PROMPT, PROMPT, RESPONSE_PROMPT } from "@/lib/prompt";
import z from "zod"
import { agentOutputText, captureTaskSummary, connectSandbox, lastAssistantTextMessageContent } from "./utils";

export interface CodeAgentState {
    sandboxId: string;
    summary: string;
    files: Record<string, string>;
}


export const processTask = inngest.createFunction(
    { id: "process-task", triggers: { event: "app/task.created" } },
    async ({ event, step }) => {
        const result = await step.run("handle-task", async () => {
            return { processed: true, id: event.data.id };
        });

        await step.sleep("pause", "1s");

        return { message: `Task ${event.data.id} complete`, result };
    }
);

export const codeAgentFunction = inngest.createFunction(
    { id: "code-agent", triggers: { event: "code-agent/run" } },
    async ({ event, step }) => {
        const sandboxId = await step.run("get-sandbox-id", async () => {
            const sandbox = await Sandbox.create({
                template: process.env.E2B_TEMPLATE_ID || "ugwj9f6y2wocdpps7omf",
                apiKey: process.env.E2B_API_KEY || "e2b_bf8e535c13c02ee0355eaee8255e06bebd54d593",
            });

            return sandbox.sandboxId;
        })

        const previousMessages = await step.run("get-previous-messages", async () => {
            const messages = await db.orm.public.Message
                .where({
                    projectId: event.data.projectId
                })
                .orderBy((m) => m.createdAt.asc())
                .all();

            return messages.map((message) => ({
                type: "text" as const,
                role:
                    message.role === MessageRole.ASSISTANT
                        ? ("assistant" as const)
                        : ("user" as const),
                content: message.content,
            }))
        });

        const state = createState<CodeAgentState>(
            { sandboxId, summary: "", files: {} },
            { messages: previousMessages }
        );

        const modelName = process.env.GEMINI_MODEL || "gemini-3.5-flash";

        const geminiModel = gemini({
            model: modelName,
            step,
            apiKey: process.env.GEMINI_API_KEY!,
            defaultParameters: {
                generationConfig: {
                    temperature: 0,
                    maxOutputTokens: 8192,
                    thinkingConfig: { thinkingBudget: 0 },
                }
            }
        } as Parameters<typeof gemini>[0]
        );

        const codeAgent = createAgent({
            name: "code-agent",
            description: "An expert coding agent",
            system: PROMPT,
            model: gemini({ model: modelName, apiKey: process.env.GEMINI_API_KEY! }),
            tools: [
                // 1. Terminal
                createTool({
                    name: "terminal",
                    description: "Use the terminal to run commands",
                    parameters: z.object({
                        command: z.string(),
                    }),
                    handler: async ({ command }, { step }) => {
                        return await step?.run("terminal", async () => {
                            const buffers = { stdout: "", stderr: "" };

                            try {
                                const sandbox = await Sandbox.connect(sandboxId);

                                const result = await sandbox.commands.run(command, {
                                    onStdout: (data) => {
                                        buffers.stdout += data;
                                    },

                                    onStderr: (data) => {
                                        buffers.stderr += data;
                                    },
                                });

                                return result.stdout;
                            } catch (error) {
                                console.log(
                                    `Command failed: ${error} \n stdout: ${buffers.stdout}\n stderr: ${buffers.stderr}`
                                );

                                return `Command failed: ${error} \n stdout: ${buffers.stdout}\n stderr: ${buffers.stderr}`;
                            }
                        });
                    },
                }),

                // 2. createOrUpdateFiles
                createTool({
                    name: "createOrUpdateFiles",
                    description: "Create or update files in the sanbox",
                    parameters: z.object({
                        files: z.array(
                            z.object({
                                path: z.string(),
                                content: z.string(),
                            })
                        ),
                    }),

                    handler: async ({ files }, { step, network }) => {
                        const newFiles = await step?.run(
                            "createOrUpdateFiles",
                            async () => {
                                try {
                                    const updatedFiles = network?.state?.data.files || {};

                                    const sanbox = await Sandbox.connect(sandboxId);

                                    for (const file of files) {
                                        await sanbox.files.write(file.path, file.content);
                                        updatedFiles[file.path] = file.content;
                                    }

                                    return updatedFiles;
                                } catch (error) {
                                    return "Error" + error;
                                }
                            }
                        );

                        if (typeof newFiles === "object") {
                            network.state.data.files = newFiles;
                        }
                    },
                }),

                // 3. createOrUpdateFile (singular)
                createTool({
                    name: "createOrUpdateFile",
                    description: "Create or update a single file in the sandbox",
                    parameters: z.object({
                        path: z.string(),
                        content: z.string(),
                    }),

                    handler: async ({ path, content }, { step, network }) => {
                        const newFiles = await step?.run(
                            `createOrUpdateFile-${path.replace(/[^a-zA-Z0-9_-]/g, "_")}`,
                            async () => {
                                try {
                                    const updatedFiles = network?.state?.data.files || {};
                                    const sanbox = await Sandbox.connect(sandboxId);

                                    await sanbox.files.write(path, content);
                                    updatedFiles[path] = content;

                                    return updatedFiles;
                                } catch (error) {
                                    return "Error" + error;
                                }
                            }
                        );

                        if (typeof newFiles === "object") {
                            network.state.data.files = newFiles;
                        }
                    },
                }),

                // 4. readFiles
                createTool({
                    name: "readFiles",
                    description: "Read files in the sandbox",

                    parameters: z.object({
                        files: z.array(z.string()),
                    }),
                    handler: async ({ files }, { step }) => {
                        return await step?.run("readFiles", async () => {
                            try {
                                const sanbox = await Sandbox.connect(sandboxId);

                                const contents: any = [];
                                console.log(contents)

                                for (const file of files) {
                                    const content = await sanbox.files.read(file);
                                    contents.push({ path: file, content });
                                }
                                return JSON.stringify(contents);
                            } catch (error) {
                                return "Error" + error;
                            }
                        });
                    },
                }),
            ],

            lifecycle: {
                onResponse: async ({ result, network }) => {
                    console.log(result);
                    const lastAssistantMessageText =
                        lastAssistantTextMessageContent(result);

                    if (lastAssistantMessageText && network) {
                        if (lastAssistantMessageText.includes("<task_summary>")) {
                            network.state.data.summary = lastAssistantMessageText;
                        }
                    }

                    return result;
                },
            },
        });

        const network = createNetwork({
            name: "code-agent-network",
            agents: [codeAgent],
            maxIter: 15,
            router: async ({ network }) => {
                const summary = network.state.data.summary;

                if (summary) {
                    return;
                }

                return codeAgent;
            }

        });

        const result = await network.run(event.data.value, { state });
        console.log(result)
        const { summary, files } = result.state.data;

        const makeTextAgent = (name: string, system: string) => createAgent({ name, system, model: geminiModel });

        const fragmentTitleGenerator = makeTextAgent("fragment-title-generator", FRAGMENT_TITLE_PROMPT);
        const responseGenerator = makeTextAgent("response-generator", RESPONSE_PROMPT);

        const [{ output: fragmentTitleOutput }, { output: responseOutput }] = await Promise.all([
            fragmentTitleGenerator.run(summary, { step }),
            responseGenerator.run(summary, { step })
        ]);

        const fragmentTitle = agentOutputText(fragmentTitleOutput, "Untitled");
        const responseText = agentOutputText(responseOutput, "Here you go");

        console.log(files)

        const isError =
            !result.state.data.summary ||
            Object.keys(result.state.data.files || {}).length === 0;


        const sandboxUrl = await step.run("get-sandbox-url", async () => {
            const sandbox = await connectSandbox(sandboxId);
            return `http://${sandbox.getHost(3000)}`
        });

        await step.run("save-result", async () => {
            if (isError) {
                return await db.orm.public.Message.create({
                    projectId: event.data.projectId,
                    content: "Something went wrong. Please try again",
                    role: MessageRole.ASSISTANT,
                    type: MessageType.ERROR,
                });
            }

            return await db.transaction(async (tx) => {
                const message = await tx.orm.public.Message.create({
                    projectId: event.data.projectId,
                    content: responseText,
                    role: MessageRole.ASSISTANT,
                    type: MessageType.RESULT,
                });

                await tx.orm.public.Fragment.create({
                    messageId: message.id,
                    sandboxUrl,
                    title: fragmentTitle,
                    files,
                });

                return message;
            });
        });

        return {
            url: sandboxUrl, title: fragmentTitle, files, summary
        }
    }
);