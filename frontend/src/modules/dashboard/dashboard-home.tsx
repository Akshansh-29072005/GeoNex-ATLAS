import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { MapComponent } from "@/modules/gis/map-component";
import { AlertCircle, CheckCircle2, Factory, TrendingUp } from "lucide-react";
import { plotsAPI, violationsAPI, type Violation } from "@/lib/api-client";
import { cn } from "@/lib/utils";

export function Dashboard() {
    const [stats, setStats] = useState({
        totalPlots: 0,
        activeViolations: 0,
        highSeverity: 0,
        complianceRate: 0,
    });
    const [recentViolations, setRecentViolations] = useState<Violation[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const [plotsRes, violationsRes] = await Promise.all([
                    plotsAPI.getAll(),
                    violationsAPI.getAll(),
                ]);
                const plots = plotsRes.data || [];
                const violations = violationsRes.data || [];
                const activeV = violations.filter((v: Violation) => v.status !== "Resolved" && v.status !== "RESOLVED");
                const highSev = activeV.filter((v: Violation) => v.severity === "High");
                const compRate = plots.length > 0
                    ? ((plots.length - activeV.length) / plots.length) * 100
                    : 100;

                setStats({
                    totalPlots: plots.length,
                    activeViolations: activeV.length,
                    highSeverity: highSev.length,
                    complianceRate: Math.round(compRate * 10) / 10,
                });

                // Sort violations by date descending and take top 5
                const sorted = [...violations].sort(
                    (a, b) => new Date(b.detected_at).getTime() - new Date(a.detected_at).getTime()
                );
                setRecentViolations(sorted.slice(0, 5));
            } catch (error) {
                console.error("Failed to load dashboard stats:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    const getTimeAgo = (dateStr: string) => {
        const diff = Date.now() - new Date(dateStr).getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 60) return `${mins} min ago`;
        const hrs = Math.floor(mins / 60);
        if (hrs < 24) return `${hrs} hrs ago`;
        const days = Math.floor(hrs / 24);
        return `${days} day${days > 1 ? 's' : ''} ago`;
    };

    return (
        <div className="flex h-full flex-col space-y-6">
            {/* Stats Row */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatsCard
                    title="Total Plots"
                    value={loading ? "..." : stats.totalPlots.toLocaleString()}
                    desc="Registered in system"
                    icon={Factory}
                    color="text-blue-500"
                />
                <StatsCard
                    title="Active Violations"
                    value={loading ? "..." : stats.activeViolations.toString()}
                    desc={`${stats.highSeverity} High Severity`}
                    icon={AlertCircle}
                    color="text-red-500"
                    link="/violations"
                />
                <StatsCard
                    title="High Severity"
                    value={loading ? "..." : stats.highSeverity.toString()}
                    desc="Require immediate action"
                    icon={TrendingUp}
                    color="text-yellow-500"
                    link="/violations"
                />
                <StatsCard
                    title="Compliance Rate"
                    value={loading ? "..." : `${stats.complianceRate}%`}
                    desc="Plots without violations"
                    icon={CheckCircle2}
                    color="text-green-500"
                    link="/reports"
                />
            </div>

            {/* Main Content Area */}
            <div className="grid h-[500px] flex-1 grid-cols-1 gap-6 md:grid-cols-3">
                {/* Map Preview */}
                <div className="col-span-2 flex flex-col rounded-xl border bg-card shadow-sm overflow-hidden">
                    <div className="border-b px-6 py-4 flex justify-between items-center">
                        <h3 className="font-semibold">Live Monitoring Map</h3>
                        <span className="text-xs text-muted-foreground">Real-time plot data</span>
                    </div>
                    <div className="flex-1 relative">
                        <MapComponent />
                    </div>
                </div>

                {/* Recent Activity Feed */}
                <div className="col-span-1 rounded-xl border bg-card shadow-sm flex flex-col">
                    <div className="border-b px-6 py-4">
                        <h3 className="font-semibold">Recent Activity</h3>
                    </div>
                    <div className="p-4 space-y-4 flex-1 overflow-auto custom-scrollbar">
                        {loading ? (
                            <p className="text-sm text-muted-foreground text-center py-4">Loading activity...</p>
                        ) : recentViolations.length === 0 ? (
                            <p className="text-sm text-muted-foreground text-center py-4">No recent activity</p>
                        ) : (
                            recentViolations.map((v) => (
                                <ActivityItem
                                    key={v.id}
                                    title={`${v.type} — ${v.plot_id.substring(0, 12)}`}
                                    desc={v.plot?.location_name || v.description.substring(0, 50)}
                                    time={getTimeAgo(v.detected_at)}
                                    type={v.severity === "High" ? "danger" : v.severity === "Medium" ? "warning" : "neutral"}
                                />
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

function StatsCard({ title, value, desc, icon: Icon, color, link }: any) {
    const Content = (
        <div className={cn(
            "rounded-xl border bg-card p-6 shadow-sm transition-all hover:shadow-md",
            link && "cursor-pointer hover:border-primary/50"
        )}>
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium text-muted-foreground">{title}</p>
                    <h4 className="text-2xl font-bold">{value}</h4>
                </div>
                <div className={`p-2 rounded-full bg-muted ${color}`}>
                    <Icon className="h-5 w-5" />
                </div>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">{desc}</p>
        </div>
    );

    if (link) {
        return <Link to={link} className="block">{Content}</Link>;
    }
    return Content;
}

function ActivityItem({ title, desc, time, type }: any) {
    const colors = {
        danger: "bg-red-500",
        success: "bg-green-500",
        warning: "bg-yellow-500",
        neutral: "bg-blue-500"
    }
    return (
        <div className="flex items-start gap-3">
            <div className={`mt-1.5 h-2 w-2 rounded-full ${colors[type as keyof typeof colors]}`} />
            <div>
                <p className="text-sm font-medium">{title}</p>
                <p className="text-xs text-muted-foreground">{desc}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{time}</p>
            </div>
        </div>
    )
}
