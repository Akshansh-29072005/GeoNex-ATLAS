import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "@/context/theme-provider";
import { useAuthStore } from "@/lib/store";
import { notificationsAPI } from "@/lib/api-client";
import { Moon, Sun, Bell, LogOut, Settings, ChevronDown } from "lucide-react";

interface Notification {
    id: string;
    title: string;
    message: string;
    created_at: string;
    read: boolean;
}

export function Header() {
    const { theme, setTheme } = useTheme();
    const { user, logout } = useAuthStore();
    const navigate = useNavigate();
    const [showNotifications, setShowNotifications] = useState(false);
    const [showProfile, setShowProfile] = useState(false);
    const notifRef = useRef<HTMLDivElement>(null);
    const profileRef = useRef<HTMLDivElement>(null);

    const [notifications, setNotifications] = useState<Notification[]>([]);

    useEffect(() => {
        const loadNotifications = async () => {
            try {
                const { data } = await notificationsAPI.getMine();
                if (Array.isArray(data)) {
                    setNotifications(data.slice(0, 10));
                }
            } catch {
                // API might not be ready yet — keep empty
            }
        };
        loadNotifications();
    }, []);

    const unreadCount = notifications.filter(n => !n.read).length;

    const [now, setNow] = useState(Date.now());

    useEffect(() => {
        const timer = setInterval(() => setNow(Date.now()), 60000);
        return () => clearInterval(timer);
    }, []);

    const getTimeAgo = (dateStr: string) => {
        const diff = now - new Date(dateStr).getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 1) return "Just now";
        if (mins < 60) return `${mins} min ago`;
        const hrs = Math.floor(mins / 60);
        if (hrs < 24) return `${hrs} hrs ago`;
        const days = Math.floor(hrs / 24);
        return `${days}d ago`;
    };

    // Close dropdowns on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (notifRef.current && !notifRef.current.contains(e.target as Node)) setShowNotifications(false);
            if (profileRef.current && !profileRef.current.contains(e.target as Node)) setShowProfile(false);
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    const handleLogout = () => {
        logout();
        navigate("/login");
    };

    const initials = user?.name ? user.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) : "?";

    return (
        <header className="flex h-16 items-center justify-between border-b bg-background px-6">
            <h2 className="text-lg font-semibold">Overview</h2>

            <div className="flex items-center gap-3">
                {/* Notification Bell */}
                <div className="relative" ref={notifRef}>
                    <button
                        onClick={() => setShowNotifications(!showNotifications)}
                        className="relative rounded-full p-2 hover:bg-muted text-muted-foreground transition"
                    >
                        <Bell className="h-5 w-5" />
                        {unreadCount > 0 && (
                            <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-white">
                                {unreadCount}
                            </span>
                        )}
                    </button>

                    {showNotifications && (
                        <div className="absolute right-0 top-12 z-50 w-80 rounded-lg border bg-card shadow-lg animate-in fade-in slide-in-from-top-2 duration-200">
                            <div className="flex items-center justify-between border-b px-4 py-3">
                                <h3 className="font-semibold text-sm">Notifications</h3>
                                <span className="text-xs text-muted-foreground">{unreadCount} unread</span>
                            </div>
                            <div className="max-h-72 overflow-y-auto">
                                {notifications.length === 0 ? (
                                    <div className="p-6 text-center text-sm text-muted-foreground">
                                        No notifications yet
                                    </div>
                                ) : (
                                    notifications.map((n) => (
                                        <div
                                            key={n.id}
                                            className={`flex gap-3 px-4 py-3 border-b last:border-0 hover:bg-muted/50 cursor-pointer transition ${!n.read ? "bg-primary/5" : ""
                                                }`}
                                            onClick={async () => {
                                                if (!n.read) {
                                                    try {
                                                        await notificationsAPI.markRead(n.id);
                                                        setNotifications(prev => prev.map(notif =>
                                                            notif.id === n.id ? { ...notif, read: true } : notif
                                                        ));
                                                    } catch { /* ignore */ }
                                                }
                                            }}
                                        >
                                            <div className={`mt-1 h-2 w-2 shrink-0 rounded-full ${!n.read ? "bg-primary" : "bg-transparent"}`} />
                                            <div className="min-w-0 flex-1">
                                                <p className="text-sm font-medium truncate">{n.title}</p>
                                                <p className="text-xs text-muted-foreground truncate">{n.message}</p>
                                                <p className="text-[10px] text-muted-foreground mt-1">{getTimeAgo(n.created_at)}</p>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Theme Toggle */}
                <button
                    onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                    className="rounded-full p-2 hover:bg-muted text-muted-foreground transition"
                >
                    {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                </button>

                {/* Profile Dropdown */}
                <div className="relative" ref={profileRef}>
                    <button
                        onClick={() => setShowProfile(!showProfile)}
                        className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-muted transition"
                    >
                        <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm">
                            {initials}
                        </div>
                        <div className="hidden md:block text-left">
                            <p className="text-sm font-medium">{user?.name || "User"}</p>
                            <p className="text-[10px] text-muted-foreground">{user?.role || "Unknown"}</p>
                        </div>
                        <ChevronDown className="h-3 w-3 text-muted-foreground hidden md:block" />
                    </button>

                    {showProfile && (
                        <div className="absolute right-0 top-12 z-50 w-48 rounded-lg border bg-card shadow-lg animate-in fade-in slide-in-from-top-2 duration-200">
                            <div className="px-4 py-3 border-b">
                                <p className="text-sm font-medium">{user?.name}</p>
                                <p className="text-xs text-muted-foreground">{user?.email}</p>
                            </div>
                            <div className="py-1">
                                <button
                                    onClick={() => { navigate("/settings"); setShowProfile(false); }}
                                    className="flex w-full items-center gap-2 px-4 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition"
                                >
                                    <Settings className="h-4 w-4" /> Settings
                                </button>
                                <button
                                    onClick={handleLogout}
                                    className="flex w-full items-center gap-2 px-4 py-2 text-sm text-destructive hover:bg-destructive/10 transition"
                                >
                                    <LogOut className="h-4 w-4" /> Logout
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}
