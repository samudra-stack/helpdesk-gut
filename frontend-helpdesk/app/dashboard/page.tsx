"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout, {
    UserInfo,
    UserRole,
} from "../components/dashboard/DashboardLayout";
import TicketDetailModal, {
    TicketDetail,
} from "../components/dashboard/TicketDetailModal";
import { apiUrl } from "../lib/auth";

type StatusFilter =
    | "all"
    | "new"
    | "assigned"
    | "in progress"
    | "resolved"
    | "closed"
    | "archived";

interface Engineer {
    id: number;
    username: string;
    email: string;
}

interface Ticket {
    id: number;
    ticket_code: string;
    subject: string;
    priority: string;
    status: string;
    created_at: string;
    created_by_username?: string;
    assigned_engineers?: Engineer[];
    assigned_engineer_usernames?: string[];
}

function getDashboardTitle(role?: UserRole) {
    if (role === "administrator") return "All Tickets";
    if (role === "it_staff") return "My Task";
    return "My Tickets";
}

function getPriorityClass(priority: string) {
    if (priority === "High") return "bg-red-100 text-red-700";
    if (priority === "Medium") return "bg-yellow-100 text-yellow-700";
    return "bg-green-100 text-green-700";
}

function getStatusClass(status: string) {
    const normalizedStatus = status.toLowerCase();

    if (normalizedStatus === "new") return "bg-blue-100 text-blue-700";
    if (normalizedStatus === "assigned") return "bg-orange-100 text-orange-700";
    if (normalizedStatus === "in progress") return "bg-purple-100 text-purple-700";
    if (normalizedStatus === "resolved") return "bg-green-100 text-green-700";
    if (normalizedStatus === "closed") return "bg-gray-200 text-gray-700";

    return "bg-gray-100 text-gray-700";
}

function formatDate(value: string) {
    return new Date(value).toLocaleDateString("id-ID", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

function getAssignedNames(ticket: Ticket) {
    if (ticket.assigned_engineers && ticket.assigned_engineers.length > 0) {
        return ticket.assigned_engineers
            .map((engineer) => engineer.username)
            .join(", ");
    }

    if (
        ticket.assigned_engineer_usernames &&
        ticket.assigned_engineer_usernames.length > 0
    ) {
        return ticket.assigned_engineer_usernames.join(", ");
    }

    return "-";
}

function isAssignedToUser(ticket: Ticket, user: UserInfo | null) {
    if (!user) return false;

    return (
        ticket.assigned_engineers?.some((engineer) => engineer.id === user.id) ||
        false
    );
}

function isActiveTaskStatus(status: string) {
    const normalizedStatus = status.toLowerCase();
    return normalizedStatus === "assigned" || normalizedStatus === "in progress";
}

function isArchivedTaskStatus(status: string) {
    const normalizedStatus = status.toLowerCase();
    return normalizedStatus === "resolved" || normalizedStatus === "closed";
}

export default function DashboardPage() {
    const router = useRouter();

    const [user, setUser] = useState<UserInfo | null>(null);
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [selectedStatus, setSelectedStatus] = useState<StatusFilter>("all");
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [rowsPerPage, setRowsPerPage] = useState(5);
    const [currentPage, setCurrentPage] = useState(1);
    const [detailTicketId, setDetailTicketId] = useState<number | null>(null);
    const [isChecking, setIsChecking] = useState(true);
    const [errorMsg, setErrorMsg] = useState("");

    const clearSessionAndRedirect = useCallback(() => {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        localStorage.removeItem("user");
        router.push("/login");
    }, [router]);

    useEffect(() => {
        const token = localStorage.getItem("access_token");

        if (!token) {
            router.push("/login");
            return;
        }

        const loadDashboardData = async () => {
            try {
                let currentUser: UserInfo | null = null;
                const storedUser = localStorage.getItem("user");

                if (storedUser) {
                    try {
                        currentUser = JSON.parse(storedUser);
                    } catch {
                        localStorage.removeItem("user");
                    }
                }

                if (!currentUser) {
                    const userResponse = await fetch(apiUrl("/api/user-info/"), {
                        method: "GET",
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    });

                    if (!userResponse.ok) {
                        clearSessionAndRedirect();
                        return;
                    }

                    currentUser = await userResponse.json();
                    localStorage.setItem("user", JSON.stringify(currentUser));
                }

                if (!currentUser) {
                    clearSessionAndRedirect();
                    return;
                }

                setUser(currentUser);

                const ticketResponse = await fetch(apiUrl("/api/tickets/"), {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                if (ticketResponse.status === 401) {
                    clearSessionAndRedirect();
                    return;
                }

                if (!ticketResponse.ok) {
                    setErrorMsg("gagal mengambil data tiket.");
                    return;
                }

                const ticketData = await ticketResponse.json();

                if (Array.isArray(ticketData)) {
                    setTickets(ticketData);
                } else {
                    setTickets(ticketData.results || []);
                }
            } catch {
                setErrorMsg("gagal terhubung ke server backend.");
            } finally {
                setIsChecking(false);
            }
        };

        loadDashboardData();
    }, [clearSessionAndRedirect, router]);

    const assignedTaskTickets = useMemo(() => {
        if (user?.role !== "it_staff") return [];

        return tickets.filter((ticket) => isAssignedToUser(ticket, user));
    }, [tickets, user]);

    const myTaskTickets = useMemo(() => {
        return assignedTaskTickets.filter((ticket) =>
            isActiveTaskStatus(ticket.status)
        );
    }, [assignedTaskTickets]);

    const archivedTaskTickets = useMemo(() => {
        return assignedTaskTickets.filter((ticket) =>
            isArchivedTaskStatus(ticket.status)
        );
    }, [assignedTaskTickets]);

    const visibleTickets = useMemo(() => {
        return user?.role === "it_staff" ? myTaskTickets : tickets;
    }, [myTaskTickets, tickets, user?.role]);

    const filteredTickets = useMemo(() => {
        let ticketsByStatus: Ticket[];

        if (user?.role === "it_staff" && selectedStatus === "archived") {
            ticketsByStatus = archivedTaskTickets;
        } else if (selectedStatus === "all") {
            ticketsByStatus = visibleTickets;
        } else {
            ticketsByStatus = visibleTickets.filter(
                (ticket) => ticket.status.toLowerCase() === selectedStatus
            );
        }

        const keyword = searchQuery.trim().toLowerCase();

        if (!keyword) return ticketsByStatus;

        return ticketsByStatus.filter((ticket) => {
            const searchableText = [
                ticket.ticket_code,
                ticket.subject,
                ticket.priority,
                ticket.status,
                ticket.created_by_username,
                getAssignedNames(ticket),
            ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase();

            return searchableText.includes(keyword);
        });
    }, [archivedTaskTickets, searchQuery, selectedStatus, user?.role, visibleTickets]);

    const totalPages = Math.max(1, Math.ceil(filteredTickets.length / rowsPerPage));
    const visibleCurrentPage = Math.min(currentPage, totalPages);
    const startRow = filteredTickets.length === 0
        ? 0
        : (visibleCurrentPage - 1) * rowsPerPage + 1;
    const endRow = Math.min(visibleCurrentPage * rowsPerPage, filteredTickets.length);

    const paginatedTickets = useMemo(() => {
        const startIndex = (visibleCurrentPage - 1) * rowsPerPage;
        return filteredTickets.slice(startIndex, startIndex + rowsPerPage);
    }, [filteredTickets, rowsPerPage, visibleCurrentPage]);

    const visiblePageNumbers = useMemo(() => {
        const maxButtons = 5;
        const start = Math.max(1, visibleCurrentPage - 2);
        const end = Math.min(totalPages, start + maxButtons - 1);
        const adjustedStart = Math.max(1, end - maxButtons + 1);

        return Array.from(
            { length: end - adjustedStart + 1 },
            (_, index) => adjustedStart + index
        );
    }, [totalPages, visibleCurrentPage]);

    const stats = useMemo(() => {
        return {
            total: visibleTickets.length,
            new: visibleTickets.filter(
                (ticket) => ticket.status.toLowerCase() === "new"
            ).length,
            assigned: visibleTickets.filter(
                (ticket) => ticket.status.toLowerCase() === "assigned"
            ).length,
            inProgress: visibleTickets.filter(
                (ticket) => ticket.status.toLowerCase() === "in progress"
            ).length,
            resolved: visibleTickets.filter(
                (ticket) => ticket.status.toLowerCase() === "resolved"
            ).length,
            closed: visibleTickets.filter(
                (ticket) => ticket.status.toLowerCase() === "closed"
            ).length,
            archived: archivedTaskTickets.length,
        };
    }, [archivedTaskTickets.length, visibleTickets]);

    const statusMenus = user?.role === "it_staff"
        ? [
            { key: "all" as StatusFilter, label: "all", count: stats.total },
            {
                key: "assigned" as StatusFilter,
                label: "assigned",
                count: stats.assigned,
            },
            {
                key: "in progress" as StatusFilter,
                label: "in progress",
                count: stats.inProgress,
            },
            {
                key: "archived" as StatusFilter,
                label: "archived task",
                count: stats.archived,
            },
        ]
        : [
            { key: "all" as StatusFilter, label: "all", count: stats.total },
            { key: "new" as StatusFilter, label: "new", count: stats.new },
            {
                key: "assigned" as StatusFilter,
                label: "assigned",
                count: stats.assigned,
            },
            {
                key: "in progress" as StatusFilter,
                label: "in progress",
                count: stats.inProgress,
            },
            {
                key: "resolved" as StatusFilter,
                label: "resolved",
                count: stats.resolved,
            },
            {
                key: "closed" as StatusFilter,
                label: "closed",
                count: stats.closed,
            },
        ];

    const handleSearchChange = (value: string) => {
        setSearchQuery(value);
        setCurrentPage(1);
    };

    const handleStatusFilterChange = (value: StatusFilter) => {
        setSelectedStatus(value);
        setCurrentPage(1);
    };

    const handleRowsPerPageChange = (value: number) => {
        setRowsPerPage(value);
        setCurrentPage(1);
    };

    const toggleSearch = () => {
        if (isSearchOpen) {
            setSearchQuery("");
            setCurrentPage(1);
        }

        setIsSearchOpen((prev) => !prev);
    };

    const handleTicketUpdated = (updatedTicket: TicketDetail) => {
        setTickets((prevTickets) =>
            prevTickets.map((ticket) =>
                ticket.id === updatedTicket.id ? updatedTicket : ticket
            )
        );
    };

    if (isChecking) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-background font-body-default text-body-default text-on-surface-variant">
                memuat dashboard...
            </div>
        );
    }

    return (
        <DashboardLayout
            user={user}
            title={getDashboardTitle(user?.role)}
            subtitle={
                user?.role === "it_staff"
                    ? "tiket yang ditugaskan ke akun it ini"
                    : "ringkasan tiket berdasarkan role login saat ini"
            }
        >
            {errorMsg && (
                <div className="alert-error">
                    {errorMsg}
                </div>
            )}

            {user?.role === "it_staff" ? (
                <div className="grid w-full max-w-7xl grid-cols-1 gap-lg xl:grid-cols-12">
                    <div className="xl:col-span-3">
                        <div className="card-shell p-lg text-center">
                            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-slate-100 font-headline-lg text-headline-lg text-slate-700 uppercase">
                                {user?.username?.charAt(0) || "u"}
                            </div>

                            <h3 className="mt-md font-title-md text-title-md text-slate-900">
                                {user?.username}
                            </h3>

                            <p className="font-caption text-caption uppercase tracking-wide text-slate-500">
                                technical
                            </p>

                            <div className="mt-lg border-t border-border-subtle pt-lg text-left">
                                <p className="mb-md font-label-md text-label-md text-primary">
                                    My Task Status
                                </p>

                                <div className="space-y-sm">
                                    {statusMenus.map((item) => (
                                        <button
                                            key={item.key}
                                            onClick={() => handleStatusFilterChange(item.key)}
                                            className={`flex w-full items-center justify-between rounded-lg px-md py-3 font-label-md text-label-md transition ${selectedStatus === item.key
                                                    ? "bg-blue-50 text-primary"
                                                    : "text-on-surface-variant hover:bg-surface-container"
                                                }`}
                                        >
                                            <span>{item.label}</span>
                                            <span
                                                className={`rounded-full px-sm py-xs font-caption text-caption ${selectedStatus === item.key
                                                        ? "bg-blue-100 text-blue-700"
                                                        : "bg-slate-100 text-on-surface-variant"
                                                    }`}
                                            >
                                                {item.count}
                                            </span>
                                        </button>
                                    ))}
                                </div>

                                <Link
                                    href="/dashboard/work-order"
                                    className="btn-primary mt-lg w-full"
                                >
                                    Buka Work Order
                                </Link>
                            </div>
                        </div>
                    </div>

                    <div className="xl:col-span-9">
                        <div className="card-shell">
                            <div className="card-header flex flex-col gap-md lg:flex-row lg:items-center lg:justify-between">
                                <div>
                                    <h3 className="font-title-md text-title-md text-slate-900">
                                        {selectedStatus === "archived"
                                            ? "archived task"
                                            : `my task - ${selectedStatus}`}
                                    </h3>

                                    <p className="mt-xs text-body-default text-slate-500">
                                        {selectedStatus === "archived"
                                            ? `menampilkan ${filteredTickets.length} tiket selesai yang assigned ke ${user.username}.`
                                            : `menampilkan ${filteredTickets.length} tiket aktif yang assigned ke ${user.username}.`}
                                    </p>
                                </div>

                                <div className="flex flex-col gap-md sm:flex-row sm:items-center sm:justify-end">
                                    {isSearchOpen && (
                                        <div className="relative w-full sm:w-72">
                                            <svg
                                                aria-hidden="true"
                                                className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
                                                viewBox="0 0 24 24"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth="2"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                            >
                                                <circle cx="11" cy="11" r="8" />
                                                <path d="M21 21l-4.3-4.3" />
                                            </svg>

                                            <input
                                                type="search"
                                                autoFocus
                                                value={searchQuery}
                                                onChange={(event) => handleSearchChange(event.target.value)}
                                                className="form-control pl-12"
                                                placeholder="Cari tiket atau engineer..."
                                            />
                                        </div>
                                    )}

                                    <button
                                        type="button"
                                        onClick={toggleSearch}
                                        className="btn-secondary btn-sm shrink-0"
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
                                            <circle cx="11" cy="11" r="8" />
                                            <path d="M21 21l-4.3-4.3" />
                                        </svg>
                                        Search
                                    </button>
                                </div>
                            </div>

                            <div className="divide-y divide-border-subtle">
                                {paginatedTickets.length > 0 ? (
                                    paginatedTickets.map((ticket) => (
                                        <div
                                            key={ticket.id}
                                            className="p-lg transition hover:bg-surface-container"
                                        >
                                            <div className="flex flex-col gap-md xl:flex-row xl:items-start xl:justify-between">
                                                <div className="min-w-0">
                                                    <div className="mb-sm flex flex-wrap items-center gap-sm">
                                                        <button
                                                            type="button"
                                                            onClick={() => setDetailTicketId(ticket.id)}
                                                            className="font-label-md text-label-md text-primary hover:text-primary-strong hover:underline"
                                                        >
                                                            {ticket.ticket_code}
                                                        </button>

                                                        <span
                                                            className={`px-3 py-1 rounded-full text-xs font-semibold ${getPriorityClass(
                                                                ticket.priority
                                                            )}`}
                                                        >
                                                            {ticket.priority}
                                                        </span>

                                                        <span
                                                            className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusClass(
                                                                ticket.status
                                                            )}`}
                                                        >
                                                            {ticket.status}
                                                        </span>
                                                    </div>

                                                    <h4 className="font-title-md text-title-md text-slate-900">
                                                        {ticket.subject}
                                                    </h4>

                                                    <div className="mt-sm space-y-xs">
                                                        <p className="text-body-default text-slate-500">
                                                            dibuat pada {formatDate(ticket.created_at)}
                                                        </p>

                                                        <p className="text-body-default text-slate-500">
                                                            engineer:{" "}
                                                            <span className="font-semibold text-slate-700">
                                                                {getAssignedNames(ticket)}
                                                            </span>
                                                        </p>
                                                    </div>
                                                </div>

                                                <button
                                                    type="button"
                                                    onClick={() => setDetailTicketId(ticket.id)}
                                                    className="btn-primary shrink-0"
                                                >
                                                    lihat detail
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="p-xl text-center text-body-default text-slate-500">
                                        {selectedStatus === "archived"
                                            ? "belum ada tiket selesai di arsip."
                                            : "belum ada tiket yang ditugaskan ke akun ini pada filter tersebut."}
                                    </div>
                                )}
                            </div>

                            <div className="flex flex-col gap-md border-t border-border-subtle p-lg md:flex-row md:items-center md:justify-between">
                                <p className="font-caption text-caption text-slate-500">
                                    Menampilkan {startRow}-{endRow} dari {filteredTickets.length} tiket
                                </p>

                                <div className="flex flex-wrap items-center gap-sm">
                                    <label
                                        htmlFor="dashboard-task-rows-per-page"
                                        className="font-caption text-caption text-slate-500"
                                    >
                                        Rows per page
                                    </label>

                                    <select
                                        id="dashboard-task-rows-per-page"
                                        value={rowsPerPage}
                                        onChange={(event) =>
                                            handleRowsPerPageChange(Number(event.target.value))
                                        }
                                        className="rounded-lg border border-slate-300 bg-white px-md py-sm font-label-sm text-label-sm text-slate-700 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                                    >
                                        <option value={5}>5</option>
                                        <option value={10}>10</option>
                                        <option value={20}>20</option>
                                        <option value={50}>50</option>
                                    </select>

                                    <button
                                        type="button"
                                        onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                                        disabled={visibleCurrentPage === 1}
                                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border-subtle text-slate-600 transition hover:bg-surface-container disabled:cursor-not-allowed disabled:opacity-40"
                                        aria-label="Halaman sebelumnya"
                                    >
                                        &lt;
                                    </button>

                                    {visiblePageNumbers.map((pageNumber) => (
                                        <button
                                            key={pageNumber}
                                            type="button"
                                            onClick={() => setCurrentPage(pageNumber)}
                                            className={`inline-flex h-9 w-9 items-center justify-center rounded-lg font-button text-button transition ${visibleCurrentPage === pageNumber
                                                ? "bg-primary text-white"
                                                : "border border-border-subtle text-slate-700 hover:bg-surface-container"
                                                }`}
                                        >
                                            {pageNumber}
                                        </button>
                                    ))}

                                    <button
                                        type="button"
                                        onClick={() =>
                                            setCurrentPage((page) => Math.min(totalPages, page + 1))
                                        }
                                        disabled={visibleCurrentPage === totalPages}
                                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border-subtle text-slate-600 transition hover:bg-surface-container disabled:cursor-not-allowed disabled:opacity-40"
                                        aria-label="Halaman berikutnya"
                                    >
                                        &gt;
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="page-shell">
                    <div className="grid grid-cols-1 gap-md sm:grid-cols-2 xl:grid-cols-6">
                        <div className="card-shell p-lg">
                            <p className="font-caption text-caption text-slate-500">total tiket</p>
                            <p className="mt-sm font-headline-lg text-headline-lg text-slate-900">
                                {stats.total}
                            </p>
                        </div>

                        <div className="card-shell p-lg">
                            <p className="font-caption text-caption text-slate-500">new</p>
                            <p className="mt-sm font-headline-lg text-headline-lg text-blue-600">
                                {stats.new}
                            </p>
                        </div>

                        <div className="card-shell p-lg">
                            <p className="font-caption text-caption text-slate-500">assigned</p>
                            <p className="mt-sm font-headline-lg text-headline-lg text-orange-600">
                                {stats.assigned}
                            </p>
                        </div>

                        <div className="card-shell p-lg">
                            <p className="font-caption text-caption text-slate-500">in progress</p>
                            <p className="mt-sm font-headline-lg text-headline-lg text-purple-600">
                                {stats.inProgress}
                            </p>
                        </div>

                        <div className="card-shell p-lg">
                            <p className="font-caption text-caption text-slate-500">resolved</p>
                            <p className="mt-sm font-headline-lg text-headline-lg text-green-600">
                                {stats.resolved}
                            </p>
                        </div>

                        <div className="card-shell p-lg">
                            <p className="font-caption text-caption text-slate-500">closed</p>
                            <p className="mt-sm font-headline-lg text-headline-lg text-slate-700">
                                {stats.closed}
                            </p>
                        </div>
                    </div>

                    <div className="card-shell">
                        <div className="card-header flex flex-col gap-md lg:flex-row lg:items-center lg:justify-between">
                            <div>
                                <h3 className="font-title-md text-title-md text-slate-900">
                                    daftar tiket
                                </h3>

                                <p className="mt-xs text-body-default text-slate-500">
                                    {user?.role === "requester"
                                        ? "menampilkan tiket yang dibuat oleh user ini."
                                        : "menampilkan tiket sesuai hak akses role saat ini."}
                                </p>
                            </div>

                            <div className="flex flex-col gap-md lg:flex-row lg:items-center lg:justify-end">
                                {isSearchOpen && (
                                    <div className="relative w-full lg:max-w-md">
                                        <svg
                                            aria-hidden="true"
                                            className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        >
                                            <circle cx="11" cy="11" r="8" />
                                            <path d="M21 21l-4.3-4.3" />
                                        </svg>

                                        <input
                                            type="search"
                                            autoFocus
                                            value={searchQuery}
                                            onChange={(event) => handleSearchChange(event.target.value)}
                                            className="form-control pl-12"
                                            placeholder="Cari tiket, requester, atau engineer..."
                                        />
                                    </div>
                                )}

                                <button
                                    type="button"
                                    onClick={toggleSearch}
                                    className="btn-secondary btn-sm shrink-0"
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
                                        <circle cx="11" cy="11" r="8" />
                                        <path d="M21 21l-4.3-4.3" />
                                    </svg>
                                    Search
                                </button>

                                <div className="relative w-full sm:w-64">
                                    <label htmlFor="dashboard-status-filter" className="sr-only">
                                        Filter status tiket
                                    </label>

                                    <select
                                        id="dashboard-status-filter"
                                        value={selectedStatus}
                                        onChange={(event) =>
                                            handleStatusFilterChange(event.target.value as StatusFilter)
                                        }
                                        className="form-control appearance-none pr-12"
                                    >
                                        {statusMenus.map((item) => (
                                            <option key={item.key} value={item.key}>
                                                {item.label} ({item.count})
                                            </option>
                                        ))}
                                    </select>

                                    <svg
                                        aria-hidden="true"
                                        className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-on-surface-variant"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                    >
                                        <path d="M6 9l6 6 6-6" />
                                    </svg>
                                </div>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="table-head-row">
                                        <th className="table-head-cell">id tiket</th>
                                        {user?.role === "administrator" && (
                                            <th className="table-head-cell">requester</th>
                                        )}
                                        <th className="table-head-cell">subjek kendala</th>
                                        <th className="table-head-cell">prioritas</th>
                                        <th className="table-head-cell">status</th>
                                        <th className="table-head-cell">engineer</th>
                                        <th className="table-head-cell">tanggal dibuat</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {paginatedTickets.length > 0 ? (
                                        paginatedTickets.map((ticket) => (
                                            <tr
                                                key={ticket.id}
                                                className="border-b border-border-subtle transition hover:bg-surface-container"
                                            >
                                                <td className="table-body-cell font-semibold">
                                                    <button
                                                        type="button"
                                                        onClick={() => setDetailTicketId(ticket.id)}
                                                        className="text-primary hover:text-primary-strong hover:underline"
                                                    >
                                                        {ticket.ticket_code}
                                                    </button>
                                                </td>

                                                {user?.role === "administrator" && (
                                                    <td className="table-body-cell text-on-surface-variant">
                                                        {ticket.created_by_username || "-"}
                                                    </td>
                                                )}

                                                <td className="table-body-cell text-slate-800">
                                                    {ticket.subject}
                                                </td>

                                                <td className="table-body-cell">
                                                    <span
                                                        className={`px-3 py-1 rounded-full text-xs font-semibold ${getPriorityClass(
                                                            ticket.priority
                                                        )}`}
                                                    >
                                                        {ticket.priority}
                                                    </span>
                                                </td>

                                                <td className="table-body-cell">
                                                    <span
                                                        className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusClass(
                                                            ticket.status
                                                        )}`}
                                                    >
                                                        {ticket.status}
                                                    </span>
                                                </td>

                                                <td className="table-body-cell text-slate-500">
                                                    {getAssignedNames(ticket)}
                                                </td>

                                                <td className="table-body-cell text-slate-500">
                                                    {formatDate(ticket.created_at)}
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td
                                                colSpan={
                                                    user?.role === "administrator" ? 7 : 6
                                                }
                                                className="p-xl text-center text-body-default text-slate-500"
                                            >
                                                tidak ada tiket pada filter ini.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        <div className="flex flex-col gap-md border-t border-border-subtle p-lg md:flex-row md:items-center md:justify-between">
                            <p className="font-caption text-caption text-slate-500">
                                Menampilkan {startRow}-{endRow} dari {filteredTickets.length} tiket
                            </p>

                            <div className="flex flex-wrap items-center gap-sm">
                                <label
                                    htmlFor="dashboard-rows-per-page"
                                    className="font-caption text-caption text-slate-500"
                                >
                                    Rows per page
                                </label>

                                <select
                                    id="dashboard-rows-per-page"
                                    value={rowsPerPage}
                                    onChange={(event) =>
                                        handleRowsPerPageChange(Number(event.target.value))
                                    }
                                    className="rounded-lg border border-slate-300 bg-white px-md py-sm font-label-sm text-label-sm text-slate-700 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                                >
                                    <option value={5}>5</option>
                                    <option value={10}>10</option>
                                    <option value={20}>20</option>
                                    <option value={50}>50</option>
                                </select>

                                <button
                                    type="button"
                                    onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                                    disabled={visibleCurrentPage === 1}
                                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border-subtle text-slate-600 transition hover:bg-surface-container disabled:cursor-not-allowed disabled:opacity-40"
                                    aria-label="Halaman sebelumnya"
                                >
                                    &lt;
                                </button>

                                {visiblePageNumbers.map((pageNumber) => (
                                    <button
                                        key={pageNumber}
                                        type="button"
                                        onClick={() => setCurrentPage(pageNumber)}
                                        className={`inline-flex h-9 w-9 items-center justify-center rounded-lg font-button text-button transition ${visibleCurrentPage === pageNumber
                                            ? "bg-primary text-white"
                                            : "border border-border-subtle text-slate-700 hover:bg-surface-container"
                                            }`}
                                    >
                                        {pageNumber}
                                    </button>
                                ))}

                                <button
                                    type="button"
                                    onClick={() =>
                                        setCurrentPage((page) => Math.min(totalPages, page + 1))
                                    }
                                    disabled={visibleCurrentPage === totalPages}
                                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border-subtle text-slate-600 transition hover:bg-surface-container disabled:cursor-not-allowed disabled:opacity-40"
                                    aria-label="Halaman berikutnya"
                                >
                                    &gt;
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {detailTicketId && (
                <TicketDetailModal
                    ticketId={detailTicketId}
                    user={user}
                    onClose={() => setDetailTicketId(null)}
                    onUnauthorized={clearSessionAndRedirect}
                    onTicketUpdated={handleTicketUpdated}
                />
            )}
        </DashboardLayout>
    );
}
