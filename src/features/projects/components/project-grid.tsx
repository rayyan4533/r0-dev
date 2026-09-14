"use client";

import Link from "next/link";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useGetProjects } from "@/features/projects/hooks/projects";
import { getProjectThumbnailUrl } from "../lib";
import { cn } from "@/lib/utils";

function ProjectCardSkeleton() {
    return (
        <Card className="bg-card/50 shadow-sm backdrop-blur-sm py-0 border-border/60 rounded-2xl overflow-hidden">
            <Skeleton className="rounded-none w-full aspect-square" />
            <CardHeader className="px-4 pb-4">
                <Skeleton className="w-2/3 h-4" />
            </CardHeader>
        </Card>
    );
}

function formatProjectName(name: string) {
    return name.replace(/-/g, " ");
}

export function ProjectGrid() {
    const { data: projects, isLoading, isError } = useGetProjects();

    if (isError) {
        return null;
    }

    if (!isLoading && (!projects || projects.length === 0)) {
        return null;
    }

    return (
        <section className="w-full">
            <h2 className="mb-4 font-medium text-muted-foreground text-sm">
                Your projects
            </h2>

            <div className="gap-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
                {isLoading
                    ? Array.from({ length: 4 }).map((_, index) => (
                        <ProjectCardSkeleton key={index} />
                    ))
                    : projects?.map((project) => (
                        <Link
                            key={project.id}
                            href={`/projects/${project.id}`}
                            className="group block"
                        >
                            <Card
                                className={cn(
                                    "bg-card/50 shadow-sm backdrop-blur-sm py-0 border-border/60 rounded-2xl overflow-hidden",
                                    "transition-colors hover:border-border hover:bg-card/80",
                                )}
                            >
                                <img
                                    src={getProjectThumbnailUrl(project.id)}
                                    alt=""
                                    className="w-full object-cover aspect-square"
                                />
                                <CardHeader className="px-4 pb-4">
                                    <CardTitle className="truncate capitalize">
                                        {formatProjectName(project.name)}
                                    </CardTitle>
                                </CardHeader>
                            </Card>
                        </Link>
                    ))}
            </div>
        </section>
    );
}
