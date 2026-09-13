export default function AuthLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <div className="flex flex-1 justify-center items-center bg-zinc-50 dark:bg-black px-4 py-16">
            {children}
        </div>
    );
}