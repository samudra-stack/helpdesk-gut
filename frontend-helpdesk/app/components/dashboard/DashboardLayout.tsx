"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode, useEffect, useState } from "react";
import logoGut from "../../../image/logo gut.png";

export type UserRole = "requester" | "it_staff" | "administrator";

export interface UserInfo {
    id: number;
    username: string;
    email: string;
    role: UserRole;
    department?: number | null;
    department_name?: string;
    must_change_password?: boolean;
    is_staff: boolean;
    is_superuser: boolean;
}

interface DashboardLayoutProps {
    user: UserInfo | null;
    title: string;
    subtitle?: string;
    children: ReactNode;
}

function getRoleLabel(role?: UserRole) {
    if (role === "administrator") return "administrator";
    if (role === "it_staff") return "it staff";
    return "requester";
}

function getInitial(username?: string) {
    if (!username) return "u";
    return username.charAt(0).toUpperCase();
}

function getDepartmentLabel(user: UserInfo | null) {
    return user?.department_name || "-";
}

function getPasswordStatus(user: UserInfo | null) {
    if (typeof user?.must_change_password !== "boolean") return null;
    return user.must_change_password
        ? "wajib ganti password"
        : "password sudah diganti";
}

function SidebarIcon({ name, filled = false }: { name: string; filled?: boolean }) {
    const className = `h-5 w-5 shrink-0 ${filled ? "fill-current" : ""}`;

    if (name === "dashboard") {
        return (
            <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="7" height="7" rx="1.5" />
                <rect x="14" y="3" width="7" height="7" rx="1.5" />
                <rect x="14" y="14" width="7" height="7" rx="1.5" />
                <rect x="3" y="14" width="7" height="7" rx="1.5" />
            </svg>
        );
    }

    if (name === "ticket") {
        return (
            <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v3a2 2 0 0 0 0 4v3a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-3a2 2 0 0 0 0-4V7Z" />
                <path d="M9 9h6" />
                <path d="M9 15h6" />
            </svg>
        );
    }

    if (name === "work-order") {
        return (
            <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 11l2 2 4-4" />
                <path d="M8 4h8l2 2v14H6V6l2-2Z" />
                <path d="M8 4v4h8V4" />
            </svg>
        );
    }

    if (name === "departments") {
        return (
            <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 21V7l8-4 8 4v14" />
                <path d="M9 21v-8h6v8" />
                <path d="M8 9h.01" />
                <path d="M16 9h.01" />
            </svg>
        );
    }

    return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
    );
}

function SidebarItem({
    href,
    label,
    icon,
    active,
}: {
    href: string;
    label: string;
    icon: string;
    active: boolean;
}) {
    return (
        <Link
            href={href}
            className={`flex min-h-12 w-full items-center gap-md rounded-xl px-lg py-3 font-body-lg text-body-lg font-semibold transition-colors duration-200 ${active
                ? "bg-primary text-white shadow-sm"
                : "text-slate-300 hover:bg-slate-800 hover:text-white"
                }`}
        >
            <SidebarIcon name={icon} filled={active} />
            {label}
        </Link>
    );
}

export default function DashboardLayout({
    user,
    title,
    subtitle,
    children,
}: DashboardLayoutProps) {
    const router = useRouter();
    const pathname = usePathname();
    const [isProfileOpen, setIsProfileOpen] = useState(false);

    useEffect(() => {
        if (
            user?.must_change_password &&
            pathname !== "/dashboard/change-password"
        ) {
            router.replace("/dashboard/change-password");
        }
    }, [pathname, router, user?.must_change_password]);

    const handleLogout = () => {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        localStorage.removeItem("user");
        localStorage.removeItem("remember_until");
        router.push("/login");
    };

    return (
        <div className="min-h-screen bg-background">
            <aside
                className="dashboard-sidebar fixed inset-y-0 left-0 z-30 hidden flex-col bg-dark-navy py-lg text-white md:flex"
            >
                <div className="mb-xl px-lg">
                    <div className="flex items-center gap-md">
                        <div className="flex h-13 w-13 shrink-0 items-center justify-center rounded-lg bg-white p-1 shadow-sm ring-1 ring-white/10">
                            <Image
                                src={logoGut}
                                alt="GUT"
                                className="h-auto w-8 object-contain"
                                priority
                            />
                        </div>
                        <div className="min-w-0">
                            <h1 className="font-title-md text-title-md leading-tight text-white">
                                HelpDesk GUT
                            </h1>
                            <p className="font-caption text-caption leading-tight text-slate-300">
                                Enterprise Support
                            </p>
                        </div>
                    </div>
                </div>
                <nav className="flex flex-1 flex-col gap-md px-sm">
                    <SidebarItem
                        href="/dashboard"
                        label="Dashboard"
                        icon="dashboard"
                        active={pathname === "/dashboard"}
                    />

                    <SidebarItem
                        href="/dashboard/create"
                        label="Tickets"
                        icon="ticket"
                        active={pathname === "/dashboard/create"}
                    />

                    <SidebarItem
                        href="/dashboard/work-order"
                        label="Work Order"
                        icon="work-order"
                        active={pathname === "/dashboard/work-order"}
                    />

                    <SidebarItem
                        href="/dashboard/departments"
                        label="Departments"
                        icon="departments"
                        active={pathname === "/dashboard/departments"}
                    />

                    <SidebarItem
                        href="/dashboard/user-management"
                        label="User Management"
                        icon="users"
                        active={pathname === "/dashboard/user-management"}
                    />
                </nav>

                <div className="mt-auto border-t border-slate-800 px-lg pt-lg">
                    <button
                        type="button"
                        onClick={() => user && setIsProfileOpen(true)}
                        disabled={!user}
                        className="w-full rounded-lg p-sm text-left transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                        <div className="flex items-center gap-md">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary font-label-md text-label-md text-white">
                                {getInitial(user?.username)}
                            </div>

                            <div className="min-w-0 flex-1">
                                <p className="truncate font-label-md text-label-md text-white">
                                    {user?.username || "user"}
                                </p>
                                <p className="truncate font-caption text-caption text-slate-400">
                                    {getDepartmentLabel(user)}
                                </p>
                            </div>
                        </div>
                    </button>
                </div>
            </aside>

            <main className="dashboard-main min-h-screen min-w-0">
                <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-md border-b border-border-subtle bg-white px-lg shadow-sm">
                    <div className="min-w-0">
                        <h2 className="truncate font-title-md text-title-md text-slate-900">
                            {title}
                        </h2>
                        {subtitle && (
                            <p className="mt-xs hidden truncate font-caption text-caption text-slate-500 sm:block">
                                {subtitle}
                            </p>
                        )}
                    </div>

                    <button
                        type="button"
                        onClick={handleLogout}
                        className="inline-flex shrink-0 items-center gap-sm rounded-lg px-md py-sm font-label-md text-label-md text-red-600 transition hover:bg-red-50"
                    >
                        <svg
                            aria-hidden="true"
                            className="h-4 w-4"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                            <path d="M16 17l5-5-5-5" />
                            <path d="M21 12H9" />
                        </svg>
                        Logout
                    </button>
                </header>

                <section className="p-xl">{children}</section>
            </main>

            {isProfileOpen && user && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-4">
                    <div
                        role="dialog"
                        aria-modal="true"
                        className="modal-card max-w-sm text-center"
                    >
                        <h3 className="font-headline-sm text-headline-sm text-slate-900">
                            account profile
                        </h3>

              <div className="mx-auto mt-lg flex h-16 w-16 items-center justify-center rounded-full bg-primary font-headline-md text-headline-md text-white">
                {getInitial(user.username)}
              </div>

              <div className="mt-lg space-y-md text-left">
                <div>
                  <p className="font-caption text-caption uppercase text-slate-400">
                    username
                  </p>
                  <p className="font-label-md text-label-md text-slate-900">
                    {user.username}
                  </p>
                </div>

                <div>
                  <p className="font-caption text-caption uppercase text-slate-400">
                    role
                  </p>
                  <p className="text-body-default text-on-surface-variant">
                    {getRoleLabel(user.role)}
                  </p>
                </div>

                <div>
                  <p className="font-caption text-caption uppercase text-slate-400">
                    department
                  </p>
                  <p className="text-body-default text-on-surface-variant">
                    {getDepartmentLabel(user)}
                  </p>
                </div>

                {user.email && (
                  <div>
                    <p className="font-caption text-caption uppercase text-slate-400">
                      email
                    </p>
                    <p className="break-words text-body-default text-on-surface-variant">
                      {user.email}
                    </p>
                  </div>
                )}

                {getPasswordStatus(user) && (
                  <div>
                    <p className="font-caption text-caption uppercase text-slate-400">
                      status password
                    </p>
                    <p className="text-body-default text-on-surface-variant">
                      {getPasswordStatus(user)}
                    </p>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => setIsProfileOpen(false)}
                className="btn-primary mt-lg w-full"
              >
                close
              </button>
            </div>
                </div>
            )}
        </div>
    );
}
