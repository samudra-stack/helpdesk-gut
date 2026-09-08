"use client";

import { FormEvent, useEffect, useState } from "react";
import { UserInfo } from "./DashboardLayout";
import { apiUrl } from "../../lib/auth";

export interface TicketDetail {
    id: number;
    ticket_code: string;
    subject: string;
    description: string;
    priority: string;
    status: string;
    created_at: string;
    attachment: string | null;
    handling_note: string | null;
    created_by_username?: string;
    assigned_engineers?: Engineer[];
    assigned_engineer_usernames?: string[];
}

interface Engineer {
    id: number;
    username: string;
    email: string;
}

interface TicketDetailModalProps {
    ticketId: number | string | null;
    user: UserInfo | null;
    onClose: () => void;
    onUnauthorized: () => void;
    onTicketUpdated?: (ticket: TicketDetail) => void;
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

function getAttachmentUrl(attachment: string) {
    if (attachment.startsWith("http")) return attachment;
    return apiUrl(attachment);
}

function getAssignedNames(ticket: TicketDetail) {
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

    return "";
}

function isFinishedStatus(value: string) {
    const normalizedStatus = value.toLowerCase();
    return normalizedStatus === "resolved" || normalizedStatus === "closed";
}

function isClosedStatus(value: string) {
    return value.toLowerCase() === "closed";
}

export default function TicketDetailModal({
    ticketId,
    user,
    onClose,
    onUnauthorized,
    onTicketUpdated,
}: TicketDetailModalProps) {
    const [ticket, setTicket] = useState<TicketDetail | null>(null);
    const [status, setStatus] = useState("");
    const [handlingNote, setHandlingNote] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [isSuccessOpen, setIsSuccessOpen] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");

    useEffect(() => {
        if (!ticketId) return;

        const token = localStorage.getItem("access_token");

        if (!token) {
            onUnauthorized();
            return;
        }

        const loadTicketDetail = async () => {
            setIsLoading(true);
            setErrorMsg("");

            try {
                const response = await fetch(apiUrl(`/api/tickets/${ticketId}/`), {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                if (response.status === 401) {
                    onUnauthorized();
                    return;
                }

                if (!response.ok) {
                    setErrorMsg("tiket tidak ditemukan atau tidak bisa diakses.");
                    setTicket(null);
                    return;
                }

                const ticketData = await response.json();

                setTicket(ticketData);
                setStatus(ticketData.status);
                setHandlingNote(ticketData.handling_note || "");
            } catch {
                setErrorMsg("gagal terhubung ke server backend.");
            } finally {
                setIsLoading(false);
            }
        };

        loadTicketDetail();
    }, [onUnauthorized, ticketId]);

    const canUpdateStatus = Boolean(
        ticket &&
        !isClosedStatus(ticket.status) &&
        (user?.role === "it_staff" || user?.role === "administrator")
    );

    const handleUpdateStatus = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        setErrorMsg("");

        if (!ticket || isClosedStatus(ticket.status)) {
            setErrorMsg("tiket sudah closed dan hanya bisa dilihat.");
            return;
        }

        if (isFinishedStatus(status) && !handlingNote.trim()) {
            setErrorMsg("catatan penanganan wajib diisi sebelum menyelesaikan tiket.");
            return;
        }

        setIsConfirmOpen(true);
    };

    const confirmUpdateStatus = async () => {
        const token = localStorage.getItem("access_token");

        if (!token) {
            onUnauthorized();
            return;
        }

        if (!ticket || isClosedStatus(ticket.status)) {
            setErrorMsg("tiket sudah closed dan hanya bisa dilihat.");
            setIsConfirmOpen(false);
            return;
        }

        setErrorMsg("");
        setIsConfirmOpen(false);
        setIsSubmitting(true);

        try {
            const response = await fetch(apiUrl(`/api/tickets/${ticket.id}/`), {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    status,
                    handling_note: handlingNote,
                }),
            });

            if (response.status === 401) {
                onUnauthorized();
                return;
            }

            if (!response.ok) {
                const errorData = await response.json().catch(() => null);
                setErrorMsg(
                    errorData?.handling_note?.[0] ||
                    errorData?.detail ||
                    "gagal mengubah status tiket."
                );
                return;
            }

            const updatedTicket = await response.json();

            setTicket(updatedTicket);
            setStatus(updatedTicket.status);
            setHandlingNote(updatedTicket.handling_note || "");
            onTicketUpdated?.(updatedTicket);
            setIsSuccessOpen(true);
        } catch {
            setErrorMsg("gagal terhubung ke server backend.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-4 py-6">
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="ticket-detail-modal-title"
                className="flex max-h-[90vh] w-full max-w-6xl flex-col overflow-hidden rounded-xl border border-border-subtle bg-white shadow-2xl animate-popup"
            >
                <div className="flex items-start justify-between gap-md border-b border-border-subtle px-lg py-md">
                    <div className="min-w-0">
                        <h3
                            id="ticket-detail-modal-title"
                            className="font-title-md text-title-md text-slate-900"
                        >
                            detail tiket
                        </h3>
                        <p className="mt-xs text-caption text-slate-500">
                            informasi lengkap dan status penanganan tiket
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-500 transition hover:bg-surface-container hover:text-slate-800"
                        aria-label="Tutup detail tiket"
                    >
                        x
                    </button>
                </div>

                <div className="overflow-y-auto p-lg">
                    {errorMsg && (
                        <div className="alert-error">
                            {errorMsg}
                        </div>
                    )}

                    {isLoading ? (
                        <div className="py-2xl text-center text-body-default text-slate-500">
                            memuat detail tiket...
                        </div>
                    ) : !ticket ? (
                        <div className="py-2xl text-center">
                            <h4 className="font-title-md text-title-md text-slate-900">
                                tiket tidak tersedia
                            </h4>
                            <p className="mt-sm text-body-default text-slate-500">
                                data tiket tidak ditemukan atau akses role saat ini tidak sesuai.
                            </p>
                            <button
                                type="button"
                                onClick={onClose}
                                className="btn-primary mt-lg"
                            >
                                kembali
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-lg lg:grid-cols-12">
                            <div className="lg:col-span-8">
                                <div className="space-y-lg">
                                    <div>
                                        <div className="mb-sm flex flex-wrap items-center gap-sm">
                                            <span className="font-label-md text-label-md text-primary">
                                                {ticket.ticket_code}
                                            </span>

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

                                        <h4 className="font-headline-md text-headline-md text-slate-900">
                                            {ticket.subject}
                                        </h4>

                                        <p className="mt-sm text-body-default text-slate-500">
                                            dibuat pada {formatDate(ticket.created_at)}
                                        </p>
                                    </div>

                                    <div>
                                        <h5 className="mb-sm font-label-sm text-label-sm uppercase text-slate-500">
                                            deskripsi kendala
                                        </h5>

                                        <div className="rounded-xl border border-border-subtle bg-surface-container p-md text-body-default text-on-surface-variant whitespace-pre-wrap">
                                            {ticket.description}
                                        </div>
                                    </div>

                                    {ticket.attachment && (
                                        <div>
                                            <h5 className="mb-sm font-label-sm text-label-sm uppercase text-slate-500">
                                                lampiran
                                            </h5>

                                            <a
                                                href={getAttachmentUrl(ticket.attachment)}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-sm rounded-lg border border-blue-100 bg-blue-50 px-md py-3 font-button text-button text-blue-700 transition hover:bg-blue-100"
                                            >
                                                lihat lampiran
                                            </a>
                                        </div>
                                    )}

                                    {(ticket.handling_note || canUpdateStatus || isClosedStatus(ticket.status)) && (
                                        <div>
                                            <h5 className="mb-sm font-label-sm text-label-sm uppercase text-slate-500">
                                                catatan penanganan teknisi
                                            </h5>

                                            <div className="space-y-md rounded-xl border border-border-subtle bg-surface-container p-md">
                                                <div className="flex flex-wrap items-center gap-sm">
                                                    <span className="text-body-default text-slate-500">
                                                        status terakhir
                                                    </span>

                                                    <span
                                                        className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusClass(
                                                            ticket.status
                                                        )}`}
                                                    >
                                                        {ticket.status}
                                                    </span>
                                                </div>

                                                {getAssignedNames(ticket) && (
                                                    <p className="text-body-default text-slate-500">
                                                        engineer:{" "}
                                                        <span className="font-semibold text-slate-700">
                                                            {getAssignedNames(ticket)}
                                                        </span>
                                                    </p>
                                                )}

                                                <div>
                                                    <p className="mb-sm text-body-default text-slate-500">
                                                        catatan penanganan
                                                    </p>

                                                    <div className="rounded-lg border border-border-subtle bg-white p-md text-body-default text-on-surface-variant whitespace-pre-wrap">
                                                        {ticket.handling_note ||
                                                            "belum ada catatan penanganan."}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="lg:col-span-4">
                                <div className="rounded-xl border border-border-subtle bg-white">
                                    <div className="border-b border-border-subtle p-lg">
                                        <h4 className="font-title-md text-title-md text-slate-900">
                                            status penanganan
                                        </h4>

                                        <p className="mt-xs text-body-default text-slate-500">
                                            update progress tiket berdasarkan kondisi pekerjaan.
                                        </p>
                                    </div>

                                    <div className="p-lg">
                                        <div className="mb-lg">
                                            <p className="mb-sm text-body-default text-slate-500">
                                                status saat ini
                                            </p>

                                            <span
                                                className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusClass(
                                                    ticket.status
                                                )}`}
                                            >
                                                {ticket.status}
                                            </span>
                                        </div>

                                        {canUpdateStatus ? (
                                            <form onSubmit={handleUpdateStatus} className="space-y-lg">
                                                <div>
                                                    <label className="form-label">
                                                        ubah status
                                                    </label>

                                                    <select
                                                        className="form-control"
                                                        value={status}
                                                        onChange={(event) => setStatus(event.target.value)}
                                                        disabled={isSubmitting}
                                                    >
                                                        <option value="New">new</option>
                                                        <option value="Assigned">assigned</option>
                                                        <option value="In Progress">in progress</option>
                                                        <option value="Resolved">resolved</option>
                                                        <option value="Closed">closed</option>
                                                    </select>
                                                </div>

                                                <div>
                                                    <label className="form-label">
                                                        catatan penanganan
                                                    </label>

                                                    <textarea
                                                        rows={5}
                                                        className="form-control resize-y"
                                                        placeholder="contoh: sudah dilakukan install ulang driver printer dan test print berhasil."
                                                        value={handlingNote}
                                                        onChange={(event) => setHandlingNote(event.target.value)}
                                                        disabled={isSubmitting}
                                                    />

                                                    <p className="helper-text">
                                                        wajib diisi sebelum status diubah menjadi resolved
                                                        atau closed.
                                                    </p>
                                                </div>

                                                <button
                                                    type="submit"
                                                    disabled={isSubmitting}
                                                    className="btn-success w-full"
                                                >
                                                    {isSubmitting ? "menyimpan..." : "simpan perubahan"}
                                                </button>
                                            </form>
                                        ) : (
                                            <div className="rounded-xl border border-border-subtle bg-surface-container p-md text-body-default text-slate-500">
                                                {isClosedStatus(ticket.status)
                                                    ? "tiket sudah closed dan hanya bisa dilihat."
                                                    : "role ini hanya dapat melihat status tiket. perubahan status dilakukan oleh it staff atau administrator."}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {isConfirmOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/55 px-4">
                    <div
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="confirm-update-title"
                        className="modal-card max-w-md"
                    >
                        <h3
                            id="confirm-update-title"
                            className="mb-sm text-center font-headline-sm text-headline-sm text-slate-900"
                        >
                            Are you sure?
                        </h3>

                        <p className="text-center text-body-default text-on-surface-variant">
                            perubahan akan disimpan.
                        </p>

                        <div className="mt-lg flex items-center justify-center gap-md">
                            <button
                                type="button"
                                onClick={() => setIsConfirmOpen(false)}
                                disabled={isSubmitting}
                                className="btn-secondary"
                            >
                                cancel
                            </button>

                            <button
                                type="button"
                                onClick={confirmUpdateStatus}
                                disabled={isSubmitting}
                                className="btn-primary"
                            >
                                ok
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {isSuccessOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/55 px-4">
                    <div
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="success-update-title"
                        className="modal-card max-w-md text-center"
                    >
                        <div className="mx-auto mb-lg flex h-14 w-14 items-center justify-center rounded-full border border-green-100 bg-green-50 text-green-600">
                            <span className="font-title-md text-title-md leading-none">OK</span>
                        </div>

                        <h3
                            id="success-update-title"
                            className="mb-sm font-headline-sm text-headline-sm text-slate-900"
                        >
                            Sukses!
                        </h3>

                        <p className="text-body-default text-on-surface-variant">
                            Perubahan Berhasil Disimpan.
                        </p>

                        <button
                            type="button"
                            onClick={() => setIsSuccessOpen(false)}
                            className="btn-primary mt-lg"
                        >
                            OK
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
