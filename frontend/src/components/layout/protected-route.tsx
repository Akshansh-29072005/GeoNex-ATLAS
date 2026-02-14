import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "@/lib/store";

interface ProtectedRouteProps {
    allowedRoles?: string[];
    children?: React.ReactNode;
}

export function ProtectedRoute({ allowedRoles, children }: ProtectedRouteProps) {
    const { isAuthenticated, user } = useAuthStore();

    // Redirect to login if not authenticated
    if (!isAuthenticated || !user) {
        return <Navigate to="/login" replace />;
    }

    // Check role-based access
    if (allowedRoles && !allowedRoles.includes(user.role)) {
        return (
            <div className="flex h-full items-center justify-center p-8">
                <div className="text-center space-y-3">
                    <div className="text-4xl">🚫</div>
                    <h2 className="text-xl font-bold text-destructive">Access Denied</h2>
                    <p className="text-muted-foreground text-sm">
                        You do not have permission to view this page.
                        <br />
                        Required role: <strong>{allowedRoles.join(" or ")}</strong>
                    </p>
                </div>
            </div>
        );
    }

    return children ? <>{children}</> : <Outlet />;
}
