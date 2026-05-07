import { Sidebar } from "./Sidebar";

export function AppShell({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex h-screen overflow-hidden">
            <Sidebar />
            <main className="flex-1 overflow-y-auto bg-background">
                <div className="mx-auto max-w-6xl px-6 py-6">{children}</div>
            </main>
        </div>
    );
}
