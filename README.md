# ⚡ r0.dev (Chai0)

> An open-source, AI-powered full-stack web application builder inspired by **v0** and **Bolt.new**. Built with Next.js 16, Inngest AgentKit, E2B Sandboxes, Prisma 8, and Clerk.

[![Next.js](https://img.shields.io/badge/Next.js-16.3-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)
[![Inngest](https://img.shields.io/badge/Inngest-AgentKit-7C3AED?style=flat-square&logo=inngest)](https://www.inngest.com/)
[![E2B](https://img.shields.io/badge/E2B-Cloud_Sandbox-FF5722?style=flat-square)](https://e2b.dev/)
[![Prisma](https://img.shields.io/badge/Prisma-8.0_Next-2D3748?style=flat-square&logo=prisma)](https://www.prisma.io/)
[![Clerk](https://img.shields.io/badge/Clerk-Auth-6C47FF?style=flat-square&logo=clerk)](https://clerk.com/)
[![Bun](https://img.shields.io/badge/Package_Manager-Bun-FBF0DF?style=flat-square&logo=bun)](https://bun.sh/)

---

## 🌟 Key Features

- 🤖 **Autonomous Coding Agent**: Orchestrated using **Inngest AgentKit**, capable of multi-step iterative reasoning, planning, and task execution.
- 📦 **Isolated Cloud Sandboxes**: Real-time code execution, file manipulation, and web preview hosting inside **E2B Code Interpreter** sandboxes.
- 🛠️ **Agent Tool Calling**:
  - `terminal`: Execute bash commands, install dependencies, and run scripts inside the sandbox.
  - `createOrUpdateFiles`: Batch write files directly into the sandbox filesystem.
  - `readFiles`: Inspect file contents for context-aware code generation.
- 🖥️ **Interactive Split-Screen Workspace**:
  - **Live Preview (`Demo`)**: Sandboxed iframe with instant refresh, copyable URL, and external browser link.
  - **Code Explorer (`Code`)**: File tree viewer with syntax-highlighted code inspection.
  - **Chat Interface**: Streamed message history, prompt refinement, and step-by-step generation logs.
- 🔄 **Durable Event-Driven Architecture**: Managed background function runs, retries, and sleep steps powered by Inngest.
- 🔐 **Authentication & User Onboarding**: Complete user auth and profile sync with **Clerk**.
- 🗄️ **Modern Relational Database**: Schema contracts with **Prisma 8** on **Neon Serverless PostgreSQL**.
- 🌓 **Theme Customization**: Light, Dark, and System appearance modes powered by `next-themes`.

---

## 🏗️ Architecture Flow

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant NextApp as Next.js 16 Frontend
    participant Inngest as Inngest Event Engine
    participant Agent as Inngest AgentKit (LLM)
    participant E2B as E2B Cloud Sandbox
    participant DB as PostgreSQL (Prisma 8)

    User->>NextApp: Submits build prompt
    NextApp->>DB: Create Project & User Message
    NextApp->>Inngest: Send event `code-agent/run`
    Inngest->>E2B: Initialize isolated sandbox
    Inngest->>Agent: Run autonomous coding agent loop
    loop Tool Calling Loop (up to 15 iterations)
        Agent->>E2B: Run terminal commands / Write code files
        E2B-->>Agent: Command stdout/stderr & file status
    end
    Agent->>DB: Save Fragment (sandboxUrl, title, files snapshot)
    Agent-->>Inngest: Run complete
    NextApp->>DB: Poll / Fetch updated messages & fragments
    NextApp->>User: Display live interactive preview & code explorer
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | [Next.js 16 (Turbopack, App Router)](https://nextjs.org/) |
| **Runtime & PM** | [Bun](https://bun.sh/) |
| **AI Orchestration** | [Inngest AgentKit](https://github.com/inngest/agent-kit) (`@inngest/agent-kit`, `@inngest/ai`) |
| **Sandbox Execution**| [E2B Code Interpreter](https://e2b.dev/) (`@e2b/code-interpreter`) |
| **LLM Support** | OpenAI (`gpt-4o`), Anthropic (`claude-3-5-sonnet`), Google Gemini |
| **Database & ORM** | [Prisma ORM 8](https://www.prisma.io/) + [Neon PostgreSQL](https://neon.tech/) |
| **Authentication** | [Clerk](https://clerk.com/) (`@clerk/nextjs`) |
| **Styling & UI** | [Tailwind CSS v4](https://tailwindcss.com/), [Radix UI](https://www.radix-ui.com/), [Lucide Icons](https://lucide.dev/), [Sonner](https://sonner.emilkowal.ski/) |
| **State & Data** | [TanStack React Query](https://tanstack.com/query) |

---

## 🚀 Getting Started

### Prerequisites

Ensure you have installed:
- [Bun](https://bun.sh/) (`>= 1.2`) or [Node.js](https://nodejs.org/) (`>= 20.x`)
- Accounts & API keys for:
  - [Clerk](https://clerk.com/)
  - [E2B](https://e2b.dev/)
  - [OpenAI](https://platform.openai.com/) (or [Anthropic](https://console.anthropic.com/) / [Google AI](https://aistudio.google.com/))
  - [Neon PostgreSQL](https://neon.tech/) (or any PostgreSQL instance)

---

### 1. Clone & Install Dependencies

```bash
git clone https://github.com/rayyan4533/r0-dev.git
cd r0-dev

bun install
```

> **Note for Bun users:** The Inngest CLI requires postinstall scripts. Run `bun pm trust inngest-cli` if prompted.

---

### 2. Configure Environment Variables

Create a `.env` file in the root directory:

```env
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Database (PostgreSQL)
DATABASE_URL="postgresql://user:password@host/neondb?sslmode=require"

# E2B Sandbox
E2B_API_KEY=e2b_...
E2B_TEMPLATE_ID=ugwj9f6y2wocdpps7omf

# AI Model Keys (Choose your provider)
OPENAI_API_KEY="sk-proj-..."
OPENAI_MODEL="gpt-4o"

# Optional: Anthropic / Gemini
# ANTHROPIC_API_KEY="sk-ant-..."
# GEMINI_API_KEY="AIzaSy..."

# Inngest Dev Mode
INNGEST_DEV=1
```

---

### 3. Initialize the Database

Emit Prisma contracts and synchronize the database schema:

```bash
bun run contract:emit
```

---

### 4. Run the Development Environment

You need to run both the **Next.js Dev Server** and the **Inngest Dev Server**:

#### Terminal 1 — Next.js:
```bash
bun dev
```

#### Terminal 2 — Inngest Dev Server:
```bash
bun inngest-cli dev -u http://localhost:3000/api/inngest
```

- Open [http://localhost:3000](http://localhost:3000) to access the web application.
- Open [http://localhost:8288](http://localhost:8288) to inspect the Inngest workflow runs, traces, and step outputs.

---

## 📂 Project Structure

```
r0-dev/
├── src/
│   ├── app/
│   │   ├── (auth)/                 # Clerk Sign-in & Sign-up routes
│   │   ├── (root)/                 # Main authenticated layout & dashboard
│   │   │   ├── projects/[id]/      # Live project workspace & split preview
│   │   │   ├── layout.tsx          # User onboarding sync
│   │   │   └── page.tsx            # Home prompt composer & project grid
│   │   ├── api/
│   │   │   └── inngest/            # Inngest serve handler endpoint
│   │   ├── globals.css             # Tailwind CSS v4 styling & theme tokens
│   │   └── layout.tsx              # Root HTML & Providers (Clerk, React Query)
│   ├── components/
│   │   ├── brand/                  # Logo and brand marks
│   │   ├── home/                   # Prompt input, suggestions & templates
│   │   ├── projects/               # Workspace panels, iframe preview, code viewer
│   │   └── ui/                     # Reusable Shadcn / Radix UI components
│   ├── features/
│   │   ├── auth/                   # User sync and onboarding actions
│   │   ├── inngest/                # Agent workflow functions, client, and tools
│   │   ├── messages/               # Message state, actions, and hooks
│   │   └── projects/               # Project queries, mutations, and types
│   ├── lib/
│   │   ├── prompt.ts               # Core system prompt & formatting instructions
│   │   └── utils.ts                # Classname merge & helper utilities
│   ├── prisma/
│   │   ├── contract.prisma         # Prisma 8 schema contract
│   │   └── db.ts                   # Prisma client instance
│   └── proxy.ts                    # Clerk Next.js route protection proxy
├── scripts/
│   └── patch-agent-kit.mjs         # AgentKit tool-call & signature compatibility patch
├── package.json
└── README.md
```

---

## 🤝 Contributing

Contributions, feature requests, and bug reports are welcome!
Feel free to open an issue or submit a pull request.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
