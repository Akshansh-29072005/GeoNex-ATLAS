import { Link, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/lib/store";
import {
    LayoutDashboard,
    Map,
    AlertTriangle,
    FileText,
    Settings,
    Users,
    LogOut,
} from "lucide-react";

const navItems = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Map Engine", href: "/map", icon: Map },
    { name: "Violations", href: "/violations", icon: AlertTriangle },
    { name: "Reports", href: "/reports", icon: FileText },
    { name: "Admin Panel", href: "/admin", icon: Users, roles: ["ADMIN", "SUPER_ADMIN"] },
];

export function Sidebar() {
    const location = useLocation();
    const navigate = useNavigate();
    const { user, logout } = useAuthStore();

    const handleLogout = () => {
        logout();
        navigate("/login");
    };

    // Filter nav items by role
    const visibleItems = navItems.filter((item) => {
        if (!item.roles) return true;
        return user?.role && item.roles.includes(user.role);
    });

    return (
        <div className="flex h-screen w-64 flex-col border-r bg-card text-card-foreground">
            <div className="flex h-16 items-center border-b px-6">
                <Map className="mr-2 h-6 w-6 text-primary" />
                <span className="text-lg font-bold tracking-tight">GeoNex ATLAS</span>
            </div>

            <div className="flex-1 overflow-auto py-4">
                <nav className="grid items-start px-4 text-sm font-medium">
                    {visibleItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = location.pathname.startsWith(item.href);

                        return (
                            <Link
                                key={item.href}
                                to={item.href}
                                className={cn(
                                    "flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-primary",
                                    isActive
                                        ? "bg-muted text-primary"
                                        : "text-muted-foreground"
                                )}
                            >
                                <Icon className="h-4 w-4" />
                                {item.name}
                            </Link>
                        )
                    })}
                </nav>
            </div>

            <div className="border-t p-4">
                <Link
                    to="/settings"
                    className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all hover:text-primary",
                        location.pathname === "/settings" ? "bg-muted text-primary" : "text-muted-foreground"
                    )}
                >
                    <Settings className="h-4 w-4" />
                    Settings
                </Link>
                <button
                    onClick={handleLogout}
                    className="mt-2 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-destructive transition-all hover:bg-destructive/10"
                >
                    <LogOut className="h-4 w-4" />
                    Logout
                </button>
            </div>
        </div>
    );
}
