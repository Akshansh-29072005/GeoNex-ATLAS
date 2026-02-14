import { useState } from "react";
import { AdminUserManagement } from "./user-management";
import { AllotmentApplications } from "./allotment-applications";
import { ViolationsList } from "@/modules/violations/violations-list";
import { ProductionDashboard } from "./production-dashboard";
import { RevenueDashboard } from "./revenue-dashboard";

export function AdminDashboard() {
    const [activeTab, setActiveTab] = useState<"users" | "allotments" | "violations" | "production" | "revenue">("users");

    return (
        <div className="h-full flex flex-col p-6 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Admin Control Panel</h1>
                    <p className="text-muted-foreground mt-1">
                        Manage users, land applications, and compliance oversight.
                    </p>
                </div>
            </div>

            {/* Tabs */}
            <div className="border-b flex gap-6">
                <button
                    onClick={() => setActiveTab("users")}
                    className={`pb-3 text-sm font-medium border-b-2 transition-colors ${activeTab === "users" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
                        }`}
                >
                    User Management
                </button>
                <button
                    onClick={() => setActiveTab("allotments")}
                    className={`pb-3 text-sm font-medium border-b-2 transition-colors ${activeTab === "allotments" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
                        }`}
                >
                    Land Applications
                </button>
                <button
                    onClick={() => setActiveTab("violations")}
                    className={`pb-3 text-sm font-medium border-b-2 transition-colors ${activeTab === "violations" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
                        }`}
                >
                    Violations Oversight
                </button>
                <button
                    onClick={() => setActiveTab("production")}
                    className={`pb-3 text-sm font-medium border-b-2 transition-colors ${activeTab === "production" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
                        }`}
                >
                    Production Monitoring
                </button>
                <button
                    onClick={() => setActiveTab("revenue")}
                    className={`pb-3 text-sm font-medium border-b-2 transition-colors ${activeTab === "revenue" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
                        }`}
                >
                    Revenue & Finance
                </button>
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-hidden">
                {activeTab === "users" && <AdminUserManagement />}
                {activeTab === "allotments" && <AllotmentApplications />}
                {activeTab === "violations" && <ViolationsList />}
                {activeTab === "production" && <ProductionDashboard />}
                {activeTab === "revenue" && <RevenueDashboard />}
            </div>
        </div>
    );
}
