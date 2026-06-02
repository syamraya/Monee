"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import {
    FiBell,
    FiCheckCircle,
    FiInfo,
    FiAlertTriangle,
} from "react-icons/fi";

const API = process.env.NEXT_PUBLIC_BASE_API_URL ?? "http://localhost:3001";

// ── Types ───────────────────────────────
interface NotificationItem {
    id: string;
    title: string;
    message: string;
    type: "success" | "info" | "warning";
    createdAt: string;
    read: boolean;
}

// ── Card ────────────────────────────────
function Card({
    children,
    delay = 0,
}: {
    children: React.ReactNode;
    delay?: number;
}) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay }}
            className="bg-white border border-slate-100 rounded-3xl shadow-sm hover:shadow-md transition-all p-5"
        >
            {children}
        </motion.div>
    );
}

// ── Icon helper ─────────────────────────
function getIcon(type: NotificationItem["type"]) {
    switch (type) {
        case "success":
            return <FiCheckCircle className="text-green-500" />;
        case "warning":
            return <FiAlertTriangle className="text-yellow-500" />;
        default:
            return <FiInfo className="text-blue-500" />;
    }
}

// ── Page ────────────────────────────────
export default function NotificationsPage() {
    const [data, setData] = useState<NotificationItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchNotif = async () => {
            try {
                const res = await fetch(`${API}/notifications`);
                const json = await res.json();

                // fallback kalau backend belum ada
                setData(
                    json?.length
                        ? json
                        : [
                            {
                                id: "1",
                                title: "Welcome!",
                                message: "Selamat datang di dashboard kamu 🚀",
                                type: "success",
                                createdAt: new Date().toISOString(),
                                read: false,
                            },
                            {
                                id: "2",
                                title: "Market Update",
                                message: "Bitcoin naik 2.4% dalam 24 jam terakhir",
                                type: "info",
                                createdAt: new Date().toISOString(),
                                read: true,
                            },
                        ]
                );
            } catch {
                setData([]);
            } finally {
                setLoading(false);
            }
        };

        fetchNotif();
    }, []);

    return (
        <div className="min-h-screen bg-slate-50 p-6 lg:p-8">
            <div className="max-w-3xl mx-auto">

                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-6"
                >
                    <h1 className="text-green-400 text-[22px] font-black flex items-center gap-2">
                        <FiBell /> Notifications
                    </h1>
                    <p className="text-slate-400 text-[12px] font-mono mt-1">
                        Latest updates & alerts
                    </p>
                </motion.div>

                {/* List */}
                <div className="space-y-3">
                    {loading ? (
                        <Card>
                            <p className="text-slate-400 text-sm">Loading notifications...</p>
                        </Card>
                    ) : data.length === 0 ? (
                        <Card>
                            <p className="text-slate-400 text-sm">No notifications yet</p>
                        </Card>
                    ) : (
                        data.map((n, i) => (
                            <Card key={n.id} delay={i * 0.05}>
                                <div className="flex items-start gap-3">

                                    {/* icon */}
                                    <div className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center">
                                        {getIcon(n.type)}
                                    </div>

                                    {/* content */}
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between">
                                            <p className="text-slate-800 font-bold text-[14px]">
                                                {n.title}
                                            </p>

                                            {!n.read && (
                                                <span className="text-[10px] px-2 py-1 rounded-full bg-blue-50 text-blue-500 font-bold">
                                                    NEW
                                                </span>
                                            )}
                                        </div>

                                        <p className="text-slate-500 text-[12px] mt-1">
                                            {n.message}
                                        </p>

                                        <p className="text-slate-400 text-[10px] font-mono mt-2">
                                            {new Date(n.createdAt).toLocaleString("id-ID")}
                                        </p>
                                    </div>
                                </div>
                            </Card>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}