"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AccessDenied from "../../components/dashboard/AccessDenied";
import DashboardLayout, {
    UserInfo,
} from "../../components/dashboard/DashboardLayout";
import {
    apiUrl,
    canAccessDashboardRoute,
    clearStoredSession,
    getStoredUser,
} from "../../lib/auth";

interface Department {
    id: number;
    name: string;
}

export default function DepartmentsPage() {
    const router = useRouter();

    const [user, setUser] = useState<UserInfo | null>(null);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [newDepartmentName, setNewDepartmentName] = useState("");
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [editingDepartmentId, setEditingDepartmentId] = useState<number | null>(
        null
    );
    const [editingDepartmentName, setEditingDepartmentName] = useState("");
    const [deletingDepartment, setDeletingDepartment] = useState<Department | null>(
        null
    );
    const [isChecking, setIsChecking] = useState(true);
    const [isLoadingDepartments, setIsLoadingDepartments] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");
    const [successMsg, setSuccessMsg] = useState("");

    useEffect(() => {
        const token = localStorage.getItem("access_token");

        const redirectToLogin = () => {
            clearStoredSession();
            router.push("/login");
        };

        if (!token) {
            router.push("/login");
            return;
        }

        const loadUser = async () => {
            try {
                let currentUser: UserInfo | null = getStoredUser();

                if (!currentUser) {
                    const userResponse = await fetch(apiUrl("/api/user-info/"), {
                        method: "GET",
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    });

                    if (!userResponse.ok) {
                        redirectToLogin();
                        return;
                    }

                    currentUser = await userResponse.json();
                    localStorage.setItem("user", JSON.stringify(currentUser));
                }

                if (!currentUser) {
                    redirectToLogin();
                    return;
                }

                setUser(currentUser);

                if (canAccessDashboardRoute(currentUser.role, "departments")) {
                    setIsLoadingDepartments(true);

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
                        redirectToLogin();
                        return;
                    }

                    if (!departmentResponse.ok) {
                        setErrorMsg("gagal mengambil data department.");
                        return;
                    }

                    const departmentData = await departmentResponse.json();
                    setDepartments(
                        Array.isArray(departmentData)
                            ? departmentData
                            : departmentData.results || []
                    );
                }
            } catch {
                setErrorMsg("gagal terhubung ke server backend.");
            } finally {
                setIsLoadingDepartments(false);
                setIsChecking(false);
            }
        };

        loadUser();
    }, [router]);

    const getTokenOrRedirect = () => {
        const token = localStorage.getItem("access_token");

        if (!token) {
            clearStoredSession();
            router.push("/login");
            return null;
        }

        return token;
    };

    const getErrorMessage = async (response: Response) => {
        const data = await response.json().catch(() => null);

        if (Array.isArray(data?.name)) {
            return data.name[0];
        }

        if (typeof data?.name === "string") {
            return data.name;
        }

        if (typeof data?.detail === "string") {
            return data.detail;
        }

        return "gagal menyimpan department.";
    };

    const openCreateModal = () => {
        setErrorMsg("");
        setSuccessMsg("");
        setIsCreateModalOpen(true);
    };

    const closeCreateModal = () => {
        if (isSaving) return;
        setIsCreateModalOpen(false);
    };

    const handleCreateDepartment = async (
        event: React.FormEvent<HTMLFormElement>
    ) => {
        event.preventDefault();

        const token = getTokenOrRedirect();
        const name = newDepartmentName.trim();

        if (!token) return;

        if (!name) {
            setErrorMsg("nama department wajib diisi.");
            return;
        }

        setErrorMsg("");
        setSuccessMsg("");
        setIsSaving(true);

        try {
            const response = await fetch(apiUrl("/api/departments/"), {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ name }),
            });

            if (response.status === 401) {
                clearStoredSession();
                router.push("/login");
                return;
            }

            if (!response.ok) {
                setErrorMsg(await getErrorMessage(response));
                return;
            }

            const createdDepartment = await response.json();
            setDepartments((prev) => [...prev, createdDepartment]);
            setNewDepartmentName("");
            setIsCreateModalOpen(false);
            setSuccessMsg("department berhasil ditambahkan.");
        } catch {
            setErrorMsg("gagal terhubung ke server backend.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteDepartment = async () => {
        const token = getTokenOrRedirect();

        if (!token || !deletingDepartment) return;

        setErrorMsg("");
        setSuccessMsg("");
        setIsSaving(true);

        try {
            const response = await fetch(
                apiUrl(`/api/departments/${deletingDepartment.id}/`),
                {
                    method: "DELETE",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            if (response.status === 401) {
                clearStoredSession();
                router.push("/login");
                return;
            }

            if (!response.ok) {
                setDeletingDepartment(null);
                setErrorMsg(await getErrorMessage(response));
                return;
            }

            setDepartments((prev) =>
                prev.filter((department) => department.id !== deletingDepartment.id)
            );
            setDeletingDepartment(null);
            setSuccessMsg("department berhasil di-remove.");
        } catch {
            setErrorMsg("gagal terhubung ke server backend.");
        } finally {
            setIsSaving(false);
        }
    };

    const startEditingDepartment = (department: Department) => {
        setEditingDepartmentId(department.id);
        setEditingDepartmentName(department.name);
        setErrorMsg("");
        setSuccessMsg("");
    };

    const cancelEditingDepartment = () => {
        setEditingDepartmentId(null);
        setEditingDepartmentName("");
    };

    const handleUpdateDepartment = async (departmentId: number) => {
        const token = getTokenOrRedirect();
        const name = editingDepartmentName.trim();

        if (!token) return;

        if (!name) {
            setErrorMsg("nama department wajib diisi.");
            return;
        }

        setErrorMsg("");
        setSuccessMsg("");
        setIsSaving(true);

        try {
            const response = await fetch(
                apiUrl(`/api/departments/${departmentId}/`),
                {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({ name }),
                }
            );

            if (response.status === 401) {
                clearStoredSession();
                router.push("/login");
                return;
            }

            if (!response.ok) {
                setErrorMsg(await getErrorMessage(response));
                return;
            }

            const updatedDepartment = await response.json();
            setDepartments((prev) =>
                prev.map((department) =>
                    department.id === updatedDepartment.id
                        ? updatedDepartment
                        : department
                )
            );
            cancelEditingDepartment();
            setSuccessMsg("department berhasil diperbarui.");
        } catch {
            setErrorMsg("gagal terhubung ke server backend.");
        } finally {
            setIsSaving(false);
        }
    };

    if (isChecking) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-background font-body-default text-body-default text-on-surface-variant">
                memuat departments...
            </div>
        );
    }

    return (
        <DashboardLayout
            user={user}
            title="departments"
            subtitle="kelola data department untuk kebutuhan user dan tiket."
        >
            {errorMsg && (
                <div className="alert-error">
                    {errorMsg}
                </div>
            )}

            {successMsg && (
                <div className="alert-success">
                    {successMsg}
                </div>
            )}

            {user && !canAccessDashboardRoute(user.role, "departments") ? (
                <AccessDenied />
            ) : (
                <div className="page-shell">
                    <div className="flex flex-col gap-md lg:flex-row lg:items-end lg:justify-between">
                        <div>
                            <h3 className="font-headline-md text-headline-md text-slate-900">
                                Manajemen Department
                            </h3>

                            <p className="mt-xs text-body-default text-slate-500">
                                Kelola department yang dipakai pada form tiket dan user.
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={openCreateModal}
                            className="btn-primary"
                        >
                            <span className="text-lg leading-none">+</span>
                            Tambah Department Baru
                        </button>
                    </div>

                    <div className="card-shell">
                        <div className="card-header flex items-center justify-between gap-md">
                                <div>
                                    <h3 className="font-title-md text-title-md text-slate-900">
                                        daftar department
                                    </h3>

                                    <p className="mt-xs text-body-default text-slate-500">
                                        total: {departments.length} department
                                    </p>
                                </div>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="table-head-row">
                                            <th className="table-head-cell">
                                                nama department
                                            </th>
                                            <th className="table-head-cell">
                                                action
                                            </th>
                                        </tr>
                                    </thead>

                                    <tbody>
                                        {isLoadingDepartments ? (
                                            <tr>
                                                <td
                                                    colSpan={2}
                                                    className="p-xl text-center text-body-default text-slate-500"
                                                >
                                                    memuat data department...
                                                </td>
                                            </tr>
                                        ) : departments.length > 0 ? (
                                            departments.map((department) => (
                                                <tr
                                                    key={department.id}
                                                    className="border-b border-border-subtle transition hover:bg-surface-container"
                                                >
                                                    <td className="table-body-cell font-medium text-slate-800">
                                                        {editingDepartmentId ===
                                                            department.id ? (
                                                            <input
                                                                type="text"
                                                                className="form-control max-w-md"
                                                                value={editingDepartmentName}
                                                                onChange={(event) =>
                                                                    setEditingDepartmentName(
                                                                        event.target.value
                                                                    )
                                                                }
                                                                disabled={isSaving}
                                                            />
                                                        ) : (
                                                            department.name
                                                        )}
                                                    </td>

                                                    <td className="table-body-cell">
                                                        {editingDepartmentId ===
                                                            department.id ? (
                                                            <div className="flex flex-wrap items-center gap-sm">
                                                                <button
                                                                    type="button"
                                                                    onClick={() =>
                                                                        handleUpdateDepartment(
                                                                            department.id
                                                                        )
                                                                    }
                                                                    disabled={isSaving}
                                                                    className="btn-success btn-sm"
                                                                >
                                                                    simpan
                                                                </button>

                                                                <button
                                                                    type="button"
                                                                    onClick={
                                                                        cancelEditingDepartment
                                                                    }
                                                                    disabled={isSaving}
                                                                    className="btn-secondary btn-sm"
                                                                >
                                                                    batal
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <div className="flex flex-wrap items-center gap-sm">
                                                                <button
                                                                    type="button"
                                                                    onClick={() =>
                                                                        startEditingDepartment(
                                                                            department
                                                                        )
                                                                    }
                                                                    className="btn-secondary btn-sm"
                                                                >
                                                                    edit
                                                                </button>

                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        setErrorMsg("");
                                                                        setSuccessMsg("");
                                                                        setDeletingDepartment(
                                                                            department
                                                                        );
                                                                    }}
                                                                    className="btn-secondary btn-sm text-red-600 hover:border-red-200 hover:bg-red-50"
                                                                >
                                                                    remove
                                                                </button>
                                                            </div>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td
                                                    colSpan={2}
                                                    className="p-xl text-center text-body-default text-slate-500"
                                                >
                                                    belum ada department.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                    </div>
                </div>
            )}

            {isCreateModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-4">
                    <div className="card-shell w-full max-w-md">
                        <div className="card-header flex items-center justify-between gap-md">
                            <h3 className="font-headline-sm text-headline-sm text-slate-900">
                                Tambah Department Baru
                            </h3>

                            <button
                                type="button"
                                onClick={closeCreateModal}
                                className="h-9 w-9 rounded-full text-on-surface-variant transition hover:bg-surface-container"
                            >
                                x
                            </button>
                        </div>

                        <form
                            onSubmit={handleCreateDepartment}
                            className="card-body space-y-lg"
                        >
                            <div>
                                <label className="form-label">
                                    Nama Department
                                </label>

                                <input
                                    type="text"
                                    className="form-control"
                                    placeholder="contoh: finance"
                                    value={newDepartmentName}
                                    onChange={(event) =>
                                        setNewDepartmentName(event.target.value)
                                    }
                                    disabled={isSaving}
                                />
                            </div>

                            <div className="flex gap-md pt-sm">
                                <button
                                    type="button"
                                    onClick={closeCreateModal}
                                    disabled={isSaving}
                                    className="btn-secondary flex-1"
                                >
                                    Batal
                                </button>

                                <button
                                    type="submit"
                                    disabled={isSaving}
                                    className="btn-primary flex-1"
                                >
                                    {isSaving ? "menyimpan..." : "Simpan"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {deletingDepartment && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-4">
                    <div className="modal-card max-w-md">
                        <h3 className="mb-sm font-headline-sm text-headline-sm text-slate-900">
                            Remove Department
                        </h3>

                        <p className="mb-lg text-body-default text-on-surface-variant">
                            Remove department {deletingDepartment.name}? Department
                            hanya bisa di-remove jika belum dipakai user aktif atau
                            tiket.
                        </p>

                        <div className="flex justify-end gap-md pt-sm">
                            <button
                                type="button"
                                onClick={() => setDeletingDepartment(null)}
                                disabled={isSaving}
                                className="btn-secondary"
                            >
                                cancel
                            </button>

                            <button
                                type="button"
                                onClick={handleDeleteDepartment}
                                disabled={isSaving}
                                className="btn-primary bg-red-600 hover:bg-red-700"
                            >
                                {isSaving ? "remove..." : "remove"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
}
