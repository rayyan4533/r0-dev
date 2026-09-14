import { Spinner } from "@/components/ui/spinner";


export default function Loading() {
    return (
        <div className="flex flex-1 justify-center items-center min-h-full">
            <Spinner className="size-6 text-muted-foreground" />
        </div>
    );
}
