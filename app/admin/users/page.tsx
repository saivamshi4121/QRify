"use client";

import { useEffect, useState } from "react";
import { MoreVertical, Loader2, ShieldCheck } from "lucide-react";

export default function AdminUsersPage() {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const res = await fetch("/api/admin/users");
            const json = await res.json();
            if (json.success) {
                setUsers(json.data);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdate = async (userId: string, field: "role" | "subscriptionPlan", value: string) => {
        // Optimistic update
        setUsers(users.map(u => u._id === userId ? { ...u, [field]: value } : u));

        try {
            await fetch("/api/admin/users", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId, [field]: value }),
            });
        } catch (e) {
            console.error("Failed to update user");
            fetchUsers(); // Revert on failure
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-slate-800">User Management</h2>
                <span className="text-sm text-slate-500">{users.length} Users Total</span>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                {loading ? (
                    <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-slate-400" /></div>
                ) : (
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 text-slate-500 font-semibold uppercase text-xs">
                            <tr>
                                <th className="px-6 py-4">User</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4">Role</th>
                                <th className="px-6 py-4">Plan</th>
                                <th className="px-6 py-4">Joined</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {users.map((user) => (
                                <tr key={user._id} className="hover:bg-slate-50/50">
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-slate-900">{user.name}</div>
                                        <div className="text-slate-500 text-xs">{user.email}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${user.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                                            {user.isActive ? "Active" : "Inactive"}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <select
                                            value={user.role}
                                            onChange={(e) => handleUpdate(user._id, "role", e.target.value)}
                                            className="border-slate-200 rounded-md text-sm py-1 pl-2 pr-8 focus:ring-emerald-500 focus:border-emerald-500"
                                        >
                                            <option value="user">User</option>
                                            <option value="admin">Admin</option>
                                        </select>
                                    </td>
                                    <td className="px-6 py-4">
                                        <select
                                            value={user.subscriptionPlan}
                                            onChange={(e) => handleUpdate(user._id, "subscriptionPlan", e.target.value)}
                                            className="border-slate-200 rounded-md text-sm py-1 pl-2 pr-8 focus:ring-emerald-500 focus:border-emerald-500"
                                        >
                                            <option value="free">Free</option>
                                            <option value="pro">Pro</option>
                                            <option value="business">Business</option>
                                        </select>
                                    </td>
                                    <td className="px-6 py-4 text-slate-500">
                                        {new Date(user.createdAt).toLocaleDateString()}
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
