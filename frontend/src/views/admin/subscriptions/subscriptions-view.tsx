"use client";

import { useQuery } from "@tanstack/react-query";
import { subscriptionApi } from "@/lib/api";

export function SubscriptionsView() {
  const { data: subscriptions = [], isLoading } = useQuery({
    queryKey: ["SUBSCRIPTIONS"],
    queryFn: () => subscriptionApi.list(),
  });

  return (
    <div className="p-6">
      <header className="mb-6">
        <h1 className="text-xl font-semibold text-slate-900">Subscribers</h1>
        <p className="text-sm text-slate-500 mt-1">
          {subscriptions.length} người đã đăng ký nhận thông báo qua email.
        </p>
      </header>

      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
            <tr>
              <th className="text-left px-4 py-3 font-medium">Email</th>
              <th className="text-left px-4 py-3 font-medium">Tags</th>
              <th className="text-left px-4 py-3 font-medium">Visitor</th>
              <th className="text-left px-4 py-3 font-medium">Verified</th>
              <th className="text-left px-4 py-3 font-medium">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              <tr>
                <td
                  className="px-4 py-6 text-center text-slate-400"
                  colSpan={5}
                >
                  Loading…
                </td>
              </tr>
            ) : subscriptions.length === 0 ? (
              <tr>
                <td
                  className="px-4 py-6 text-center text-slate-400"
                  colSpan={5}
                >
                  Chưa có subscriber nào.
                </td>
              </tr>
            ) : (
              subscriptions.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50/50">
                  <td className="px-4 py-3 font-medium text-slate-800">
                    {s.email}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {s.tagSlugs.length === 0 ? (
                        <span className="text-xs text-slate-400">—</span>
                      ) : (
                        s.tagSlugs.map((tag) => (
                          <span
                            key={tag}
                            className="px-2 py-0.5 text-[11px] rounded-full bg-blue-50 text-blue-700 border border-blue-100"
                          >
                            {tag}
                          </span>
                        ))
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-400 font-mono">
                    {s.visitorId ? s.visitorId.slice(0, 8) + "…" : "—"}
                  </td>
                  <td className="px-4 py-3 text-xs">
                    {s.verifiedAt ? (
                      <span className="text-emerald-600 font-medium">
                        {new Date(s.verifiedAt).toLocaleDateString()}
                      </span>
                    ) : (
                      <span className="text-slate-400">Pending</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500">
                    {new Date(s.createdAt).toLocaleString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
