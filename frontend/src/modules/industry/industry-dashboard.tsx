import { Building2, CheckCircle, AlertTriangle, FileText, Gavel, LayoutDashboard, Zap, AlertCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { IndustryDisputeForm } from "./dispute-form";
import { useNavigate } from "react-router-dom";
import { allotmentsAPI, violationsAPI, type Violation } from "@/lib/api-client";
import { useAuthStore } from "@/lib/store";
import { MyViolations } from "./my-violations";
import { BillsUpload } from "./bills-upload";
import { MapComponent } from "../gis/map-component";

interface MyAllotment {
    id: string;
    plot_id: string;
    status: string;
    allotment_date?: string;
    production_deadline?: string;
    production_status?: string;
    lease_amount?: number;
    plot?: {
        location_name?: string;
        district?: string;
        area_sqm?: number;
    };
}

export function IndustryDashboard() {
    const navigate = useNavigate();
    const [showDisputeForm, setShowDisputeForm] = useState(false);
    const user = useAuthStore((state) => state.user);
    const [allotments, setAllotments] = useState<MyAllotment[]>([]);
    const [myViolations, setMyViolations] = useState<Violation[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("overview");

    useEffect(() => {
        if (!user) return;
        const fetchData = async () => {
            try {
                const [allotRes, violRes] = await Promise.all([
                    allotmentsAPI.getMy(),
                    violationsAPI.getAll(),
                ]);
                const myAllotments = allotRes.data || [];
                setAllotments(myAllotments.filter((a: MyAllotment) => a.status === 'APPROVED'));

                // Count violations for user's plots
                const myPlotIds = new Set(myAllotments.map((a: MyAllotment) => a.plot_id));
                const violations = (violRes.data || []).filter((v: any) => myPlotIds.has(v.plot_id));
                setMyViolations(violations);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [user]);

    // Hydration check
    if (!user) {
        return (
            <div className="flex h-screen items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Loading industry portal...</p>
                </div>
            </div>
        );
    }



    const totalLeaseDues = allotments.reduce((sum, a) => sum + (a.lease_amount || 0), 0);

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-background">
            {/* Industry Portal Header */}
            <header className="bg-primary text-primary-foreground py-4 px-6 shadow-md">
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <Building2 className="h-6 w-6" />
                        <h1 className="text-xl font-bold">CSIDC Industry Portal</h1>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                        <span>{user?.name || "Industry User"}</span>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
                {/* Navigation Tabs */}
                <div className="flex gap-4 mb-6 border-b pb-1 overflow-x-auto">
                    <button
                        onClick={() => setActiveTab("overview")}
                        className={`flex items-center gap-2 pb-3 px-1 text-sm font-medium transition border-b-2 ${activeTab === "overview" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
                    >
                        <LayoutDashboard className="h-4 w-4" /> Overview
                    </button>
                    <button
                        onClick={() => setActiveTab("violations")}
                        className={`flex items-center gap-2 pb-3 px-1 text-sm font-medium transition border-b-2 ${activeTab === "violations" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
                    >
                        <AlertCircle className="h-4 w-4" /> My Violations
                        {myViolations.length > 0 && (
                            <span className="bg-destructive text-destructive-foreground text-[10px] px-1.5 py-0.5 rounded-full">{myViolations.length}</span>
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab("bills")}
                        className={`flex items-center gap-2 pb-3 px-1 text-sm font-medium transition border-b-2 ${activeTab === "bills" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
                    >
                        <Zap className="h-4 w-4" /> Electricity Bills
                    </button>
                </div>

                {/* TAB CONTENT: OVERVIEW */}
                {activeTab === "overview" && (
                    <>
                        {/* Actions Bar */}
                        <div className="flex justify-end mb-6">
                            <button
                                onClick={() => setShowDisputeForm(true)}
                                className="flex items-center gap-2 bg-destructive text-destructive-foreground px-4 py-2 rounded-md hover:bg-destructive/90 shadow-sm font-medium transition"
                            >
                                <Gavel className="h-4 w-4" />
                                Raise Violation Dispute
                            </button>
                            <button
                                onClick={() => navigate("/allotment/new")}
                                className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 shadow-sm font-medium transition ml-4"
                            >
                                <Building2 className="h-4 w-4" />
                                New Land Application
                            </button>
                        </div>
                        {/* Overview Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                            <div className="bg-card border rounded-xl p-6 shadow-sm">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-green-100 text-green-700 rounded-full dark:bg-green-900/30 dark:text-green-300">
                                        <CheckCircle className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Compliance Status</p>
                                        <h3 className="text-2xl font-bold text-green-600">
                                            {myViolations.length === 0 ? "Compliant" : "Action Required"}
                                        </h3>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-card border rounded-xl p-6 shadow-sm">
                                <div className="flex items-center gap-4">
                                    <div className={`p-3 rounded-full ${myViolations.length > 0 ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'}`}>
                                        <AlertTriangle className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Pending Notices</p>
                                        <h3 className="text-2xl font-bold">{myViolations.length} Active</h3>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-card border rounded-xl p-6 shadow-sm">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-blue-100 text-blue-700 rounded-full dark:bg-blue-900/30 dark:text-blue-300">
                                        <FileText className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Lease Dues</p>
                                        <h3 className="text-2xl font-bold">₹{totalLeaseDues.toLocaleString()}</h3>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* My Plots Section */}
                        <div className="bg-card border rounded-xl shadow-sm overflow-hidden mb-8">
                            <div className="px-6 py-4 border-b bg-muted/30">
                                <h2 className="font-semibold text-lg">My Allotted Plots</h2>
                            </div>
                            <div className="p-0">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-muted/50 text-muted-foreground">
                                        <tr>
                                            <th className="px-6 py-3 font-medium">Plot ID</th>
                                            <th className="px-6 py-3 font-medium">Location</th>
                                            <th className="px-6 py-3 font-medium">Area (sqm)</th>
                                            <th className="px-6 py-3 font-medium">Allotment Date</th>
                                            <th className="px-6 py-3 font-medium">Status</th>
                                            <th className="px-6 py-3 font-medium text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {loading ? (
                                            <tr><td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">Loading your allotments...</td></tr>
                                        ) : allotments.length === 0 ? (
                                            <tr><td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">No allotted plots yet. Apply for a new land allotment.</td></tr>
                                        ) : (
                                            allotments.map(a => (
                                                <tr key={a.id} className="hover:bg-muted/50 transition">
                                                    <td className="px-6 py-4 font-medium font-mono">{a.plot_id.substring(0, 12)}</td>
                                                    <td className="px-6 py-4">{a.plot?.location_name || "—"}, {a.plot?.district || ""}</td>
                                                    <td className="px-6 py-4">{a.plot?.area_sqm ? Math.round(a.plot.area_sqm).toLocaleString() : "—"}</td>
                                                    <td className="px-6 py-4">{a.allotment_date ? new Date(a.allotment_date).toLocaleDateString() : "—"}</td>
                                                    <td className="px-6 py-4">
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                                                            {a.production_status || "Active"}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <button
                                                            onClick={() => navigate("/map")}
                                                            className="text-primary hover:underline font-medium"
                                                        >
                                                            View Map
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Available Land Map Section */}
                        <div className="bg-card border rounded-xl shadow-sm overflow-hidden mb-8">
                            <div className="px-6 py-4 border-b bg-muted/30 flex justify-between items-center">
                                <h2 className="font-semibold text-lg">Available Industrial Land</h2>
                                <span className="text-xs text-muted-foreground bg-background px-2 py-1 rounded border">Showing Green (Available) Plots Only</span>
                            </div>
                            <div className="h-[400px] w-full">
                                <MapComponent
                                    filterStatus="AVAILABLE"
                                    minimal={true}
                                    initialZoom={13}
                                />
                            </div>
                        </div>
                    </>
                )}

                {/* TAB CONTENT: MY VIOLATIONS */}
                {activeTab === "violations" && (
                    <MyViolations violations={myViolations} />
                )}

                {/* TAB CONTENT: BILLS */}
                {activeTab === "bills" && (
                    <BillsUpload allotments={allotments} />
                )}

            </main>
            {/* Dispute Modal */}
            {showDisputeForm && (
                <IndustryDisputeForm onClose={() => setShowDisputeForm(false)} />
            )}
        </div>
    );
}
