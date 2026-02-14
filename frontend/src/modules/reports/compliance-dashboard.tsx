import { useEffect, useState } from "react";
import {
    CheckCircle2,
    AlertTriangle,
    XCircle,
    FileText,
    Search,
    Download,
    Filter,
} from "lucide-react";
import {
    PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer
} from "recharts";
import { reportsAPI, type ComplianceStats, type ComplianceItem } from "@/lib/api-client";
import { cn } from "@/lib/utils";

export function ComplianceDashboard() {
    const [stats, setStats] = useState<ComplianceStats | null>(null);
    const [checklist, setChecklist] = useState<ComplianceItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<"All" | "Compliant" | "Near Deadline" | "Overdue">("All");
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [statsRes, listRes] = await Promise.all([
                    reportsAPI.getStats(),
                    reportsAPI.getChecklist()
                ]);
                setStats(statsRes.data);
                setChecklist(listRes.data);
            } catch (error) {
                console.error("Failed to fetch compliance data", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const filteredList = checklist.filter((item) => {
        const matchesFilter = filter === "All" || item.status === filter;
        const matchesSearch =
            item.plot_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.owner_name.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesFilter && matchesSearch;
    });

    if (loading) {
        return <div className="p-8 text-center">Loading Compliance Data...</div>;
    }

    return (
        <div className="p-6 space-y-8 h-full overflow-auto bg-background text-foreground">
            {/* Header */}
            <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 text-primary">
                    <FileText className="h-6 w-6" />
                    <h1 className="text-2xl font-bold tracking-tight">Compliance Checklist</h1>
                </div>
                <p className="text-muted-foreground">
                    Polygon overlay analysis for boundary violations and regulatory compliance.
                </p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    label="Total Compliance Checks"
                    value={stats?.total_checks || 0}
                    color="text-blue-500"
                    bgColor="bg-blue-500/10"
                />
                <StatCard
                    label="Compliant Units"
                    value={stats?.compliant_units || 0}
                    icon={<CheckCircle2 className="h-5 w-5 text-green-500" />}
                    color="text-green-500"
                    bgColor="bg-green-500/10"
                />
                <StatCard
                    label="Near Deadline Checks"
                    value={stats?.near_deadline || 0}
                    icon={<AlertTriangle className="h-5 w-5 text-amber-500" />}
                    color="text-amber-500"
                    bgColor="bg-amber-500/10"
                />
                <StatCard
                    label="Overdue Checks"
                    value={stats?.overdue_checks || 0}
                    icon={<XCircle className="h-5 w-5 text-red-500" />}
                    color="text-red-500"
                    bgColor="bg-red-500/10"
                />
            </div>

            {/* Violation Distribution Chart */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="p-6 rounded-xl border bg-card shadow-sm flex flex-col">
                    <h3 className="text-lg font-semibold mb-4">Violation Type Distribution</h3>
                    <div className="h-[300px] w-full flex-1 min-h-0">
                        {stats?.violation_by_type && Object.keys(stats.violation_by_type).length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={Object.entries(stats.violation_by_type).map(([name, value]) => ({ name, value }))}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={100}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {Object.entries(stats.violation_by_type).map((_, index) => (
                                            <Cell key={`cell-${index}`} fill={["#ef4444", "#f59e0b", "#3b82f6", "#8b5cf6"][index % 4]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex h-full items-center justify-center text-muted-foreground">
                                No violation data available.
                            </div>
                        )}
                    </div>
                </div>

                {/* Placeholder for future chart (e.g. Monthly Trend) */}
                <div className="p-6 rounded-xl border bg-card shadow-sm flex flex-col justify-center items-center text-muted-foreground">
                    <p>Additional Analytics (Compliance Trend) can go here.</p>
                </div>
            </div>

            {/* Table Controls */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                {/* Tabs */}
                <div className="flex p-1 bg-muted rounded-lg">
                    {(["All", "Compliant", "Near Deadline", "Overdue"] as const).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setFilter(tab)}
                            className={cn(
                                "px-4 py-1.5 text-sm font-medium rounded-md transition-all",
                                filter === tab
                                    ? "bg-background text-foreground shadow-sm"
                                    : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                {/* Search & Export */}
                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <div className="relative w-full sm:w-64">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Search Plot ID or Company..."
                            className="w-full pl-9 pr-4 py-2 text-sm bg-background border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button className="flex items-center gap-2 px-3 py-2 text-sm font-medium border rounded-md hover:bg-muted">
                        <Filter className="h-4 w-4" />
                        Filter
                    </button>
                    <button className="flex items-center gap-2 px-3 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90">
                        <Download className="h-4 w-4" />
                        Export
                    </button>
                </div>
            </div>

            {/* Checklist Table */}
            <div className="border rounded-xl bg-card shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-muted/50 text-muted-foreground border-b">
                            <tr>
                                <th className="px-6 py-3 font-medium">Plot ID</th>
                                <th className="px-6 py-3 font-medium">Company</th>
                                <th className="px-6 py-3 font-medium">Risk Factor</th>
                                <th className="px-6 py-3 font-medium">Compliance</th>
                                <th className="px-6 py-3 font-medium">Details</th>
                                <th className="px-6 py-3 font-medium">Source</th>
                                <th className="px-6 py-3 font-medium">Deadline</th>
                                <th className="px-6 py-3 font-medium">Status</th>
                                <th className="px-6 py-3 font-medium">Time Left</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {filteredList.length === 0 ? (
                                <tr>
                                    <td colSpan={9} className="px-6 py-8 text-center text-muted-foreground">
                                        No compliance records found.
                                    </td>
                                </tr>
                            ) : (
                                filteredList.map((item) => (
                                    <tr key={item.plot_id} className="hover:bg-muted/50 transition-colors">
                                        <td className="px-6 py-4 font-medium font-mono">{item.plot_id.substring(0, 8)}...</td>
                                        <td className="px-6 py-4">
                                            <div className="font-medium">{item.owner_name}</div>
                                            <div className="text-xs text-muted-foreground">Manufacturing</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <RiskBadge level={item.risk_factor} />
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                                                    <div
                                                        className={cn(
                                                            "h-full rounded-full",
                                                            item.compliance_score >= 80 ? "bg-green-500" :
                                                                item.compliance_score >= 50 ? "bg-amber-500" : "bg-red-500"
                                                        )}
                                                        style={{ width: `${item.compliance_score}%` }}
                                                    />
                                                </div>
                                                <span className="text-xs font-medium">{item.compliance_score}%</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {item.violation_type ? (
                                                <div className="group relative cursor-help">
                                                    <div className="font-medium text-destructive">{item.violation_type}</div>
                                                    <div className="text-xs text-muted-foreground truncate max-w-[150px]">
                                                        {item.violation_desc}
                                                    </div>
                                                    {/* Tooltip */}
                                                    <div className="absolute z-10 hidden group-hover:block w-64 p-2 bg-popover text-popover-foreground text-xs rounded shadow-lg border -top-8 left-0">
                                                        {item.violation_desc}
                                                    </div>
                                                </div>
                                            ) : (
                                                <span className="text-muted-foreground text-xs">—</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-xs font-mono text-muted-foreground">
                                            {item.reported_by || "System"}
                                        </td>
                                        <td className="px-6 py-4 text-muted-foreground">
                                            {item.deadline}
                                        </td>
                                        <td className="px-6 py-4">
                                            <StatusBadge status={item.status} />
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={cn(
                                                "text-xs font-medium",
                                                item.days_left < 0 ? "text-red-600" :
                                                    item.days_left < 30 ? "text-amber-600" : "text-green-600"
                                            )}>
                                                {item.days_left < 0
                                                    ? `${Math.abs(item.days_left)} days overdue`
                                                    : `${item.days_left} days left`}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
                <div className="px-6 py-4 border-t bg-muted/20 text-xs text-muted-foreground flex justify-between">
                    <span>Showing {filteredList.length} of {checklist.length} compliance checks</span>
                    <div className="flex gap-2">
                        <button className="px-2 py-1 border rounded hover:bg-background">Previous</button>
                        <button className="px-2 py-1 bg-primary text-primary-foreground rounded">1</button>
                        <button className="px-2 py-1 border rounded hover:bg-background">2</button>
                        <button className="px-2 py-1 border rounded hover:bg-background">Next</button>
                    </div>
                </div>
            </div>
        </div>
    );
}

function StatCard({ label, value, icon, color, bgColor }: any) {
    return (
        <div className="p-6 rounded-xl border bg-card shadow-sm flex flex-col items-center justify-center text-center gap-2">
            <div className={cn("mb-2", color)}>{icon || <span className="text-2xl font-bold">{value}</span>}</div>
            {!icon && <div className="text-sm font-medium text-muted-foreground">{label}</div>}

            {icon && (
                <>
                    <div className="text-2xl font-bold">{value}</div>
                    <div className="text-sm text-muted-foreground">{label}</div>
                </>
            )}
        </div>
    );
}

function RiskBadge({ level }: { level: string }) {
    const styles: Record<string, string> = {
        High: "bg-red-100 text-red-700 border-red-200",
        Medium: "bg-amber-100 text-amber-700 border-amber-200",
        Low: "bg-green-100 text-green-700 border-green-200",
        Compliance: "bg-blue-100 text-blue-700 border-blue-200"
    };

    return (
        <span className={cn(
            "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border",
            styles[level] || "bg-gray-100 text-gray-700"
        )}>
            {level === "High" && <AlertTriangle className="h-3 w-3" />}
            {level === "Compliance" && <CheckCircle2 className="h-3 w-3" />}
            {level}
        </span>
    );
}

function StatusBadge({ status }: { status: string }) {
    const styles: Record<string, string> = {
        Compliant: "bg-green-100 text-green-700 border-green-200",
        "Near Deadline": "bg-amber-100 text-amber-700 border-amber-200",
        Overdue: "bg-red-100 text-red-700 border-red-200",
        "Non-Compliant": "bg-red-100 text-red-700 border-red-200"
    };

    return (
        <span className={cn(
            "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border",
            styles[status] || "bg-gray-100 text-gray-700"
        )}>
            {status}
        </span>
    );
}
