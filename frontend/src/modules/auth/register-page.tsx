import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Lock, Mail, Phone, Loader2, User, UserCircle, KeyRound } from "lucide-react";
import { authAPI } from "@/lib/api-client";
import { useAuthStore } from "@/lib/store";

type UserType = "official" | "industry" | "admin";

export function RegisterPage() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [userType, setUserType] = useState<UserType>("official");

    // OTP State
    const [otpSent, setOtpSent] = useState(false);
    const [otp, setOtp] = useState("");

    const login = useAuthStore((s) => s.login);

    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: "",
        password: "",
        confirmPassword: "",
        adminSecret: "",
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();

        if (otpSent) {
            handleVerifyOTP();
            return;
        }

        if (formData.password !== formData.confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        setLoading(true);
        setError("");

        try {
            const role = userType === "official" ? "INSPECTOR" : userType === "industry" ? "INDUSTRY_OWNER" : "ADMIN";
            const payload: any = {
                name: formData.name,
                password: formData.password,
                role,
            };
            if (formData.email) payload.email = formData.email;
            if (formData.phone) payload.phone = formData.phone;
            if (userType === "admin") payload.admin_secret = formData.adminSecret;


            const res = await authAPI.register(payload);

            // Registration always triggers OTP now
            if (res.otp_required) {
                setOtpSent(true);
                setLoading(false);
                return;
            }

            // Fallback if OTP disabled
            completeLogin(res);
        } catch (err: any) {
            setError(err.response?.data?.error || "Registration failed.");
            setLoading(false);
        }
    };

    const handleVerifyOTP = async () => {
        setLoading(true);
        setError("");
        try {
            // Use the Contact info used for registration
            const payload = formData.email
                ? { email: formData.email, otp }
                : { phone: formData.phone, otp };

            const res = await authAPI.verifyOTP(payload);
            completeLogin(res);
        } catch (err: any) {
            setError(err.response?.data?.error || "OTP Verification failed.");
            setLoading(false);
        }
    };

    const completeLogin = (data: any) => {
        const { token, user } = data;
        login({
            id: user.id,
            name: user.name,
            email: user.email || "",
            role: user.role,
            token: token,
        });

        if (user.role === "INDUSTRY_OWNER") {
            navigate("/industry");
        } else {
            navigate("/dashboard");
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-background px-4">
            <div className="w-full max-w-md space-y-6 rounded-xl border bg-card p-8 shadow-sm">
                <div className="text-center">
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                        <UserCircle className="h-6 w-6 text-primary" />
                    </div>
                    <h2 className="text-2xl font-bold tracking-tight text-foreground">
                        {userType === "admin" ? "Admin Access" : "Create Account"}
                    </h2>
                    <p className="mt-2 text-sm text-muted-foreground">
                        Register for the CSIDC Compliance Portal
                    </p>
                </div>

                {!otpSent && (
                    <div className="flex gap-2 rounded-lg border p-1">
                        <button
                            type="button"
                            onClick={() => setUserType("official")}
                            className={`flex-1 rounded-md py-2 text-sm font-medium transition ${userType === "official" ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                                }`}
                        >
                            Official
                        </button>
                        <button
                            type="button"
                            onClick={() => setUserType("industry")}
                            className={`flex-1 rounded-md py-2 text-sm font-medium transition ${userType === "industry" ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                                }`}
                        >
                            Industry
                        </button>
                        <button
                            type="button"
                            onClick={() => setUserType("admin")}
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

                <form className="space-y-4" onSubmit={handleRegister}>
                    {!otpSent ? (
                        <>
                            <div>
                                <label className="block text-sm font-medium text-muted-foreground">Full Name</label>
                                <div className="relative mt-1">
                                    <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                    <input
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        required
                                        placeholder="Rajesh Kumar"
                                        className="block w-full rounded-md border bg-background px-10 py-2 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-muted-foreground">
                                    {userType === "official" || userType === "admin" ? "Official Email" : "Email (Optional)"}
                                </label>
                                <div className="relative mt-1">
                                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                    <input
                                        name="email"
                                        type="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        required={userType === "official" || userType === "admin"}
                                        placeholder={userType === "official" ? "officer@csidc.gov.in" : "owner@company.com"}
                                        className="block w-full rounded-md border bg-background px-10 py-2 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-muted-foreground">
                                    {userType === "industry" ? "Phone Number" : "Phone (Optional)"}
                                </label>
                                <div className="relative mt-1">
                                    <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                    <input
                                        name="phone"
                                        type="tel"
                                        value={formData.phone}
                                        onChange={handleChange}
                                        required={userType === "industry"}
                                        maxLength={15}
                                        placeholder="+91 98765 43210"
                                        className="block w-full rounded-md border bg-background px-10 py-2 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-muted-foreground">Password</label>
                                    <div className="relative mt-1">
                                        <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                        <input
                                            name="password"
                                            type="password"
                                            value={formData.password}
                                            onChange={handleChange}
                                            required
                                            minLength={6}
                                            className="block w-full rounded-md border bg-background px-10 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-muted-foreground">Confirm</label>
                                    <div className="relative mt-1">
                                        <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                        <input
                                            name="confirmPassword"
                                            type="password"
                                            value={formData.confirmPassword}
                                            onChange={handleChange}
                                            required
                                            className="block w-full rounded-md border bg-background px-10 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                                        />
                                    </div>
                                </div>
                            </div>

                            {userType === "admin" && (
                                <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                                    <label className="block text-sm font-medium text-destructive">Admin Secret Key</label>
                                    <div className="relative mt-1">
                                        <KeyRound className="absolute left-3 top-3 h-4 w-4 text-destructive" />
                                        <input
                                            name="adminSecret"
                                            type="password"
                                            value={formData.adminSecret}
                                            onChange={handleChange}
                                            required
                                            placeholder="Enter system secret..."
                                            className="block w-full rounded-md border-destructive/50 bg-destructive/5 px-10 py-2 text-sm placeholder:text-muted-foreground focus:border-destructive focus:outline-none focus:ring-1 focus:ring-destructive"
                                        />
                                    </div>
                                </div>
                            )}
                        </>
                    ) : (
                        // OTP Input Section
                        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="text-center p-4 bg-primary/5 rounded-lg border border-primary/20">
                                <KeyRound className="h-8 w-8 mx-auto text-primary mb-2" />
                                <h3 className="font-semibold text-foreground">Phone Verification</h3>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Enter the 6-digit code sent to your {formData.phone ? 'phone' : 'email'} to complete registration.
                                </p>
                            </div>

                            <div>
                                <label htmlFor="otp" className="block text-sm font-medium text-muted-foreground">
                                    Verification Code
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

                    <button
                        type="submit"
                        disabled={loading}
                        className="group relative flex w-full justify-center rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-70"
                    >
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {otpSent ? "Verify & Complete Registration" : "Create Account"}
                    </button>

                    {otpSent && (
                        <button
                            type="button"
                            onClick={() => { setOtpSent(false); setOtp(""); setError(""); }}
                            className="w-full text-xs text-muted-foreground hover:text-foreground text-center"
                        >
                            Back to Details
                        </button>
                    )}
                </form>

                <div className="text-center pt-2 border-t mt-4">
                    {userType !== "admin" ? (
                        <button
                            type="button"
                            onClick={() => setUserType("admin")}
                            className="text-xs text-muted-foreground hover:text-primary underline"
                        >
                            Register as System Administrator
                        </button>
                    ) : (
                        <button
                            type="button"
                            onClick={() => setUserType("official")}
                            className="text-xs text-muted-foreground hover:text-primary underline"
                        >
                            Back to Standard Registration
                        </button>
                    )}
                </div>

                <p className="text-center text-sm text-muted-foreground">
                    Already have an account?{" "}
                    <button onClick={() => navigate("/login")} className="text-primary font-medium hover:underline">
                        Sign In
                    </button>
                </p>
            </div>
        </div>
    );
}
