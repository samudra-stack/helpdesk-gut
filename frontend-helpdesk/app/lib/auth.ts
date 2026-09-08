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

export type DashboardRouteKey =
    | "dashboard"
    | "create"
    | "workOrder"
    | "userManagement"
    | "departments";

export const ACCESS_DENIED_MESSAGE =
    "Maaf, akun Anda tidak bisa akses ke halaman ini.";

export function getApiBaseUrl() {
    const configuredApiUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.trim();

    if (configuredApiUrl) {
        return configuredApiUrl.replace(/\/$/, "");
    }

    return "http://127.0.0.1:8000";
}

export function apiUrl(path: string) {
    const normalizedPath = path.startsWith("/") ? path : `/${path}`;
    const apiBaseUrl = getApiBaseUrl();

    if (apiBaseUrl) {
        return `${apiBaseUrl}${normalizedPath}`;
    }

    return normalizedPath.length > 1
        ? normalizedPath.replace(/\/$/, "")
        : normalizedPath;
}

export function getStoredUser() {
    if (typeof window === "undefined") return null;

    const storedUser = window.localStorage.getItem("user");

    if (!storedUser) return null;

    try {
        return JSON.parse(storedUser) as UserInfo;
    } catch {
        window.localStorage.removeItem("user");
        return null;
    }
}

export function clearStoredSession() {
    if (typeof window === "undefined") return;

    window.localStorage.removeItem("access_token");
    window.localStorage.removeItem("refresh_token");
    window.localStorage.removeItem("user");
    window.localStorage.removeItem("remember_until");
}

export function canAccessDashboardRoute(
    role: UserRole | undefined,
    routeKey: DashboardRouteKey
) {
    if (!role) return false;

    if (routeKey === "dashboard") return true;

    if (routeKey === "create") {
        return role === "requester" || role === "administrator";
    }

    if (routeKey === "workOrder") {
        return role === "it_staff" || role === "administrator";
    }

    if (routeKey === "userManagement" || routeKey === "departments") {
        return role === "administrator";
    }

    return false;
}
