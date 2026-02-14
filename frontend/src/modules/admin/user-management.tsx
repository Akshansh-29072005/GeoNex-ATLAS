import { useState, useRef, useEffect } from "react";
import { MoreHorizontal, Plus, Search, Shield, UserCog, Edit, Trash2, Mail, Ban, CheckCircle } from "lucide-react";
import { adminAPI } from "../../lib/api-client";

// Define User Interface matching backend
interface User {
    id: string;
    name: string;
    email?: string;
    phone?: string;
    role: string;
    created_at: string;
    status?: string; // Optional in backend, we can infer
}

export function AdminUserManagement() {
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeMenu, setActiveMenu] = useState<string | null>(null); // UUID is string
    const menuRef = useRef<HTMLDivElement>(null);

    // Fetch Users on Mount
    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        try {
            const res = await adminAPI.getAllUsers();
            // Backend returns raw user list. We can map status if needed or just use default.
            // Assuming backend User struct: {ID, Name, Email, Role, CreatedAt}
            const mappedUsers = res.data.map((u: any) => ({
                ...u,
                status: 'Active' // Default status for now as DB doesn't have is_active yet
            }));
            setUsers(mappedUsers);
        } catch (error) {
            console.error("Failed to load users", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) setActiveMenu(null);
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    const handleAction = (action: string, userId: string) => {
        const user = users.find(u => u.id === userId);
        alert(`Action: ${action} for ${user?.name} (ID: ${userId})`);
        setActiveMenu(null);
    };

    if (isLoading) {
        return <div className="p-10 text-center">Loading users...</div>;
    }

    return (
        <div className="p-6 h-full flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">User Management</h1>
                    <p className="text-muted-foreground">Manage system access for Inspectors and Officials.</p>
                </div>
                <button className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 shadow-sm">
                    <Plus className="h-4 w-4" />
                    Add New User
                </button>
            </div>

            <div className="border bg-card rounded-lg shadow-sm flex-1 flex flex-col">
                {/* Toolbar */}
                <div className="p-4 border-b flex items-center justify-between gap-4">
                    <div className="relative w-72">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Search users..."
                            className="w-full pl-9 pr-4 py-2 rounded-md border text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-auto flex-1">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-muted/50 text-muted-foreground sticky top-0">
                            <tr>
                                <th className="px-6 py-3 font-medium">User</th>
                                <th className="px-6 py-3 font-medium">Role</th>
                                <th className="px-6 py-3 font-medium">Member Since</th>
                                <th className="px-6 py-3 font-medium">Status</th>
                                <th className="px-6 py-3 font-medium text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {users.map((user) => (
                                <tr key={user.id} className="hover:bg-muted/50 transition group">
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-foreground">{user.name}</div>
                                        <div className="text-xs text-muted-foreground">{user.email || user.phone || 'No Contact'}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            {user.role === 'ADMIN' || user.role === 'SUPER_ADMIN' ?
                                                <Shield className="h-3 w-3 text-purple-600" /> :
                                                <UserCog className="h-3 w-3 text-blue-600" />
                                            }
                                            {user.role}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        {new Date(user.created_at).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                                            {user.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right relative">
                                        <button
                                            onClick={() => setActiveMenu(activeMenu === user.id ? null : user.id)}
                                            className="p-2 hover:bg-muted rounded-md text-muted-foreground hover:text-foreground transition"
                                        >
                                            <MoreHorizontal className="h-4 w-4" />
                                        </button>

                                        {/* Action Dropdown */}
                                        {activeMenu === user.id && (
                                            <div
                                                ref={menuRef}
                                                className="absolute right-6 top-12 z-50 w-48 rounded-lg border bg-card shadow-lg animate-in fade-in slide-in-from-top-2 duration-200"
                                            >
                                                <div className="py-1">
                                                    <button
                                                        onClick={() => handleAction("Edit", user.id)}
                                                        className="flex w-full items-center gap-2 px-4 py-2 text-sm hover:bg-muted transition"
                                                    >
                                                        <Edit className="h-3.5 w-3.5 text-blue-500" /> Edit User
                                                    </button>
                                                    <button
                                                        onClick={() => handleAction("Delete", user.id)}
                                                        className="flex w-full items-center gap-2 px-4 py-2 text-sm text-destructive hover:bg-destructive/10 transition"
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" /> Delete User
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="p-4 border-t text-xs text-muted-foreground flex justify-between items-center">
                    <span>Showing {users.length} users</span>
                </div>
            </div>
        </div>
    );
}
