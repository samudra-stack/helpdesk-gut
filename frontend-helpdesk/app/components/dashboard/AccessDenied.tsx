"use client";

import { useRouter } from "next/navigation";
import { ACCESS_DENIED_MESSAGE } from "../../lib/auth";

export default function AccessDenied() {
    const router = useRouter();

    return (
        <div className=" fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 px-4">
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="access-denied-title"
                className="modal-card max-w-md text-center"
            >
                <div className="mx-auto mb-lg flex h-14 w-14 items-center justify-center rounded-full border border-red-100 bg-red-50 text-red-600">
                    <span className="font-headline-sm text-headline-sm leading-none">!</span>
                </div>

                <h3
                    id="access-denied-title"
                    className="mb-lg font-headline-lg text-headline-sm text-slate-900"
                >
                    Permintan Ditolak
                </h3>

                <p className="text-body-default text-on-surface-variant">
                    {ACCESS_DENIED_MESSAGE}
                </p>

                <button
                    type="button"
                    onClick={() => router.push("/dashboard")}
                    className="btn-primary mt-lg"
                >
                    ok
                </button>
            </div>
        </div>
    );
}
