"use client";

import { useEffect, useState } from "react";
import { Loader2, ExternalLink } from "lucide-react";

export default function AdminQRsPage() {
    const [qrs, setQrs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchQrs() {
            try {
                const res = await fetch("/api/admin/qrs");
                const json = await res.json();
                if (json.success) setQrs(json.data);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        }
        fetchQrs();
    }, []);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-slate-800">System QR Codes</h2>
                <span className="text-sm text-slate-500">{qrs.length} Generated</span>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                {loading ? (
                    <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-slate-400" /></div>
                ) : (
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 text-slate-500 font-semibold uppercase text-xs">
                            <tr>
                                <th className="px-6 py-4">QR Name</th>
                                <th className="px-6 py-4">Owner</th>
                                <th className="px-6 py-4">Total Scans</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4">Created</th>
                                <th className="px-6 py-4 text-right">Preview</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {qrs.map((qr) => (
                                <tr key={qr._id} className="hover:bg-slate-50/50">
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-slate-900">{qr.qrName}</div>
                                        <div className="text-slate-400 text-xs truncate max-w-[150px]">{qr.originalData}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-slate-900">{qr.userId?.name || "Unknown"}</div>
                                        <div className="text-slate-500 text-xs">{qr.userId?.email}</div>
                                    </td>
                                    <td className="px-6 py-4 font-semibold text-slate-700">
                                        {qr.scanCount}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${qr.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'}`}>
                                            {qr.isActive ? "Active" : "Disabled"}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-slate-500">
                                        {new Date(qr.createdAt).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <a href={qr.qrImageUrl} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-800 inline-flex items-center gap-1">
                                            View <ExternalLink className="h-3 w-3" />
                                        </a>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
