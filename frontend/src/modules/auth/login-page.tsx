import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Lock, Mail, Phone, Loader2, UserCircle, KeyRound } from "lucide-react";
import { authAPI } from "@/lib/api-client";
import { useAuthStore } from "@/lib/store";

type LoginMode = "email" | "phone";
type UserType = "official" | "industry" | "admin";

export function LoginPage() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [loginMode, setLoginMode] = useState<LoginMode>("email");
    const [userType, setUserType] = useState<UserType>("official");
    const [error, setError] = useState("");

    // OTP State
    const [otpSent, setOtpSent] = useState(false);
    const [otp, setOtp] = useState("");

    const login = useAuthStore((s) => s.login);

    const [formData, setFormData] = useState({
        email: "",
        phone: "",
        password: "",
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            if (!otpSent) {
                // Step 1: Login Request
                const payload = loginMode === "email"
                    ? { email: formData.email, password: formData.password }
                    : { phone: formData.phone, password: formData.password };

                const res = await authAPI.login(payload);

                if (res.otp_required) {
                    setOtpSent(true);
                    setLoading(false);
                    return;
                }

                // Fallback for no-OTP flow (if ever needed)
                completeLogin(res);
            } else {
                // Step 2: Verify OTP
                const payload = loginMode === "email"
                    ? { email: formData.email, otp }
                    : { phone: formData.phone, otp };

                const res = await authAPI.verifyOTP(payload);
                completeLogin(res);
            }
        } catch (err: any) {
            setError(err.response?.data?.error || "Authentication failed. Please check credentials.");
            setLoading(false);
        }
    };

    const completeLogin = (data: any) => {
        const { token, user } = data;
        console.log("Login successful, user:", user);

        login({
            id: user.id,
            name: user.name,
            email: user.email || "",
            role: user.role, // Backend returns SUPER_ADMIN, ADMIN, INSPECTOR, INDUSTRY_OWNER
            token: token,
        });

        // Small delay to ensure state is persisted before navigation
        setTimeout(() => {
            // Verify state is actually updated
            const currentUser = useAuthStore.getState().user;
            if (!currentUser) {
                console.warn("[Login] User state not ready yet, retrying...");
                setTimeout(() => completeLogin(data), 100); // Retry
                return;
            }

            // Route based on role
            if (user.role === "INDUSTRY_OWNER") {
                navigate("/industry");
            } else if (["SUPER_ADMIN", "ADMIN", "INSPECTOR"].includes(user.role)) {
                navigate("/dashboard");
            } else {
                console.error("Unknown role:", user.role);
                setError("Login successful but role is unrecognized.");
            }
        }, 100);
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-background px-4">
            <div className="w-full max-w-md space-y-6 rounded-xl border bg-card p-8 shadow-sm">
                <div className="text-center">
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                        <Lock className="h-6 w-6 text-primary" />
                    </div>
                    <h2 className="text-2xl font-bold tracking-tight text-foreground">
                        CSIDC Compliance Portal
                    </h2>
                    <p className="mt-2 text-sm text-muted-foreground">
                        Secure access for Officials, Industry Owners & Admins
                    </p>
                </div>

                {!otpSent && (
                    <div className="flex gap-2 rounded-lg border p-1">
                        <button
                            type="button"
                            onClick={() => { setUserType("official"); setLoginMode("email"); }}
                            className={`flex-1 rounded-md py-2 text-sm font-medium transition ${userType === "official" ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                                }`}
                        >
                            Official
                        </button>
                        <button
                            type="button"
                            onClick={() => { setUserType("industry"); setLoginMode("phone"); }}
                            className={`flex-1 rounded-md py-2 text-sm font-medium transition ${userType === "industry" ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                                }`}
                        >
                            Industry
                        </button>
                        <button
                            type="button"
                            onClick={() => { setUserType("admin"); setLoginMode("email"); }}
                            className={`flex-1 rounded-md py-2 text-sm font-medium transition ${userType === "admin" ? "bg-destructive text-destructive-foreground" : "hover:bg-muted"
                                }`}
                        >
                            Admin
                        </button>
                    </div>
                )}

                {error && (
                    <div className="bg-destructive/10 text-destructive px-4 py-2 rounded-md text-sm">{error}</div>
                )}

                <form className="space-y-5" onSubmit={handleLogin}>
                    {!otpSent ? (
                        <>
                            {/* Login Mode Tabs */}
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => setLoginMode("email")}
                                    className={`flex items-center gap-1 text-xs rounded-full px-3 py-1 transition ${loginMode === "email" ? "bg-primary/10 text-primary font-semibold" : "text-muted-foreground hover:text-foreground"
                                        }`}
                                >
                                    <Mail className="h-3 w-3" /> Email
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setLoginMode("phone")}
                                    className={`flex items-center gap-1 text-xs rounded-full px-3 py-1 transition ${loginMode === "phone" ? "bg-primary/10 text-primary font-semibold" : "text-muted-foreground hover:text-foreground"
                                        }`}
                                >
                                    <Phone className="h-3 w-3" /> Phone
                                </button>
                            </div>

                            <div className="space-y-4">
                                {loginMode === "email" ? (
                                    <div>
                                        <label htmlFor="email" className="block text-sm font-medium text-muted-foreground">
                                            Email Address
                                        </label>
                                        <div className="relative mt-1">
                                            <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                            <input
                                                id="email"
                                                name="email"
                                                type="email"
                                                value={formData.email}
                                                onChange={handleChange}
                                                autoComplete="email"
                                                required
                                                placeholder={userType === "admin" ? "admin@csidc.gov.in" : userType === "official" ? "officer@csidc.gov.in" : "owner@company.com"}
                                                className="block w-full rounded-md border bg-background px-10 py-2 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                                            />
                                        </div>
                                    </div>
                                ) : (
                                    <div>
                                        <label htmlFor="phone" className="block text-sm font-medium text-muted-foreground">
                                            Phone Number
                                        </label>
                                        <div className="relative mt-1">
                                            <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                            <input
                                                id="phone"
                                                name="phone"
                                                type="tel"
                                                value={formData.phone}
                                                onChange={handleChange}
                                                required
                                                placeholder="+91 98765 43210"
                                                className="block w-full rounded-md border bg-background px-10 py-2 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                                            />
                                        </div>
                                    </div>
                                )}

                                <div>
                                    <label htmlFor="password" className="block text-sm font-medium text-muted-foreground">
                                        Password
                                    </label>
                                    <div className="relative mt-1">
                                        <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                        <input
                                            id="password"
                                            name="password"
                                            type="password"
                                            value={formData.password}
                                            onChange={handleChange}
                                            autoComplete="current-password"
                                            required
                                            className="block w-full rounded-md border bg-background px-10 py-2 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                                        />
                                    </div>
                                </div>
                            </div>
                        </>
                    ) : (
                        // OTP Input Section
                        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="text-center p-4 bg-primary/5 rounded-lg border border-primary/20">
                                <KeyRound className="h-8 w-8 mx-auto text-primary mb-2" />
                                <h3 className="font-semibold text-foreground">Two-Factor Authentication</h3>
                                <p className="text-xs text-muted-foreground mt-1">
                                    We sent a code to your {loginMode === 'email' ? 'email' : 'phone number'}.
                                </p>
                            </div>

                            <div>
                                <label htmlFor="otp" className="block text-sm font-medium text-muted-foreground">
                                    Enter 6-digit OTP
                                </label>
                                <div className="relative mt-1">
                                    <input
                                        id="otp"
                                        name="otp"
                                        type="text"
                                        maxLength={6}
                                        value={otp}
                                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                                        required
                                        className="block w-full rounded-md border bg-background px-4 py-3 text-center text-2xl tracking-widest font-mono placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                                        placeholder="000000"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="flex items-center justify-between">
                        {!otpSent && (
                            <div className="flex items-center">
                                <input
                                    id="remember-me"
                                    name="remember-me"
                                    type="checkbox"
                                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                />
                                <label htmlFor="remember-me" className="ml-2 block text-sm text-muted-foreground">
                                    Remember me
                                </label>
                            </div>
                        )}

                        {!otpSent && (
                            <div className="text-sm">
                                <a href="#" className="font-medium text-primary hover:text-primary/90">
                                    Forgot password?
                                </a>
                            </div>
                        )}
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="group relative flex w-full justify-center rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-70"
                    >
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {otpSent ? "Verify & Login" : "Sign in"}
                    </button>

                    {otpSent && (
                        <button
                            type="button"
                            onClick={() => { setOtpSent(false); setOtp(""); setError(""); }}
                            className="w-full text-xs text-muted-foreground hover:text-foreground text-center"
                        >
                            Back to Login Options
                        </button>
                    )}
                </form>

                <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-card px-2 text-muted-foreground">
                            New user?
                        </span>
                    </div>
                </div>

                <button
                    onClick={() => navigate("/register")}
                    className="w-full rounded-md border bg-background px-4 py-2 text-sm font-semibold hover:bg-accent transition flex items-center justify-center gap-2"
                >
                    <UserCircle className="h-4 w-4" />
                    Create an Account
                </button>
            </div>
        </div>
    );
}
