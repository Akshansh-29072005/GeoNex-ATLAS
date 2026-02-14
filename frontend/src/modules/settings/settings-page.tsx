import { useState } from "react";
import { useAuthStore } from "@/lib/store";
import { useTheme } from "@/context/theme-provider";
import { User, Shield, Bell, Palette, Lock, Save, Check } from "lucide-react";

export function SettingsPage() {
    const { user } = useAuthStore();
    const { theme, setTheme } = useTheme();
    const [saved, setSaved] = useState(false);

    const [profile, setProfile] = useState({
        name: user?.name || "",
        email: user?.email || "",
    });

    const handleSave = () => {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
                <p className="text-muted-foreground">Manage your account and preferences</p>
            </div>

            {/* Profile Section */}
            <div className="border rounded-lg bg-card shadow-sm">
                <div className="flex items-center gap-3 p-4 border-b bg-muted/30">
                    <User className="h-5 w-5 text-primary" />
                    <h2 className="font-semibold">Profile Information</h2>
                </div>
                <div className="p-6 space-y-4">
                    <div className="flex items-center gap-4">
                        <div className="h-16 w-16 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xl">
                            {user?.name?.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) || "?"}
                        </div>
                        <div>
                            <p className="font-medium text-lg">{user?.name || "User"}</p>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Shield className="h-3 w-3" />
                                {user?.role || "Unknown Role"}
                            </div>
                        </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                        <div>
                            <label className="block text-sm font-medium text-muted-foreground mb-1">Full Name</label>
                            <input
                                value={profile.name}
                                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                                className="w-full border rounded-md p-2 text-sm bg-background focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-muted-foreground mb-1">Email</label>
                            <input
                                value={profile.email}
                                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                                className="w-full border rounded-md p-2 text-sm bg-background focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Appearance */}
            <div className="border rounded-lg bg-card shadow-sm">
                <div className="flex items-center gap-3 p-4 border-b bg-muted/30">
                    <Palette className="h-5 w-5 text-primary" />
                    <h2 className="font-semibold">Appearance</h2>
                </div>
                <div className="p-6">
                    <label className="block text-sm font-medium text-muted-foreground mb-3">Theme</label>
                    <div className="flex gap-3">
                        {(["light", "dark", "system"] as const).map((t) => (
                            <button
                                key={t}
                                onClick={() => setTheme(t)}
                                className={`flex-1 rounded-lg border-2 p-4 text-center text-sm font-medium capitalize transition ${theme === t
                                    ? "border-primary bg-primary/10 text-primary"
                                    : "border-border hover:border-muted-foreground/50"
                                    }`}
                            >
                                {t}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Notifications Preferences */}
            <div className="border rounded-lg bg-card shadow-sm">
                <div className="flex items-center gap-3 p-4 border-b bg-muted/30">
                    <Bell className="h-5 w-5 text-primary" />
                    <h2 className="font-semibold">Notification Preferences</h2>
                </div>
                <div className="p-6 space-y-4">
                    {[
                        { label: "Violation Alerts", desc: "Get notified when new violations are detected" },
                        { label: "Plot Status Changes", desc: "Updates when plot compliance status changes" },
                        { label: "Weekly Reports", desc: "Receive weekly compliance summary reports" },
                    ].map((item) => (
                        <div key={item.label} className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium">{item.label}</p>
                                <p className="text-xs text-muted-foreground">{item.desc}</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" defaultChecked className="sr-only peer" />
                                <div className="w-9 h-5 bg-muted rounded-full peer peer-checked:bg-primary peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all" />
                            </label>
                        </div>
                    ))}
                </div>
            </div>

            {/* Security */}
            <div className="border rounded-lg bg-card shadow-sm">
                <div className="flex items-center gap-3 p-4 border-b bg-muted/30">
                    <Lock className="h-5 w-5 text-primary" />
                    <h2 className="font-semibold">Security</h2>
                </div>
                <div className="p-6 space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                        <div>
                            <label className="block text-sm font-medium text-muted-foreground mb-1">Current Password</label>
                            <input type="password" className="w-full border rounded-md p-2 text-sm bg-background focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-muted-foreground mb-1">New Password</label>
                            <input type="password" className="w-full border rounded-md p-2 text-sm bg-background focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end pb-6">
                <button
                    onClick={handleSave}
                    className="flex items-center gap-2 bg-primary text-primary-foreground px-6 py-2 rounded-md font-medium hover:bg-primary/90 shadow transition"
                >
                    {saved ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}
                    {saved ? "Saved!" : "Save Changes"}
                </button>
            </div>
        </div>
    );
}
