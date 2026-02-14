import { useState, useEffect, useMemo } from "react";
import {
    Area,
    AreaChart,
    CartesianGrid,
    Cell,
    Legend,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";
import { Download, FileText } from "lucide-react";
import { violationsAPI, type Violation } from "@/lib/api-client";

const COLORS = ["#ef4444", "#f59e0b", "#3b82f6", "#8b5cf6", "#22c55e", "#ec4899"];

export function ReportsDashboard() {
    const [violations, setViolations] = useState<Violation[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetch = async () => {
            try {
                const { data } = await violationsAPI.getAll();
                setViolations(data || []);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        fetch();
    }, []);

    // Compute trend data: group violations by month
    const trendData = useMemo(() => {
        const months: Record<string, { compliant: number; violations: number }> = {};
        const totalPlots = 100; // Approximate baseline

        violations.forEach(v => {
            const date = new Date(v.detected_at);
            const key = date.toLocaleString('default', { month: 'short' });
            if (!months[key]) months[key] = { compliant: totalPlots, violations: 0 };
            months[key].violations++;
            months[key].compliant = totalPlots - months[key].violations;
        });

        return Object.entries(months)
            .map(([month, data]) => ({
                month,
                compliant: Math.round((data.compliant / totalPlots) * 100),
                violations: Math.round((data.violations / totalPlots) * 100),
            }));
    }, [violations]);

    // Compute violation type distribution
    const violationTypeData = useMemo(() => {
        const types: Record<string, number> = {};
        violations.forEach(v => {
            const type = v.type || "Unknown";
            types[type] = (types[type] || 0) + 1;
        });
        return Object.entries(types).map(([name, value]) => ({ name, value }));
    }, [violations]);

    return (
        <div className="p-6 space-y-6 flex flex-col h-full overflow-auto">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Compliance & Analytics</h1>
                    <p className="text-muted-foreground">
                        {loading ? "Loading data..." : `Analyzing ${violations.length} violations across all plots.`}
                    </p>
                </div>
                <button className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90">
                    <Download className="h-4 w-4" />
                    Export Audit Report
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Trend Chart */}
                <div className="p-6 rounded-xl border bg-card text-card-foreground shadow-sm">
                    <h3 className="text-lg font-semibold mb-6">Compliance Trends</h3>
                    <div className="h-[300px] w-full">
                        {trendData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={trendData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorCompliant" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#22c55e" stopOpacity={0.8} />
                                            <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="colorViolations" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8} />
                                            <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <XAxis dataKey="month" />
                                    <YAxis />
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <Tooltip
                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    />
                                    <Area type="monotone" dataKey="compliant" stroke="#22c55e" fillOpacity={1} fill="url(#colorCompliant)" name="Compliant %" />
                                    <Area type="monotone" dataKey="violations" stroke="#ef4444" fillOpacity={1} fill="url(#colorViolations)" name="Violation Rate %" />
                                </AreaChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex items-center justify-center h-full text-muted-foreground">
                                <p>No violation data available to analyze trends.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Distribution Chart */}
                <div className="p-6 rounded-xl border bg-card text-card-foreground shadow-sm">
                    <h3 className="text-lg font-semibold mb-6">Violation Type Distribution</h3>
                    <div className="h-[300px] w-full flex items-center justify-center">
                        {violationTypeData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={violationTypeData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={100}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {violationTypeData.map((_entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <p className="text-muted-foreground">No violation type data</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Recent Violations as "Reports" */}
            <div className="rounded-xl border bg-card text-card-foreground shadow-sm flex-1">
                <div className="p-6 border-b">
                    <h3 className="font-semibold">Recent Violation Reports</h3>
                </div>
                <div className="p-0">
                    {violations.length === 0 ? (
                        <div className="p-6 text-center text-muted-foreground">No reports generated yet.</div>
                    ) : (
                        violations.slice(0, 5).map(v => (
                            <ReportItem
                                key={v.id}
                                name={`${v.type} — Plot ${v.plot_id.substring(0, 12)}`}
                                date={new Date(v.detected_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: '2-digit' })}
                                severity={v.severity}
                            />
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}

function ReportItem({ name, date, severity }: { name: string; date: string; severity: string }) {
    const severityColors: Record<string, string> = {
        High: "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-300",
        Medium: "bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300",
        Low: "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-300",
    };

    return (
        <div className="flex items-center justify-between p-4 border-b last:border-0 hover:bg-muted/50 transition">
            <div className="flex items-center gap-4">
                <div className="p-2 bg-blue-100 text-blue-700 rounded dark:bg-blue-900/20 dark:text-blue-200">
                    <FileText className="h-5 w-5" />
                </div>
                <div>
                    <p className="text-sm font-medium">{name}</p>
                    <p className="text-xs text-muted-foreground">Detected on {date}</p>
                </div>
            </div>
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${severityColors[severity] || 'bg-gray-100'}`}>
                {severity}
            </span>
        </div>
    );
}
