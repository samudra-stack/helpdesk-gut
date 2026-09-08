"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
    apiUrl,
    clearStoredSession,
    getStoredUser,
    UserInfo,
} from "../../lib/auth";

export default function ChangePasswordPage() {
    const router = useRouter();

    const [user, setUser] = useState<UserInfo | null>(null);
    const [oldPassword, setOldPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isChecking, setIsChecking] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");
    const [isSuccessOpen, setIsSuccessOpen] = useState(false);

    const redirectToLogin = useCallback(() => {
        clearStoredSession();
        router.push("/login");
    }, [router]);

    useEffect(() => {
        const token = localStorage.getItem("access_token");

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

                setUser(currentUser);
            } catch {
                setErrorMsg("gagal terhubung ke server backend.");
            } finally {
                setIsChecking(false);
            }
        };

        loadUser();
    }, [redirectToLogin, router]);

    const getErrorMessage = async (response: Response) => {
        const data = await response.json().catch(() => null);

        if (Array.isArray(data?.old_password)) return data.old_password[0];
        if (Array.isArray(data?.new_password)) return data.new_password[0];
        if (Array.isArray(data?.confirm_password)) return data.confirm_password[0];
        if (Array.isArray(data?.non_field_errors)) return data.non_field_errors[0];
        if (typeof data?.detail === "string") return data.detail;

        return "gagal mengganti password.";
    };

    const handleChangePassword = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const token = localStorage.getItem("access_token");

        if (!token) {
            redirectToLogin();
            return;
        }

        if (!oldPassword || !newPassword || !confirmPassword) {
            setErrorMsg("semua field password wajib diisi.");
            return;
        }

        if (newPassword !== confirmPassword) {
            setErrorMsg("konfirmasi password baru tidak sama.");
            return;
        }

        setErrorMsg("");
        setIsSaving(true);

        try {
            const response = await fetch(apiUrl("/api/change-password/"), {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    old_password: oldPassword,
                    new_password: newPassword,
                    confirm_password: confirmPassword,
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

            const updatedUser = await response.json();
            localStorage.setItem("user", JSON.stringify(updatedUser));
            setIsSuccessOpen(true);
        } catch {
            setErrorMsg("gagal terhubung ke server backend.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleSuccessOk = () => {
        setIsSuccessOpen(false);
        router.push("/dashboard");
    };

    if (isChecking) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-background font-body-default text-body-default text-on-surface-variant">
                memuat halaman ganti password...
            </div>
        );
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-background px-md">
            <div className="card-shell w-full max-w-md">
                <div className="border-b border-border-subtle px-xl pb-lg pt-xl text-center">
                    <h1 className="font-headline-md text-headline-md text-slate-900">
                        Change Password
                    </h1>
                    <p className="mt-sm text-body-default text-slate-500">
                        Halo {user?.username || "user"}, ganti password sementara
                        sebelum masuk dashboard.
                    </p>
                </div>

                <form onSubmit={handleChangePassword} className="space-y-lg p-xl">
                    {errorMsg && (
                        <div className="rounded-lg bg-red-50 p-md text-center text-body-default text-red-700">
                            {errorMsg}
                        </div>
                    )}

                    <div>
                        <label className="form-label">
                            password lama
                        </label>
                        <input
                            type="password"
                            className="form-control"
                            value={oldPassword}
                            onChange={(event) => setOldPassword(event.target.value)}
                            disabled={isSaving}
                        />
                    </div>

                    <div>
                        <label className="form-label">
                            password baru
                        </label>
                        <input
                            type="password"
                            className="form-control"
                            value={newPassword}
                            onChange={(event) => setNewPassword(event.target.value)}
                            disabled={isSaving}
                        />
                    </div>

                    <div>
                        <label className="form-label">
                            konfirmasi password baru
                        </label>
                        <input
                            type="password"
                            className="form-control"
                            value={confirmPassword}
                            onChange={(event) =>
                                setConfirmPassword(event.target.value)
                            }
                            disabled={isSaving}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isSaving}
                        className="btn-primary w-full"
                    >
                        {isSaving ? "menyimpan..." : "simpan"}
                    </button>
                </form>
            </div>

            {isSuccessOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-4">
                    <div className="modal-card max-w-sm text-center">
                        <div className="mx-auto mb-lg flex h-14 w-14 items-center justify-center rounded-full border border-green-100 bg-green-50 text-green-600">
                            <span className="font-title-md text-title-md leading-none">OK</span>
                        </div>
                        <h3 className="mb-sm font-headline-sm text-headline-sm text-slate-900">
                            password berhasil diganti
                        </h3>
                        <p className="text-body-default text-on-surface-variant">
                            anda sekarang dapat masuk ke dashboard.
                        </p>
                        <button
                            type="button"
                            onClick={handleSuccessOk}
                            className="btn-primary mt-lg w-full"
                        >
                            ok
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
