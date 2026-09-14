import { Template, waitForURL } from 'e2b'

export const template = Template()
    // 1. Start from an ultra-fast Bun Linux container base
    .fromBunImage('1.3')

    // 2. Set the workspace directory
    .setWorkdir('/home/user/nextjs-app')

    // 3. Scaffold a Next.js App Router app with TypeScript and Tailwind using Bun
    .runCmd('bun create next-app . --app --ts --tailwind --yes --use-bun')

    // 4. Initialize Shadcn UI with default settings (-d) non-interactively (-y)
    .runCmd('bunx --bun shadcn@latest init -d -y')

    // 5. Pre-install ALL (-a) Shadcn components (buttons, dialogs, cards, tabs, inputs, etc.)
    .runCmd('bunx --bun shadcn@latest add -a -y')

    // 6. Move the files up to /home/user/ and delete the temporary folder
    .runCmd('mv /home/user/nextjs-app/* /home/user/ && rm -rf /home/user/nextjs-app')

    // 7. Set root directory for the app
    .setWorkdir('/home/user')

    // 8. Define the startup command: runs Next.js dev server with Turbopack and waits for port 3000
    .setStartCmd('bun --bun run dev --turbo', waitForURL('http://localhost:3000'))
