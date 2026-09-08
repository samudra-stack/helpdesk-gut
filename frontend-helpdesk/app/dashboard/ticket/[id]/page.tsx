"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import DashboardLayout, {
    UserInfo,
} from "../../../components/dashboard/DashboardLayout";
import TicketDetailModal from "../../../components/dashboard/TicketDetailModal";
import { apiUrl } from "../../../lib/auth";

export default function TicketDetailPage() {
    const params = useParams<{ id: string }>();
    const router = useRouter();

    const [user, setUser] = useState<UserInfo | null>(null);
    const [isChecking, setIsChecking] = useState(true);

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

        const loadUser = async () => {
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
                    const response = await fetch(apiUrl("/api/user-info/"), {
                        method: "GET",
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    });

                    if (!response.ok) {
                        clearSessionAndRedirect();
                        return;
                    }

                    currentUser = await response.json();
                    localStorage.setItem("user", JSON.stringify(currentUser));
                }

                setUser(currentUser);
            } catch {
                clearSessionAndRedirect();
            } finally {
                setIsChecking(false);
            }
        };

        loadUser();
    }, [clearSessionAndRedirect, router]);

    const handleClose = () => {
        router.push("/dashboard");
    };

    if (isChecking) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-background font-body-default text-body-default text-on-surface-variant">
                memuat detail tiket...
            </div>
        );
    }

    return (
        <DashboardLayout
            user={user}
            title="detail tiket"
            subtitle="informasi lengkap dan status penanganan tiket"
        >
            <div className="min-h-[60vh]" />

            <TicketDetailModal
                ticketId={params.id}
                user={user}
                onClose={handleClose}
                onUnauthorized={clearSessionAndRedirect}
            />
        </DashboardLayout>
    );
}
