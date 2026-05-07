"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Icon from "@mdi/react";
import { mdiAccountGroup, mdiBriefcaseOutline, mdiLogout, mdiShieldAccount, mdiServer } from "@mdi/js";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";

const navItems = [
    { href: "/users", label: "Users", icon: mdiAccountGroup },
    { href: "/accounts", label: "Accounts", icon: mdiBriefcaseOutline },
    { href: "/agents", label: "Agents", icon: mdiServer },
    
];

export function Sidebar() {
    const pathname = usePathname();

    return (
        <aside className="flex h-full w-56 flex-col bg-sidebar text-sidebar-foreground">
            <div className="flex items-center gap-2 px-4 py-5">
                <Icon path={mdiShieldAccount} size={1} className="text-primary" />
                <span className="font-semibold tracking-tight">SSMCloud Admin</span>
            </div>

            <Separator className="bg-white/10" />

            <nav className="flex flex-1 flex-col gap-1 px-2 py-3">
                {navItems.map((item) => {
                    const active = pathname === item.href || (pathname?.startsWith(item.href + "/") ?? false);
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                                active ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-sidebar-foreground/70 hover:bg-white/10 hover:text-sidebar-foreground",
                            )}
                        >
                            <Icon path={item.icon} size={0.85} />
                            {item.label}
                        </Link>
                    );
                })}
            </nav>

            <Separator className="bg-white/10" />

            <div className="px-2 py-3">
                <a
                    href="/auth/logout"
                    className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-sidebar-foreground/70 transition-colors hover:bg-white/10 hover:text-sidebar-foreground"
                >
                    <Icon path={mdiLogout} size={0.85} />
                    Logout
                </a>
            </div>
        </aside>
    );
}
