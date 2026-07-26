"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { notificationApi } from "@/lib/api";

export function AdminNotificationBell() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  const { data: count } = useQuery({
    queryKey: ["NOTIF_UNREAD"],
    queryFn: notificationApi.unreadCount,
    refetchInterval: 60_000,
  });
  const listQuery = useQuery({
    queryKey: ["NOTIF_LIST"],
    queryFn: () => notificationApi.list(30),
    enabled: open,
  });

  const markRead = useMutation({
    mutationFn: (id: string) => notificationApi.markRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["NOTIF_LIST"] });
      queryClient.invalidateQueries({ queryKey: ["NOTIF_UNREAD"] });
    },
  });
  const markAll = useMutation({
    mutationFn: () => notificationApi.markAllRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["NOTIF_LIST"] });
      queryClient.invalidateQueries({ queryKey: ["NOTIF_UNREAD"] });
    },
  });

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    };
    window.addEventListener("mousedown", onDown);
    return () => window.removeEventListener("mousedown", onDown);
  }, [open]);

  const unread = count?.unread ?? 0;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className="relative p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-300"
        aria-label="Thông báo"
      >
        <Bell className="w-5 h-5" />
        {unread > 0 ? (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 flex items-center justify-center text-[10px] font-bold text-white bg-red-500 rounded-full">
            {unread > 9 ? "9+" : unread}
          </span>
        ) : null}
      </button>
      {open ? (
        <div className="absolute right-0 bottom-full mb-2 z-50 w-80 max-w-[calc(100vw-2rem)] bg-white dark:bg-[#1a2436] border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg overflow-hidden">
          <div className="flex items-center justify-between px-3 py-2 border-b border-slate-100 dark:border-slate-800">
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
              Thông báo
            </span>
            <button
              type="button"
              onClick={() => markAll.mutate()}
              className="text-[11px] text-blue-600 hover:underline"
            >
              Đọc tất cả
            </button>
          </div>
          <ul className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
            {(listQuery.data?.items ?? []).length === 0 ? (
              <li className="px-3 py-6 text-center text-xs text-slate-400">
                Chưa có thông báo
              </li>
            ) : (
              (listQuery.data?.items ?? []).map((n) => (
                <li key={n.id}>
                  <a
                    href={n.link ?? "#"}
                    onClick={() => !n.isRead && markRead.mutate(n.id)}
                    className={`block px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-800/50 ${
                      n.isRead ? "opacity-60" : ""
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      {!n.isRead ? (
                        <span className="mt-1.5 w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                      ) : (
                        <span className="mt-1.5 w-2 h-2 shrink-0" />
                      )}
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-slate-700 dark:text-slate-200 truncate">
                          {n.title}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">
                          {n.message}
                        </div>
                      </div>
                    </div>
                  </a>
                </li>
              ))
            )}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
