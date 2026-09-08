"use client";

import Link from "next/link";
import { ChangeEvent, DragEvent, FormEvent, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AccessDenied from "../../components/dashboard/AccessDenied";
import DashboardLayout, {
    UserInfo,
} from "../../components/dashboard/DashboardLayout";
import { apiUrl, canAccessDashboardRoute } from "../../lib/auth";

interface Department {
    id: number;
    name: string;
}

interface TicketFormData {
    subject: string;
    description: string;
    priority: string;
    department: string;
}

export default function CreateTicketPage() {
    const router = useRouter();

    const [user, setUser] = useState<UserInfo | null>(null);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [formData, setFormData] = useState<TicketFormData>({
        subject: "",
        description: "",
        priority: "Low",
        department: "",
    });

    const [attachment, setAttachment] = useState<File | null>(null);
    const [isDraggingAttachment, setIsDraggingAttachment] = useState(false);
    const [isChecking, setIsChecking] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
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

        const loadInitialData = async () => {
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

                const allowedToCreateTicket =
                    canAccessDashboardRoute(currentUser.role, "create");

                if (!allowedToCreateTicket) {
                    return;
                }

                const departmentResponse = await fetch(
                    apiUrl("/api/departments/"),
                    {
                        method: "GET",
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );

                if (departmentResponse.status === 401) {
                    clearSessionAndRedirect();
                    return;
                }

                if (!departmentResponse.ok) {
                    setErrorMsg("gagal mengambil data department.");
                    return;
                }

                const departmentData = await departmentResponse.json();
                const departmentList = Array.isArray(departmentData)
                    ? departmentData
                    : departmentData.results || [];

                setDepartments(departmentList);

                if (departmentList.length > 0) {
                    setFormData((prev) => ({
                        ...prev,
                        department: departmentList[0].id.toString(),
                    }));
                }
            } catch {
                setErrorMsg("gagal terhubung ke server backend.");
            } finally {
                setIsChecking(false);
            }
        };

        loadInitialData();
    }, [clearSessionAndRedirect, router]);

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        const token = localStorage.getItem("access_token");

        if (!token) {
            clearSessionAndRedirect();
            return;
        }

        if (!formData.department) {
            setErrorMsg("department belum tersedia. buat department dulu dari admin.");
            return;
        }

        setErrorMsg("");
        setIsSubmitting(true);

        try {
            const submitData = new FormData();
            submitData.append("subject", formData.subject);
            submitData.append("description", formData.description);
            submitData.append("priority", formData.priority);
            submitData.append("department", formData.department);

            if (attachment) {
                submitData.append("attachment", attachment);
            }

            const response = await fetch(apiUrl("/api/tickets/"), {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                body: submitData,
            });

            if (response.status === 401) {
                clearSessionAndRedirect();
                return;
            }

            if (!response.ok) {
                setErrorMsg("gagal membuat tiket. periksa kembali data yang diisi.");
                return;
            }

            router.push("/dashboard");
        } catch {
            setErrorMsg("gagal terhubung ke server backend.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleAttachmentChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setAttachment(e.target.files[0]);
        } else {
            setAttachment(null);
        }
    };

    const handleAttachmentDrop = (e: DragEvent<HTMLLabelElement>) => {
        e.preventDefault();
        setIsDraggingAttachment(false);

        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            setAttachment(e.dataTransfer.files[0]);
        }
    };

    if (isChecking) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-background font-body-default text-body-default text-on-surface-variant">
                memuat halaman buat tiket...
            </div>
        );
    }

    return (
        <DashboardLayout
            user={user}
            title="Buat Tiket Baru"
            subtitle="Silahkan lengkapi formulir untuk mengirim permintaan bantuan ke tim IT"
        >
            <div className="ticket-create-shell">
                <nav className="mb-md flex items-center gap-xs font-caption text-caption text-on-surface-variant">
                    <Link href="/dashboard" className="transition hover:text-primary">
                        Dashboard
                    </Link>
                    <svg
                        aria-hidden="true"
                        className="h-4 w-4"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                    >
                        <path d="M9 18l6-6-6-6" />
                    </svg>
                    <Link href="/dashboard/create" className="transition hover:text-primary">
                        Tickets
                    </Link>
                    <svg
                        aria-hidden="true"
                        className="h-4 w-4"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                    >
                        <path d="M9 18l6-6-6-6" />
                    </svg>
                    <span className="font-medium text-slate-900">Buat Tiket Baru</span>
                </nav>

                <div className="mb-xl">
                    <h2 className="font-headline-md text-headline-md text-slate-900">
                        Buat Tiket Baru
                    </h2>
                    <p className="mt-xs text-body-default text-on-surface-variant">
                        Lengkapi formulir di bawah untuk mengirim permintaan bantuan
                    </p>
                </div>

                {errorMsg && (
                    <div className="alert-error">
                        {errorMsg}
                    </div>
                )}

                {user && !canAccessDashboardRoute(user.role, "create") ? (
                    <AccessDenied />
                ) : (
                    <div className="card-shell">
                        <div className="card-header bg-surface-container">
                            <h3 className="flex items-center gap-sm font-title-md text-title-md text-slate-900">
                                <svg
                                    aria-hidden="true"
                                    className="h-5 w-5 text-primary"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                >
                                    <path d="M12 20h9" />
                                    <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
                                </svg>
                                Informasi Tiket
                            </h3>
                        </div>

                        <form onSubmit={handleSubmit} className="card-body space-y-lg">
                            <div className="space-y-sm">
                                <label className="form-label">
                                    Subjek Tiket <span className="text-red-600">*</span>
                                </label>

                                <input
                                    type="text"
                                    required
                                    className="form-control"
                                    placeholder="Contoh: Masalah Akses VPN"
                                    value={formData.subject}
                                    onChange={(e) =>
                                        setFormData({ ...formData, subject: e.target.value })
                                    }
                                    disabled={isSubmitting}
                                />
                            </div>

                            <div className="grid grid-cols-1 gap-lg md:grid-cols-2">
                                <div className="space-y-sm">
                                    <label className="form-label">
                                        Departemen <span className="text-red-600">*</span>
                                    </label>

                                    <div className="relative">
                                        <select
                                            required
                                            className="form-control appearance-none pr-12"
                                            value={formData.department}
                                            onChange={(e) =>
                                                setFormData({ ...formData, department: e.target.value })
                                            }
                                            disabled={isSubmitting || departments.length === 0}
                                        >
                                            {departments.length > 0 ? (
                                                departments.map((department) => (
                                                    <option key={department.id} value={department.id}>
                                                        {department.name}
                                                    </option>
                                                ))
                                            ) : (
                                                <option value="">department belum tersedia</option>
                                            )}
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

                                <div className="space-y-sm">
                                    <label className="form-label">
                                        Prioritas <span className="text-red-600">*</span>
                                    </label>

                                    <div className="relative">
                                        <select
                                            className="form-control appearance-none pr-12"
                                            value={formData.priority}
                                            onChange={(e) =>
                                                setFormData({ ...formData, priority: e.target.value })
                                            }
                                            disabled={isSubmitting}
                                        >
                                            <option value="Low">Low</option>
                                            <option value="Medium">Medium</option>
                                            <option value="High">High</option>
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

                            <div className="space-y-sm">
                                <label className="form-label">
                                    Deskripsi Masalah <span className="text-red-600">*</span>
                                </label>

                                <textarea
                                    required
                                    rows={5}
                                    className="form-control resize-none"
                                    placeholder="Jelaskan secara detail masalah atau permintaan Anda..."
                                    value={formData.description}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            description: e.target.value,
                                        })
                                    }
                                    disabled={isSubmitting}
                                />

                                <p className="helper-text">
                                    Sertakan langkah-langkah untuk mereproduksi masalah jika ada.
                                </p>
                            </div>

                            <div className="space-y-sm">
                                <label className="form-label">
                                    Lampiran (Opsional)
                                </label>

                                <label
                                    htmlFor="ticket-attachment"
                                    onDragOver={(e) => {
                                        e.preventDefault();
                                        setIsDraggingAttachment(true);
                                    }}
                                    onDragLeave={() => setIsDraggingAttachment(false)}
                                    onDrop={handleAttachmentDrop}
                                    className={`group flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-xl text-center transition-colors ${isDraggingAttachment
                                        ? "border-primary bg-blue-50"
                                        : "border-slate-300 bg-white hover:bg-surface-container"
                                        } ${isSubmitting ? "pointer-events-none opacity-70" : ""}`}
                                >
                                    <div className="mb-md flex h-12 w-12 items-center justify-center rounded-full bg-surface-container text-on-surface-variant transition-colors group-hover:bg-blue-100 group-hover:text-primary">
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
                                            <path d="M12 16V4" />
                                            <path d="M7 9l5-5 5 5" />
                                            <path d="M20 16.5A4.5 4.5 0 0 1 15.5 21h-7A4.5 4.5 0 0 1 4 16.5" />
                                        </svg>
                                    </div>

                                    <p className="font-semibold text-body-default text-slate-900">
                                        {attachment
                                            ? attachment.name
                                            : "Klik untuk unggah atau seret file ke sini"}
                                    </p>
                                    <p className="mt-xs font-caption text-caption text-on-surface-variant">
                                        PNG, JPG, PDF (Maks. 5MB)
                                    </p>
                                </label>

                                <input
                                    id="ticket-attachment"
                                    type="file"
                                    accept=".png,.jpg,.jpeg,.pdf"
                                    className="hidden"
                                    onChange={handleAttachmentChange}
                                    disabled={isSubmitting}
                                />
                            </div>

                            <div className="mt-xl flex items-center justify-end gap-md border-t border-border-subtle pt-lg">
                                <button
                                    type="button"
                                    onClick={() => router.push("/dashboard")}
                                    disabled={isSubmitting}
                                    className="btn-secondary border-transparent shadow-none hover:bg-surface-container"
                                >
                                    Batal
                                </button>

                                <button
                                    type="submit"
                                    disabled={isSubmitting || departments.length === 0}
                                    className="btn-primary shadow-md active:scale-[0.98]"
                                >
                                    {isSubmitting ? "Mengirim..." : "Simpan Tiket"}
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                <div className="mt-xl flex flex-col items-center justify-between gap-md font-caption text-caption text-slate-400 md:flex-row">
                    <p>Helpdesk internal GUT.</p>
                    <p>Pastikan data tiket sudah benar sebelum dikirim.</p>
                </div>
            </div>
        </DashboardLayout>
    );
}
