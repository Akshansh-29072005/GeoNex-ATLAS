import { useState, useEffect } from "react";
import { allotmentsAPI } from "@/lib/api-client";
import type { Allotment } from "./allotment-applications";
import { AlertTriangle, CheckCircle, Clock, Factory } from "lucide-react";

export function ProductionDashboard() {
    const [allotments, setAllotments] = useState<Allotment[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetch = async () => {
            try {
                const { data } = await allotmentsAPI.getAll();
                // Filter only Approved allotments
                setAllotments(data.filter((a: Allotment) => a.status === 'APPROVED'));
                setLoading(false);
            } catch (e) {
                console.error(e);
                setLoading(false);
            }
        };
        fetch();
    }, []);

    const getDaysRemaining = (deadline?: string) => {
        if (!deadline) return 0;
        const diff = new Date(deadline).getTime() - new Date().getTime();
        return Math.ceil(diff / (1000 * 3600 * 24));
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl border bg-card shadow-sm">
                    <div className="flex items-center gap-2 text-muted-foreground mb-2">
                        <Factory className="h-4 w-4" />
                        <span className="text-sm font-medium">Active Industries</span>
                    </div>
                    <div className="text-2xl font-bold">{allotments.length}</div>
                </div>
                <div className="p-4 rounded-xl border bg-card shadow-sm">
                    <div className="flex items-center gap-2 text-green-600 mb-2">
                        <CheckCircle className="h-4 w-4" />
                        <span className="text-sm font-medium">Operational</span>
                    </div>
                    <div className="text-2xl font-bold">
                        {allotments.filter(a => a.production_status === 'OPERATIONAL').length}
                    </div>
                </div>
                <div className="p-4 rounded-xl border bg-card shadow-sm">
                    <div className="flex items-center gap-2 text-amber-600 mb-2">
                        <Clock className="h-4 w-4" />
                        <span className="text-sm font-medium">Deadline Approaching</span>
                    </div>
                    <div className="text-2xl font-bold">
                        {allotments.filter(a => {
                            const days = getDaysRemaining(a.production_deadline);
                            return days > 0 && days < 180 && a.production_status !== 'OPERATIONAL';
                        }).length}
                    </div>
                </div>
            </div>

            <div className="rounded-lg border bg-card">
                <div className="p-4 border-b bg-muted/40">
                    <h3 className="font-semibold">Production Compliance Status</h3>
                    <p className="text-xs text-muted-foreground">Monitoring 2-year production deadline compliance</p>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-muted/50 text-left">
                            <tr>
                                <th className="p-3">Plot ID</th>
                                <th className="p-3">Allotment Date</th>
                                <th className="p-3">Deadline</th>
                                <th className="p-3">Status</th>
                                <th className="p-3">Compliance</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {loading ? (
                                <tr><td colSpan={5} className="p-4 text-center">Loading...</td></tr>
                            ) : allotments.length === 0 ? (
                                <tr><td colSpan={5} className="p-4 text-center text-muted-foreground">No active allotments found.</td></tr>
                            ) : (
                                allotments.map(a => {
                                    const daysLeft = getDaysRemaining(a.production_deadline);
                                    const isLate = daysLeft < 0 && a.production_status !== 'OPERATIONAL';

                                    return (
                                        <tr key={a.id} className="hover:bg-muted/20">
                                            <td className="p-3 font-medium">{a.plot_id}</td>
                                            <td className="p-3">{a.allotment_date ? new Date(a.allotment_date).toLocaleDateString() : '-'}</td>
                                            <td className="p-3 font-mono">{a.production_deadline ? new Date(a.production_deadline).toLocaleDateString() : '-'}</td>
                                            <td className="p-3">
                                                <span className={`px-2 py-0.5 rounded-full text-xs border ${a.production_status === 'OPERATIONAL' ? 'bg-green-100 border-green-200 text-green-700' :
                                                    a.production_status === 'CONSTRUCTION' ? 'bg-blue-100 border-blue-200 text-blue-700' :
                                                        'bg-gray-100 border-gray-200 text-gray-700'
                                                    }`}>
                                                    {a.production_status || 'NOT_STARTED'}
                                                </span>
                                            </td>
                                            <td className="p-3">
                                                {a.production_status === 'OPERATIONAL' ? (
                                                    <span className="flex items-center gap-1 text-green-600 font-medium text-xs">
                                                        <CheckCircle className="h-3 w-3" /> Compliant
                                                    </span>
                                                ) : isLate ? (
                                                    <span className="flex items-center gap-1 text-red-600 font-medium text-xs">
                                                        <AlertTriangle className="h-3 w-3" /> Non-Compliant ({Math.abs(daysLeft)} days overdue)
                                                    </span>
                                                ) : (
                                                    <span className="text-muted-foreground text-xs">
                                                        {daysLeft} days remaining
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
