import { GlassNavbar } from "@/components/home/glass-navbar";
import { HomeBackground } from "@/components/home/home-background";
// import { ProjectGrid } from "@/components/home/project-grid";
import { PromptInput } from "@/components/home/prompt-input";

/**
 * Home (dashboard) page.
 *
 * Renders the decorative background, the glass navbar, the main prompt input for
 * starting a new build, and the grid of the user's existing projects.
 */
export default function Home() {
  return (
    <div className="relative flex flex-col flex-1 min-h-full overflow-hidden">
      <HomeBackground />
      <GlassNavbar />
      <main className="flex flex-col flex-1 items-center px-4 pt-28 pb-16">
        <div className="flex flex-col items-center gap-8 w-full max-w-3xl text-center">
          <h1 className="font-semibold text-3xl sm:text-4xl tracking-tight">
            What do you want to create?
          </h1>
          <PromptInput />
        </div>

        <div className="mt-16 w-full max-w-5xl">
          {/* <ProjectGrid /> */}
        </div>
      </main>
    </div>
  );
}
