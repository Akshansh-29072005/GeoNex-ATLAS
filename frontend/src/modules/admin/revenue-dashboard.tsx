import { useState, useEffect, useMemo } from "react";
import { allotmentsAPI } from "@/lib/api-client";
import type { Allotment } from "./allotment-applications";
import { BadgeIndianRupee, TrendingUp, Wallet, PieChart as PieChartIcon } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell, Legend } from 'recharts';
import { LeaseRecordsTable } from "./lease-records-table";

const COLORS = ["#6366f1", "#22c55e", "#f59e0b", "#ef4444", "#3b82f6", "#ec4899", "#14b8a6", "#8b5cf6", "#f97316", "#06b6d4", "#84cc16", "#e11d48"];

export function RevenueDashboard() {
    const [allotments, setAllotments] = useState<Allotment[]>([]);

    useEffect(() => {
        const fetch = async () => {
            try {
                const { data } = await allotmentsAPI.getAll();
                setAllotments(data.filter((a: Allotment) => a.status === 'APPROVED'));
            } catch (e) {
                console.error(e);
            }
        };
        fetch();
    }, []);

    const totalRevenue = allotments.reduce((sum, a) => sum + (a.revenue_generated || 0), 0);
    const totalLeaseDues = allotments.reduce((sum, a) => sum + (a.lease_amount || 0), 0);

    // Build monthly chart data from allotments
    const chartData = useMemo(() => {
        const months: Record<string, number> = {};
        allotments.forEach(a => {
            const date = a.allotment_date ? new Date(a.allotment_date) : new Date(a.created_at || Date.now());
            const key = date.toLocaleString('default', { month: 'short', year: '2-digit' });
            months[key] = (months[key] || 0) + (a.revenue_generated || a.lease_amount || 0);
        });
        return Object.entries(months).map(([name, revenue]) => ({ name, revenue }));
    }, [allotments]);

    // District distribution for pie chart
    const districtData = useMemo(() => {
        const districts: Record<string, number> = {};
        allotments.forEach(a => {
            const district = a.plot?.district || a.district || "Unknown";
            districts[district] = (districts[district] || 0) + 1;
        });
        return Object.entries(districts).map(([name, value]) => ({ name, value }));
    }, [allotments]);

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl border bg-card shadow-sm bg-primary/5 border-primary/20">
                    <div className="flex items-center gap-2 text-primary mb-2">
                        <Wallet className="h-4 w-4" />
                        <span className="text-sm font-medium">Total Revenue</span>
                    </div>
                    <div className="text-3xl font-bold">₹{totalRevenue.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground mt-1">From {allotments.length} approved allotments</p>
                </div>
                <div className="p-4 rounded-xl border bg-card shadow-sm">
                    <div className="flex items-center gap-2 text-muted-foreground mb-2">
                        <TrendingUp className="h-4 w-4" />
                        <span className="text-sm font-medium">Total Lease Dues</span>
                    </div>
                    <div className="text-2xl font-bold">₹{totalLeaseDues.toLocaleString()}</div>
                </div>
                <div className="p-4 rounded-xl border bg-card shadow-sm">
                    <div className="flex items-center gap-2 text-muted-foreground mb-2">
                        <BadgeIndianRupee className="h-4 w-4" />
                        <span className="text-sm font-medium">Avg. Revenue / Allotment</span>
                    </div>
                    <div className="text-2xl font-bold">
                        ₹{allotments.length ? Math.round(totalRevenue / allotments.length).toLocaleString() : 0}
                    </div>
                </div>
                <div className="p-4 rounded-xl border bg-card shadow-sm">
                    <div className="flex items-center gap-2 text-muted-foreground mb-2">
                        <PieChartIcon className="h-4 w-4" />
                        <span className="text-sm font-medium">Districts Covered</span>
                    </div>
                    <div className="text-2xl font-bold">{districtData.length}</div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 rounded-lg border bg-card p-6">
                    <h3 className="font-semibold mb-6">Revenue by Allotment Period</h3>
                    <div className="h-[300px] w-full">
                        {chartData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis
                                        fontSize={12}
                                        tickLine={false}
                                        axisLine={false}
                                        tickFormatter={(value) => `₹${value}`}
                                    />
                                    <Tooltip
                                        cursor={{ fill: 'transparent' }}
                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                        formatter={(value: any) => [`₹${Number(value).toLocaleString()}`, 'Revenue']}
                                    />
                                    <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} barSize={40} />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex items-center justify-center h-full text-muted-foreground">
                                <p>No revenue data available yet. Approve allotments to see trends.</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="rounded-lg border bg-card p-6">
                    <h3 className="font-semibold mb-6">Allotments by District</h3>
                    <div className="h-[300px] w-full">
                        {districtData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={districtData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={50}
                                        outerRadius={85}
                                        paddingAngle={4}
                                        dataKey="value"
                                    >
                                        {districtData.map((_entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex items-center justify-center h-full text-muted-foreground">
                                <p>No district data</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <LeaseRecordsTable allotments={allotments} />
        </div>
    );
}
