"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import AccessDenied from "../../components/dashboard/AccessDenied";
import DashboardLayout, {
    UserInfo,
    UserRole,
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

interface ManagedUser {
    id: number;
    username: string;
    email: string;
    role: UserRole;
    department: number | null;
    department_name: string;
    must_change_password: boolean;
}

interface UserFormData {
    username: string;
    password: string;
    role: UserRole;
    department: string;
}

interface ResetModalState {
    userId: number;
    username: string;
    password: string;
    confirmPassword: string;
}

interface RemoveModalState {
    userId: number;
    username: string;
}

interface FeedbackModalState {
    title: string;
    message: string;
}

type UserFilter =
    | "all"
    | "administrator"
    | "it_staff"
    | "requester"
    | "must_change_password"
    | "password_ok";

function getRoleBadgeClass(role: UserRole) {
    if (role === "administrator") return "bg-blue-50 text-blue-700";
    if (role === "it_staff") return "bg-purple-50 text-purple-700";
    return "bg-slate-100 text-slate-600";
}

function getRoleLabel(role: UserRole) {
    if (role === "administrator") return "Administrator";
    if (role === "it_staff") return "IT_staff";
    return "Requester";
}

export default function UserManagementPage() {
    const router = useRouter();

    const [user, setUser] = useState<UserInfo | null>(null);
    const [users, setUsers] = useState<ManagedUser[]>([]);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [selectedUserFilter, setSelectedUserFilter] = useState<UserFilter>("all");
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [rowsPerPage, setRowsPerPage] = useState(5);
    const [currentPage, setCurrentPage] = useState(1);
    const [formData, setFormData] = useState<UserFormData>({
        username: "",
        password: "",
        role: "requester",
        department: "",
    });
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [resetModal, setResetModal] = useState<ResetModalState | null>(null);
    const [removeModal, setRemoveModal] = useState<RemoveModalState | null>(null);
    const [feedbackModal, setFeedbackModal] = useState<FeedbackModalState | null>(
        null
    );
    const [isChecking, setIsChecking] = useState(true);
    const [isLoadingData, setIsLoadingData] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [removingUserId, setRemovingUserId] = useState<number | null>(null);
    const [errorMsg, setErrorMsg] = useState("");

    const stats = useMemo(() => {
        return {
            total: users.length,
            administrators: users.filter((item) => item.role === "administrator")
                .length,
            itStaff: users.filter((item) => item.role === "it_staff").length,
            pendingPassword: users.filter((item) => item.must_change_password)
                .length,
        };
    }, [users]);

    const filteredUsers = useMemo(() => {
        const usersByFilter = users.filter((item) => {
            if (selectedUserFilter === "all") return true;
            if (selectedUserFilter === "must_change_password") {
                return item.must_change_password;
            }
            if (selectedUserFilter === "password_ok") {
                return !item.must_change_password;
            }

            return item.role === selectedUserFilter;
        });

        const keyword = searchQuery.trim().toLowerCase();

        if (!keyword) return usersByFilter;

        return usersByFilter.filter((item) => {
            const searchableText = [
                item.username,
                item.email,
                item.role,
                item.department_name,
                item.must_change_password ? "wajib ganti" : "sudah diganti",
            ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase();

            return searchableText.includes(keyword);
        });
    }, [searchQuery, selectedUserFilter, users]);

    const totalPages = Math.max(1, Math.ceil(filteredUsers.length / rowsPerPage));
    const visibleCurrentPage = Math.min(currentPage, totalPages);
    const startRow = filteredUsers.length === 0
        ? 0
        : (visibleCurrentPage - 1) * rowsPerPage + 1;
    const endRow = Math.min(visibleCurrentPage * rowsPerPage, filteredUsers.length);

    const paginatedUsers = useMemo(() => {
        const startIndex = (visibleCurrentPage - 1) * rowsPerPage;
        return filteredUsers.slice(startIndex, startIndex + rowsPerPage);
    }, [filteredUsers, rowsPerPage, visibleCurrentPage]);

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

    const userFilterMenus = [
        {
            key: "all" as UserFilter,
            label: "all",
            count: users.length,
        },
        {
            key: "administrator" as UserFilter,
            label: "administrator",
            count: stats.administrators,
        },
        {
            key: "it_staff" as UserFilter,
            label: "it staff",
            count: stats.itStaff,
        },
        {
            key: "requester" as UserFilter,
            label: "requester",
            count: users.filter((item) => item.role === "requester").length,
        },
        {
            key: "must_change_password" as UserFilter,
            label: "wajib ganti",
            count: stats.pendingPassword,
        },
        {
            key: "password_ok" as UserFilter,
            label: "sudah diganti",
            count: users.filter((item) => !item.must_change_password).length,
        },
    ];

    const redirectToLogin = useCallback(() => {
        clearStoredSession();
        router.push("/login");
    }, [router]);

    const getTokenOrRedirect = () => {
        const token = localStorage.getItem("access_token");

        if (!token) {
            redirectToLogin();
            return null;
        }

        return token;
    };

    const getErrorMessage = async (response: Response) => {
        const data = await response.json().catch(() => null);

        if (Array.isArray(data?.username)) return data.username[0];
        if (Array.isArray(data?.password)) return data.password[0];
        if (Array.isArray(data?.department)) return data.department[0];
        if (Array.isArray(data?.confirm_password)) return data.confirm_password[0];
        if (Array.isArray(data?.non_field_errors)) return data.non_field_errors[0];
        if (typeof data?.detail === "string") return data.detail;

        return "gagal menyimpan data user.";
    };

    useEffect(() => {
        const token = localStorage.getItem("access_token");

        if (!token) {
            router.push("/login");
            return;
        }

        const loadData = async () => {
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

                if (!canAccessDashboardRoute(currentUser.role, "userManagement")) {
                    return;
                }

                setIsLoadingData(true);

                const [usersResponse, departmentsResponse] = await Promise.all([
                    fetch(apiUrl("/api/users/"), {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }),
                    fetch(apiUrl("/api/departments/"), {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }),
                ]);

                if (usersResponse.status === 401 || departmentsResponse.status === 401) {
                    redirectToLogin();
                    return;
                }

                if (!usersResponse.ok) {
                    setErrorMsg("gagal mengambil data user.");
                    return;
                }

                if (!departmentsResponse.ok) {
                    setErrorMsg("gagal mengambil data department.");
                    return;
                }

                const usersData = await usersResponse.json();
                const departmentsData = await departmentsResponse.json();
                const departmentList = Array.isArray(departmentsData)
                    ? departmentsData
                    : departmentsData.results || [];

                setUsers(Array.isArray(usersData) ? usersData : usersData.results || []);
                setDepartments(departmentList);

                if (departmentList.length > 0) {
                    setFormData((prev) => ({
                        ...prev,
                        department: prev.department || departmentList[0].id.toString(),
                    }));
                }
            } catch {
                setErrorMsg("gagal terhubung ke server backend.");
            } finally {
                setIsLoadingData(false);
                setIsChecking(false);
            }
        };

        loadData();
    }, [redirectToLogin, router]);

    const openCreateModal = () => {
        setErrorMsg("");
        setIsCreateModalOpen(true);
    };

    const closeCreateModal = () => {
        if (isSaving) return;
        setIsCreateModalOpen(false);
    };

    const handleSearchChange = (value: string) => {
        setSearchQuery(value);
        setCurrentPage(1);
    };

    const handleUserFilterChange = (value: UserFilter) => {
        setSelectedUserFilter(value);
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

    const handleCreateUser = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const token = getTokenOrRedirect();

        if (!token) return;

        if (!formData.username.trim()) {
            setErrorMsg("username wajib diisi.");
            return;
        }

        if (!formData.password.trim()) {
            setErrorMsg("password awal wajib diisi.");
            return;
        }

        if (!formData.department) {
            setErrorMsg("department wajib dipilih.");
            return;
        }

        setErrorMsg("");
        setIsSaving(true);

        try {
            const response = await fetch(apiUrl("/api/users/"), {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    username: formData.username,
                    password: formData.password,
                    role: formData.role,
                    department: Number(formData.department),
                }),
            });

            if (response.status === 401) {
                redirectToLogin();
                return;
            }

            if (!response.ok) {
                setErrorMsg(await getErrorMessage(response));
                return;
            }

            const createdUser = await response.json();
            setUsers((prev) => [...prev, createdUser].sort((a, b) =>
                a.username.localeCompare(b.username)
            ));
            setFormData((prev) => ({
                username: "",
                password: "",
                role: "requester",
                department: prev.department,
            }));
            setIsCreateModalOpen(false);
            setFeedbackModal({
                title: "user berhasil dibuat",
                message:
                    "user baru wajib mengganti password saat login pertama.",
            });
        } catch {
            setErrorMsg("gagal terhubung ke server backend.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleResetPassword = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const token = getTokenOrRedirect();

        if (!token || !resetModal) return;

        if (!resetModal.password.trim()) {
            setErrorMsg("password sementara wajib diisi.");
            return;
        }

        if (resetModal.password !== resetModal.confirmPassword) {
            setErrorMsg("konfirmasi password sementara tidak sama.");
            return;
        }

        setErrorMsg("");
        setIsSaving(true);

        try {
            const response = await fetch(
                apiUrl(`/api/users/${resetModal.userId}/reset-password/`),
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        password: resetModal.password,
                        confirm_password: resetModal.confirmPassword,
                    }),
                }
            );

            if (response.status === 401) {
                redirectToLogin();
                return;
            }

            if (!response.ok) {
                setErrorMsg(await getErrorMessage(response));
                return;
            }

            const updatedUser = await response.json();
            setUsers((prev) =>
                prev.map((item) =>
                    item.id === updatedUser.id ? updatedUser : item
                )
            );
            setResetModal(null);
            setFeedbackModal({
                title: "password berhasil direset",
                message:
                    "user wajib mengganti password sementara saat login berikutnya.",
            });
        } catch {
            setErrorMsg("gagal terhubung ke server backend.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleRemoveUser = async () => {
        const token = getTokenOrRedirect();

        if (!token || !removeModal) return;

        setErrorMsg("");
        setRemovingUserId(removeModal.userId);

        try {
            const response = await fetch(
                apiUrl(`/api/users/${removeModal.userId}/`),
                {
                    method: "DELETE",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            if (response.status === 401) {
                redirectToLogin();
                return;
            }

            if (!response.ok) {
                setRemoveModal(null);
                setErrorMsg(await getErrorMessage(response));
                return;
            }

            setUsers((prev) =>
                prev.filter((item) => item.id !== removeModal.userId)
            );
            setRemoveModal(null);
            setFeedbackModal({
                title: "user berhasil di-remove",
                message:
                    "akun sudah dinonaktifkan dan tidak tampil lagi di daftar user.",
            });
        } catch {
            setErrorMsg("gagal terhubung ke server backend.");
        } finally {
            setRemovingUserId(null);
        }
    };

    if (isChecking) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-background font-body-default text-body-default text-on-surface-variant">
                memuat user management...
            </div>
        );
    }

    return (
        <DashboardLayout
            user={user}
            title="user management"
            subtitle="kelola hak akses dan informasi pengguna sistem helpdesk."
        >
            {errorMsg && (
                <div className="alert-error">
                    {errorMsg}
                </div>
            )}

            {user && !canAccessDashboardRoute(user.role, "userManagement") ? (
                <AccessDenied />
            ) : (
                <div className="page-shell">
                    <div className="flex flex-col gap-md lg:flex-row lg:items-end lg:justify-between">
                        <div>
                            <h3 className="font-headline-md text-headline-md text-slate-900">
                                Manajemen User
                            </h3>
                            <p className="mt-xs text-body-default text-slate-500">
                                Kelola hak akses, department, dan status password user.
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={openCreateModal}
                            className="btn-primary"
                        >
                            <span className="text-lg leading-none">+</span>
                            Tambah User Baru
                        </button>
                    </div>

                    <div className="grid grid-cols-1 gap-md md:grid-cols-4">
                        <div className="card-shell flex items-center gap-md p-lg">
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 font-title-md text-title-md text-blue-700">
                                U
                            </div>
                            <div>
                                <p className="font-caption text-caption text-slate-500">Total User</p>
                                <p className="font-title-md text-title-md text-slate-900">
                                    {stats.total}
                                </p>
                            </div>
                        </div>

                        <div className="card-shell flex items-center gap-md p-lg">
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-50 font-title-md text-title-md text-green-700">
                                A
                            </div>
                            <div>
                                <p className="font-caption text-caption text-slate-500">Administrator</p>
                                <p className="font-title-md text-title-md text-slate-900">
                                    {stats.administrators}
                                </p>
                            </div>
                        </div>

                        <div className="card-shell flex items-center gap-md p-lg">
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-50 font-title-md text-title-md text-purple-700">
                                IT
                            </div>
                            <div>
                                <p className="font-caption text-caption text-slate-500">IT Staff</p>
                                <p className="font-title-md text-title-md text-slate-900">
                                    {stats.itStaff}
                                </p>
                            </div>
                        </div>

                        <div className="card-shell flex items-center gap-md p-lg">
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-yellow-50 font-title-md text-title-md text-yellow-700">
                                !
                            </div>
                            <div>
                                <p className="font-caption text-caption text-slate-500">Wajib Ganti</p>
                                <p className="font-title-md text-title-md text-slate-900">
                                    {stats.pendingPassword}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="card-shell">
                        <div className="card-header flex flex-col gap-md lg:flex-row lg:items-center lg:justify-between">
                            <h3 className="font-title-md text-title-md text-slate-900">
                                Daftar Pengguna
                            </h3>

                            <div className="flex w-full flex-col gap-sm sm:flex-row lg:w-auto lg:items-center">
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
                                            placeholder="Cari user, role, atau department..."
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
                                    <label htmlFor="user-management-filter" className="sr-only">
                                        Filter user management
                                    </label>

                                    <select
                                        id="user-management-filter"
                                        value={selectedUserFilter}
                                        onChange={(event) =>
                                            handleUserFilterChange(event.target.value as UserFilter)
                                        }
                                        className="form-control appearance-none pr-12"
                                    >
                                        {userFilterMenus.map((item) => (
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
                                    <tr className="table-head-row uppercase tracking-wide">
                                        <th className="table-head-cell">Username</th>
                                        <th className="table-head-cell">Role</th>
                                        <th className="table-head-cell">Department</th>
                                        <th className="table-head-cell">Status Password</th>
                                        <th className="table-head-cell text-right">
                                            Aksi
                                        </th>
                                    </tr>
                                </thead>

                                <tbody className="divide-y divide-border-subtle">
                                    {isLoadingData ? (
                                        <tr>
                                            <td
                                                colSpan={5}
                                                className="p-xl text-center text-body-default text-slate-500"
                                            >
                                                memuat data user...
                                            </td>
                                        </tr>
                                    ) : paginatedUsers.length > 0 ? (
                                        paginatedUsers.map((item) => (
                                            <tr
                                                key={item.id}
                                                className="group transition hover:bg-surface-container"
                                            >
                                                <td className="table-body-cell">
                                                    <div className="font-semibold text-slate-900">
                                                        {item.username}
                                                    </div>
                                                    {item.email && (
                                                        <div className="mt-xs font-caption text-caption text-slate-500">
                                                            {item.email}
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="table-body-cell">
                                                    <span
                                                        className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold ${getRoleBadgeClass(
                                                            item.role
                                                        )}`}
                                                    >
                                                        {getRoleLabel(item.role)}
                                                    </span>
                                                </td>
                                                <td className="table-body-cell text-on-surface-variant">
                                                    {item.department_name || "-"}
                                                </td>
                                                <td className="table-body-cell">
                                                    <span
                                                        className={`inline-flex items-center gap-2 text-xs font-bold ${item.must_change_password
                                                                ? "text-yellow-700"
                                                                : "text-green-700"
                                                            }`}
                                                    >
                                                        {item.must_change_password
                                                            ? "Wajib Ganti"
                                                            : "Sudah Diganti"}
                                                    </span>
                                                </td>
                                                <td className="table-body-cell text-right">
                                                    <div className="flex flex-wrap items-center justify-end gap-sm">
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setErrorMsg("");
                                                                setResetModal({
                                                                    userId: item.id,
                                                                    username: item.username,
                                                                    password: "",
                                                                    confirmPassword: "",
                                                                });
                                                            }}
                                                            className="font-button text-button text-red-600 hover:underline"
                                                        >
                                                            Reset Password
                                                        </button>

                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setErrorMsg("");
                                                                setRemoveModal({
                                                                    userId: item.id,
                                                                    username: item.username,
                                                                });
                                                            }}
                                                            disabled={
                                                                item.id === user?.id ||
                                                                removingUserId === item.id
                                                            }
                                                            className="font-button text-button text-red-600 hover:underline disabled:cursor-not-allowed disabled:text-slate-400 disabled:no-underline"
                                                        >
                                                            Remove
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td
                                                colSpan={5}
                                                className="p-xl text-center text-body-default text-slate-500"
                                            >
                                                tidak ada user pada filter ini.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        <div className="flex flex-col gap-md border-t border-border-subtle p-lg md:flex-row md:items-center md:justify-between">
                            <p className="font-caption text-caption text-slate-500">
                                Menampilkan {startRow}-{endRow} dari {filteredUsers.length} user
                            </p>

                            <div className="flex flex-wrap items-center gap-sm">
                                <label
                                    htmlFor="user-management-rows-per-page"
                                    className="font-caption text-caption text-slate-500"
                                >
                                    Rows per page
                                </label>

                                <select
                                    id="user-management-rows-per-page"
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

            {isCreateModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-4">
                    <div className="card-shell w-full max-w-lg">
                        <div className="card-header flex items-center justify-between gap-md">
                            <h3 className="font-headline-sm text-headline-sm text-slate-900">
                                Tambah User Baru
                            </h3>
                            <button
                                type="button"
                                onClick={closeCreateModal}
                                className="h-9 w-9 rounded-full text-on-surface-variant transition hover:bg-surface-container"
                            >
                                x
                            </button>
                        </div>

                        <form onSubmit={handleCreateUser} className="card-body space-y-lg">
                            <div className="grid grid-cols-1 gap-lg md:grid-cols-2">
                                <div>
                                    <label className="form-label">
                                        Username
                                    </label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        placeholder="username_user"
                                        value={formData.username}
                                        onChange={(event) =>
                                            setFormData({
                                                ...formData,
                                                username: event.target.value,
                                            })
                                        }
                                        disabled={isSaving}
                                    />
                                </div>

                                <div>
                                    <label className="form-label">
                                        Department
                                    </label>
                                    <select
                                        className="form-control"
                                        value={formData.department}
                                        onChange={(event) =>
                                            setFormData({
                                                ...formData,
                                                department: event.target.value,
                                            })
                                        }
                                        disabled={isSaving || departments.length === 0}
                                    >
                                        {departments.length > 0 ? (
                                            departments.map((department) => (
                                                <option
                                                    key={department.id}
                                                    value={department.id}
                                                >
                                                    {department.name}
                                                </option>
                                            ))
                                        ) : (
                                            <option value="">
                                                department belum tersedia
                                            </option>
                                        )}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="form-label">
                                    Role Pengguna
                                </label>
                                <div className="grid grid-cols-3 gap-md">
                                    {(["administrator", "it_staff", "requester"] as UserRole[]).map(
                                        (role) => (
                                            <label key={role} className="cursor-pointer">
                                                <input
                                                    type="radio"
                                                    name="role"
                                                    className="peer hidden"
                                                    checked={formData.role === role}
                                                    onChange={() =>
                                                        setFormData({
                                                            ...formData,
                                                            role,
                                                        })
                                                    }
                                                    disabled={isSaving}
                                                />
                                                <div className="rounded-xl border border-slate-300 p-md text-center text-on-surface-variant transition peer-checked:border-primary peer-checked:bg-blue-50 peer-checked:text-primary">
                                                    <span className="font-caption text-caption font-bold">
                                                        {getRoleLabel(role)}
                                                    </span>
                                                </div>
                                            </label>
                                        )
                                    )}
                                </div>
                            </div>

                            <div>
                                <label className="form-label">
                                    Password Awal
                                </label>
                                <input
                                    type="password"
                                    className="form-control"
                                    value={formData.password}
                                    onChange={(event) =>
                                        setFormData({
                                            ...formData,
                                            password: event.target.value,
                                        })
                                    }
                                    disabled={isSaving}
                                />
                                <p className="helper-text">
                                    User akan diminta mengganti password saat login
                                    pertama kali.
                                </p>
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
                                    disabled={isSaving || departments.length === 0}
                                    className="btn-primary flex-1"
                                >
                                    {isSaving ? "menyimpan..." : "Simpan User"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {resetModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-4">
                    <div className="modal-card max-w-md">
                        <h3 className="mb-sm font-headline-sm text-headline-sm text-slate-900">
                            Reset Password
                        </h3>

                        <p className="mb-lg text-body-default text-on-surface-variant">
                            atur password sementara baru untuk {resetModal.username}.
                        </p>

                        <form onSubmit={handleResetPassword} className="space-y-lg">
                            <div>
                                <label className="form-label">
                                    Password Sementara Baru
                                </label>
                                <input
                                    type="password"
                                    className="form-control"
                                    value={resetModal.password}
                                    onChange={(event) =>
                                        setResetModal({
                                            ...resetModal,
                                            password: event.target.value,
                                        })
                                    }
                                    disabled={isSaving}
                                />
                            </div>

                            <div>
                                <label className="form-label">
                                    Konfirmasi Password Sementara
                                </label>
                                <input
                                    type="password"
                                    className="form-control"
                                    value={resetModal.confirmPassword}
                                    onChange={(event) =>
                                        setResetModal({
                                            ...resetModal,
                                            confirmPassword: event.target.value,
                                        })
                                    }
                                    disabled={isSaving}
                                />
                            </div>

                            <div className="flex justify-end gap-md pt-sm">
                                <button
                                    type="button"
                                    onClick={() => setResetModal(null)}
                                    disabled={isSaving}
                                    className="btn-secondary"
                                >
                                    cancel
                                </button>

                                <button
                                    type="submit"
                                    disabled={isSaving}
                                    className="btn-primary"
                                >
                                    reset
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {removeModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-4">
                    <div className="modal-card max-w-md">
                        <h3 className="mb-sm font-headline-sm text-headline-sm text-slate-900">
                            Remove User
                        </h3>

                        <p className="mb-lg text-body-default text-on-surface-variant">
                            Remove user {removeModal.username}? Akun akan
                            dinonaktifkan agar riwayat tiket tetap aman.
                        </p>

                        <div className="flex justify-end gap-md pt-sm">
                            <button
                                type="button"
                                onClick={() => setRemoveModal(null)}
                                disabled={removingUserId !== null}
                                className="btn-secondary"
                            >
                                cancel
                            </button>

                            <button
                                type="button"
                                onClick={handleRemoveUser}
                                disabled={removingUserId !== null}
                                className="btn-primary bg-red-600 hover:bg-red-700"
                            >
                                {removingUserId ? "remove..." : "remove"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {feedbackModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-4">
                    <div className="modal-card max-w-sm text-center">
                        <div className="mx-auto mb-lg flex h-14 w-14 items-center justify-center rounded-full border border-green-100 bg-green-50 text-green-600">
                            <span className="font-title-md text-title-md leading-none">OK</span>
                        </div>

                        <h3 className="mb-sm font-headline-sm text-headline-sm text-slate-900">
                            {feedbackModal.title}
                        </h3>

                        <p className="text-body-default text-on-surface-variant">
                            {feedbackModal.message}
                        </p>

                        <button
                            type="button"
                            onClick={() => setFeedbackModal(null)}
                            className="btn-primary mt-lg w-full"
                        >
                            ok
                        </button>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
}
