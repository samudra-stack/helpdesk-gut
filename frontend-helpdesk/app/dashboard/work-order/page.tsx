"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import AccessDenied from "../../components/dashboard/AccessDenied";
import DashboardLayout, {
    UserInfo,
} from "../../components/dashboard/DashboardLayout";
import TicketDetailModal, {
    TicketDetail,
} from "../../components/dashboard/TicketDetailModal";
import { apiUrl, canAccessDashboardRoute } from "../../lib/auth";

type StatusFilter =
    | "all"
    | "new"
    | "assigned"
    | "in progress"
    | "resolved"
    | "closed";

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

function hasAssignedEngineer(ticket: Ticket) {
    return Boolean(
        (ticket.assigned_engineers && ticket.assigned_engineers.length > 0) ||
        (
            ticket.assigned_engineer_usernames &&
            ticket.assigned_engineer_usernames.length > 0
        )
    );
}

function getEngineerNamesByIds(engineers: Engineer[], engineerIds: string[]) {
    return engineers
        .filter((engineer) => engineerIds.includes(engineer.id.toString()))
        .map((engineer) => engineer.username)
        .join(", ");
}

export default function WorkOrderPage() {
    const router = useRouter();

    const [user, setUser] = useState<UserInfo | null>(null);
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [engineers, setEngineers] = useState<Engineer[]>([]);
    const [selectedStatus, setSelectedStatus] = useState<StatusFilter>("all");
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [rowsPerPage, setRowsPerPage] = useState(5);
    const [currentPage, setCurrentPage] = useState(1);
    const [detailTicketId, setDetailTicketId] = useState<number | null>(null);
    const [assigningTicketId, setAssigningTicketId] = useState<number | null>(
        null
    );
    const [assignModalTicket, setAssignModalTicket] = useState<Ticket | null>(null);
    const [selectedEngineerIds, setSelectedEngineerIds] = useState<string[]>([]);
    const [assignModalError, setAssignModalError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");
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

        const loadData = async () => {
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

                if (!canAccessDashboardRoute(currentUser.role, "workOrder")) {
                    return;
                }

                const ticketResponse = await fetch(apiUrl("/api/tickets/"), {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                if (ticketResponse.status === 401) {
                    clearSessionAndRedirect();
                    return;
                }

                if (!ticketResponse.ok) {
                    setErrorMsg("gagal mengambil data work order.");
                    return;
                }

                const ticketData = await ticketResponse.json();

                if (Array.isArray(ticketData)) {
                    setTickets(ticketData);
                } else {
                    setTickets(ticketData.results || []);
                }

                const engineerResponse = await fetch(
                    apiUrl("/api/it-staff-users/"),
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );

                if (engineerResponse.ok) {
                    const engineerData = await engineerResponse.json();
                    setEngineers(Array.isArray(engineerData) ? engineerData : []);
                }
            } catch {
                setErrorMsg("gagal terhubung ke server backend.");
            } finally {
                setIsChecking(false);
            }
        };

        loadData();
    }, [clearSessionAndRedirect, router]);

    useEffect(() => {
        if (!successMessage) return;

        const timer = window.setTimeout(() => {
            setSuccessMessage("");
        }, 2200);

        return () => window.clearTimeout(timer);
    }, [successMessage]);

    const filteredTickets = useMemo(() => {
        const ticketsByStatus = selectedStatus === "all"
            ? tickets
            : tickets.filter(
                (ticket) => ticket.status.toLowerCase() === selectedStatus
            );

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
    }, [tickets, selectedStatus, searchQuery]);

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

    const statusMenus = [
        {
            key: "all" as StatusFilter,
            label: "all",
            count: tickets.length,
        },
        {
            key: "new" as StatusFilter,
            label: "new",
            count: tickets.filter((ticket) => ticket.status.toLowerCase() === "new")
                .length,
        },
        {
            key: "assigned" as StatusFilter,
            label: "assigned",
            count: tickets.filter(
                (ticket) => ticket.status.toLowerCase() === "assigned"
            ).length,
        },
        {
            key: "in progress" as StatusFilter,
            label: "in progress",
            count: tickets.filter(
                (ticket) => ticket.status.toLowerCase() === "in progress"
            ).length,
        },
        {
            key: "resolved" as StatusFilter,
            label: "resolved",
            count: tickets.filter(
                (ticket) => ticket.status.toLowerCase() === "resolved"
            ).length,
        },
        {
            key: "closed" as StatusFilter,
            label: "closed",
            count: tickets.filter(
                (ticket) => ticket.status.toLowerCase() === "closed"
            ).length,
        },
    ];

    const toggleEngineerSelection = (engineerId: string) => {
        setSelectedEngineerIds((prev) =>
            prev.includes(engineerId)
                ? prev.filter((id) => id !== engineerId)
                : [...prev, engineerId]
        );
    };

    const openAssignModal = (ticket: Ticket) => {
        if (hasAssignedEngineer(ticket)) {
            setErrorMsg("tiket yang sudah assigned tidak bisa diubah.");
            return;
        }

        setErrorMsg("");
        setAssignModalError("");
        setSelectedEngineerIds([]);
        setAssignModalTicket(ticket);
    };

    const closeAssignModal = () => {
        if (assigningTicketId) return;

        setAssignModalTicket(null);
        setSelectedEngineerIds([]);
        setAssignModalError("");
    };

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

    const handleTicketUpdated = (updatedTicket: TicketDetail) => {
        setTickets((prevTickets) =>
            prevTickets.map((ticket) =>
                ticket.id === updatedTicket.id ? updatedTicket : ticket
            )
        );
    };

    const toggleSearch = () => {
        if (isSearchOpen) {
            setSearchQuery("");
            setCurrentPage(1);
        }

        setIsSearchOpen((prev) => !prev);
    };

    const confirmAssignEngineer = async () => {
        const token = localStorage.getItem("access_token");

        if (!token) {
            clearSessionAndRedirect();
            return;
        }

        if (!assignModalTicket) return;

        if (selectedEngineerIds.length === 0) {
            setAssignModalError("pilih minimal satu engineer terlebih dahulu.");
            return;
        }

        const assignmentTicket = assignModalTicket;

        setAssigningTicketId(assignmentTicket.id);
        setErrorMsg("");
        setAssignModalError("");

        try {
            const response = await fetch(
                apiUrl(`/api/tickets/${assignmentTicket.id}/assign/`),
                {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        assigned_engineers: selectedEngineerIds.map(Number),
                    }),
                }
            );

            if (response.status === 401) {
                clearSessionAndRedirect();
                return;
            }

            if (!response.ok) {
                setAssignModalError(
                    "gagal assign engineer. tiket yang sudah assigned tidak bisa diubah."
                );
                return;
            }

            const updatedTicket = await response.json();

            setTickets((prevTickets) =>
                prevTickets.map((ticket) =>
                    ticket.id === updatedTicket.id ? updatedTicket : ticket
                )
            );

            setAssignModalTicket(null);
            setSelectedEngineerIds([]);
            setSuccessMessage(
                `Perubahan engineer untuk tiket ${updatedTicket.ticket_code} sudah dilakukan.`
            );
        } catch {
            setAssignModalError("gagal terhubung ke server backend.");
        } finally {
            setAssigningTicketId(null);
        }
    };

    if (isChecking) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-background font-body-default text-body-default text-on-surface-variant">
                memuat work order...
            </div>
        );
    }

    return (
        <DashboardLayout
            user={user}
            title="Work Order List"
            subtitle="daftar tiket dan assignment engineer"
        >
            {errorMsg && (
                <div className="alert-error">
                    {errorMsg}
                </div>
            )}

            {user && !canAccessDashboardRoute(user.role, "workOrder") ? (
                <AccessDenied />
            ) : (
                <div className="card-shell w-full max-w-7xl">
                    <div className="card-header">
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
                                <label htmlFor="work-order-status-filter" className="sr-only">
                                    Filter status work order
                                </label>

                                <select
                                    id="work-order-status-filter"
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
                                    <th className="table-head-cell text-lg">Id Tiket</th>
                                    <th className="table-head-cell text-lg">Subjek</th>
                                    <th className="table-head-cell text-lg">Requester</th>
                                    <th className="table-head-cell text-lg">Prioritas</th>
                                    <th className="table-head-cell text-lg">Status</th>
                                    <th className="table-head-cell text-lg">Engineer</th>
                                    <th className="table-head-cell text-lg">Tanggal Dibuat</th>
                                    <th className="table-head-cell text-lg">Action</th>
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

                                            <td className="table-body-cell font-medium text-slate-800">
                                                {ticket.subject}
                                            </td>

                                            <td className="table-body-cell text-on-surface-variant">
                                                {ticket.created_by_username || "-"}
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

                                            <td className="table-body-cell text-on-surface-variant">
                                                {getAssignedNames(ticket)}
                                            </td>

                                            <td className="table-body-cell text-slate-500">
                                                {formatDate(ticket.created_at)}
                                            </td>

                                            <td className="table-body-cell">
                                                <button
                                                    type="button"
                                                    onClick={() => openAssignModal(ticket)}
                                                    disabled={
                                                        assigningTicketId === ticket.id ||
                                                        hasAssignedEngineer(ticket)
                                                    }
                                                    className="btn-primary btn-sm whitespace-nowrap disabled:bg-blue-300"
                                                >
                                                    {hasAssignedEngineer(ticket)
                                                        ? "Assigned"
                                                        : assigningTicketId === ticket.id
                                                            ? "Assigning..."
                                                            : "Assign"}
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={8} className="p-xl text-center text-body-default text-slate-500">
                                            tidak ada work order pada filter ini.
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
                                htmlFor="work-order-rows-per-page"
                                className="font-caption text-caption text-slate-500"
                            >
                                Rows per page
                            </label>

                            <select
                                id="work-order-rows-per-page"
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
            )}

            {assignModalTicket && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 px-4">
                    <div
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="assign-confirm-title"
                        className="modal-card max-w-lg"
                    >
                        <h3
                            id="assign-confirm-title"
                            className="mb-sm font-headline-sm text-headline-sm text-slate-900"
                        >
                            Assign Engineer
                        </h3>

                        <p className="text-body-default text-on-surface-variant">
                            Pilih satu atau lebih profil IT untuk tiket{" "}
                            <span className="font-semibold text-slate-800">
                                {assignModalTicket.ticket_code}
                            </span>
                            .
                        </p>

                        <div className="mt-lg space-y-sm">
                            {engineers.length > 0 ? (
                                engineers.map((engineer) => {
                                    const engineerId = engineer.id.toString();
                                    const selected = selectedEngineerIds.includes(engineerId);

                                    return (
                                        <label
                                            key={engineer.id}
                                            className={`flex cursor-pointer items-center gap-md rounded-xl border p-md transition ${selected
                                                ? "border-primary bg-blue-50"
                                                : "border-border-subtle bg-white hover:bg-surface-container"
                                                }`}
                                        >
                                            <input
                                                type="checkbox"
                                                className="h-4 w-4 rounded border-gray-300 text-blue-600"
                                                checked={selected}
                                                disabled={assigningTicketId === assignModalTicket.id}
                                                onChange={() => toggleEngineerSelection(engineerId)}
                                            />

                                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 font-label-md text-label-md text-primary">
                                                {engineer.username.charAt(0).toUpperCase()}
                                            </div>

                                            <div className="min-w-0">
                                                <p className="truncate font-label-md text-label-md text-slate-900">
                                                    {engineer.username}
                                                </p>
                                                <p className="truncate font-caption text-caption text-slate-500">
                                                    {engineer.email || "IT Staff"}
                                                </p>
                                            </div>
                                        </label>
                                    );
                                })
                            ) : (
                                <div className="rounded-xl border border-border-subtle bg-surface-container p-md text-body-default text-slate-500">
                                    data engineer IT belum tersedia.
                                </div>
                            )}
                        </div>

                        {selectedEngineerIds.length > 0 && (
                            <p className="mt-md rounded-lg bg-surface-container p-md font-caption text-caption text-on-surface-variant">
                                Dipilih:{" "}
                                <span className="font-semibold text-slate-800">
                                    {getEngineerNamesByIds(engineers, selectedEngineerIds)}
                                </span>
                            </p>
                        )}

                        {assignModalError && (
                            <div className="mt-md rounded-lg bg-red-50 px-md py-sm text-body-default text-red-700">
                                {assignModalError}
                            </div>
                        )}

                        <div className="mt-lg flex items-center justify-end gap-md">
                            <button
                                type="button"
                                onClick={closeAssignModal}
                                disabled={assigningTicketId === assignModalTicket.id}
                                className="btn-secondary"
                            >
                                Cancel
                            </button>

                            <button
                                type="button"
                                onClick={confirmAssignEngineer}
                                disabled={
                                    assigningTicketId === assignModalTicket.id ||
                                    engineers.length === 0
                                }
                                className="btn-primary"
                            >
                                {assigningTicketId === assignModalTicket.id
                                    ? "Menyimpan..."
                                    : "Konfirmasi"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {successMessage && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/35 px-4">
                    <div className="modal-card max-w-sm text-center">
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-700">
                            <svg
                                aria-hidden="true"
                                className="h-6 w-6"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <path d="M20 6 9 17l-5-5" />
                            </svg>
                        </div>

                        <h3 className="mt-md font-title-md text-title-md text-slate-900">
                            Perubahan berhasil
                        </h3>

                        <p className="mt-xs text-body-default text-on-surface-variant">
                            {successMessage}
                        </p>
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
