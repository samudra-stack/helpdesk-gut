"use client";

import Image from "next/image";
import { FormEvent, KeyboardEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiUrl, clearStoredSession } from "../lib/auth";
import logoGut from "../../image/logo gut.png";

type UserInfo = {
    id: number;
    username: string;
    email: string;
    role: "requester" | "it_staff" | "administrator";
    department?: number | null;
    department_name?: string;
    must_change_password?: boolean;
    is_staff: boolean;
    is_superuser: boolean;
};

const REMEMBER_DURATION_MS = 30 * 24 * 60 * 60 * 1000;

export default function LoginPage() {
    const router = useRouter();

    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [rememberMe, setRememberMe] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem("access_token");
        const storedUser = localStorage.getItem("user");
        const storedRememberUntil = localStorage.getItem("remember_until");
        const rememberUntil = storedRememberUntil
            ? Number(storedRememberUntil)
            : null;
        const rememberExpired =
            rememberUntil !== null &&
            (!Number.isFinite(rememberUntil) || rememberUntil <= Date.now());

        if (rememberExpired) {
            clearStoredSession();
        } else if (token && storedUser) {
            router.replace("/dashboard");
        }
    }, [router]);

    const submitLogin = async () => {
        if (isLoading) return;

        setErrorMsg("");
        setIsLoading(true);

        try {
            const loginResponse = await fetch(apiUrl("/api/token/"), {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    username,
                    password,
                }),
            });

            if (!loginResponse.ok) {
                setErrorMsg("username atau password salah.");
                return;
            }

            const tokenData = await loginResponse.json();

            localStorage.setItem("access_token", tokenData.access);
            localStorage.setItem("refresh_token", tokenData.refresh);

            if (rememberMe) {
                const rememberUntil = Date.now() + REMEMBER_DURATION_MS;
                localStorage.setItem("remember_until", rememberUntil.toString());
            } else {
                localStorage.removeItem("remember_until");
            }

            const userResponse = await fetch(apiUrl("/api/user-info/"), {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${tokenData.access}`,
                },
            });

            if (!userResponse.ok) {
                clearStoredSession();

                setErrorMsg("login berhasil, tapi gagal mengambil data user.");
                return;
            }

            const userData: UserInfo = await userResponse.json();

            localStorage.setItem("user", JSON.stringify(userData));

            if (userData.must_change_password) {
                router.push("/dashboard/change-password");
                return;
            }

            router.push("/dashboard");
        } catch {
            setErrorMsg("gagal terhubung ke server backend.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleLogin = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        void submitLogin();
    };

    const handleLoginKeyDown = (e: KeyboardEvent<HTMLFormElement>) => {
        if (e.key !== "Enter") return;

        e.preventDefault();
        void submitLogin();
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-background px-md">
            <div className="card-shell w-full max-w-md p-xl">
                <div className="mb-xl text-center">
                    <div className="mx-auto mb-md flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 p-sm shadow-sm ring-1 ring-blue-100">
                        <Image
                            src={logoGut}
                            alt="Logo GUT"
                            className="h-10 w-auto object-contain"
                            priority
                        />
                    </div>

                    <h2 className="font-headline-md text-headline-md text-slate-900">
                        Selamat Datang di GUT Helpdesk
                    </h2>

                    <p className="mx-auto mt-sm max-w-sm text-body-default text-slate-500">
                        Silakan masuk untuk mengelola tiket dan permintaan layanan
                    </p>
                </div>

                {errorMsg && (
                    <div className="mb-md rounded-lg bg-red-50 p-md text-center text-body-default text-red-700">
                        {errorMsg}
                    </div>
                )}

                <form
                    onSubmit={handleLogin}
                    onKeyDown={handleLoginKeyDown}
                    method="post"
                    className="space-y-lg"
                >
                    <div>
                        <label className="form-label">
                            Username
                        </label>

                        <div className="relative">
                            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                                <svg
                                    aria-hidden="true"
                                    className="h-5 w-5"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    <path d="M20 21a8 8 0 0 0-16 0" />
                                    <circle cx="12" cy="7" r="4" />
                                </svg>
                            </span>

                            <input
                                type="text"
                                className="form-control pl-12"
                                placeholder="Masukkan username anda"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                disabled={isLoading}
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="form-label">
                            Password
                        </label>

                        <div className="relative">
                            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                                <svg
                                    aria-hidden="true"
                                    className="h-5 w-5"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    <rect width="18" height="11" x="3" y="11" rx="2" />
                                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                </svg>
                            </span>

                            <input
                                type={showPassword ? "text" : "password"}
                                className="form-control px-12"
                                placeholder="Masukkan password anda"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                disabled={isLoading}
                                required
                            />

                            <button
                                type="button"
                                onClick={() => setShowPassword((current) => !current)}
                                disabled={isLoading}
                                className="absolute right-4 top-1/2 z-10 -translate-y-1/2 text-slate-400 transition hover:text-primary disabled:cursor-not-allowed disabled:opacity-60"
                                aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                            >
                                {showPassword ? (
                                    <svg
                                        aria-hidden="true"
                                        className="h-5 w-5"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    >
                                        <path d="M17.94 17.94A10.8 10.8 0 0 1 12 20c-7 0-10-8-10-8a18.5 18.5 0 0 1 5.06-5.94" />
                                        <path d="M9.9 4.24A10.4 10.4 0 0 1 12 4c7 0 10 8 10 8a18.4 18.4 0 0 1-2.16 3.19" />
                                        <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
                                        <path d="M1 1l22 22" />
                                    </svg>
                                ) : (
                                    <svg
                                        aria-hidden="true"
                                        className="h-5 w-5"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    >
                                        <path d="M2 12s3-8 10-8 10 8 10 8-3 8-10 8-10-8-10-8Z" />
                                        <circle cx="12" cy="12" r="3" />
                                    </svg>
                                )}
                            </button>
                        </div>
                    </div>

                    <label className="flex cursor-pointer items-center gap-sm text-body-default text-slate-600">
                        <input
                            type="checkbox"
                            checked={rememberMe}
                            onChange={(e) => setRememberMe(e.target.checked)}
                            disabled={isLoading}
                            className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
                        />
                        <span>Ingat saya untuk 30 hari</span>
                    </label>

                    <div className="pt-sm">
                        <button
                            type="button"
                            onClick={() => void submitLogin()}
                            disabled={isLoading}
                            className="btn-primary w-full"
                        >
                            {isLoading ? "Masuk..." : "Masuk ke Dashboard"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
