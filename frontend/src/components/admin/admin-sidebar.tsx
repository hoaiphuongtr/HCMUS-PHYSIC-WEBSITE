"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { authApi } from "@/lib/api";

const NAV_ITEMS = [
  { name: "Dashboard", href: "/admin", icon: "dashboard" },
  { name: "My Posts", href: "/admin/posts", icon: "article" },
  { name: "Media Library", href: "/admin/media", icon: "folder_open" },
  {
    name: "Page Layouts",
    href: "/admin/widgets-layout",
    icon: "dashboard_customize",
  },
  { name: "Widget Types", href: "/admin/widgets", icon: "extension" },
  { name: "Menus", href: "/admin/menus", icon: "menu" },
];

const SYSTEM_ITEMS = [
  { name: "Settings", href: "/admin/settings", icon: "settings" },
  { name: "Users & Roles", href: "/admin/users", icon: "group" },
];

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: "Super Admin",
  ADMIN: "Administrator",
  USER: "User",
};

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const { data: profile } = useQuery({
    queryKey: ["AUTH", "PROFILE"],
    queryFn: authApi.getProfile,
  });

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    router.push("/login");
  };

  const displayName = profile
    ? [profile.firstName, profile.lastName].filter(Boolean).join(" ") ||
      profile.email
    : "";

  const roleLabel = profile ? ROLE_LABELS[profile.role] || profile.role : "";

  const initials = profile
    ? [profile.firstName?.[0], profile.lastName?.[0]]
        .filter(Boolean)
        .join("")
        .toUpperCase() || profile.email[0].toUpperCase()
    : "";

  return (
    <aside className="flex w-[240px] flex-col bg-[#0B1120] h-full shrink-0">
      <div className="flex items-center gap-3 px-5 h-[64px] shrink-0 border-b border-white/[0.06]">
        <div className="shrink-0 size-8 relative">
          <Image
            src="/Logo_Phys-blue.png"
            alt="Physics Faculty"
            fill
            className="object-contain brightness-0 invert"
          />
        </div>
        <span className="text-sm font-bold text-white tracking-tight">
          Phys.HCMUS
        </span>
      </div>

      {profile && (
        <div className="flex items-center gap-3 px-5 py-4 border-b border-white/[0.06]">
          {profile.avatarUrl ? (
            <Image
              src={profile.avatarUrl}
              alt={displayName}
              width={36}
              height={36}
              className="rounded-full shrink-0"
            />
          ) : (
            <div className="size-9 rounded-full bg-blue-600 flex items-center justify-center shrink-0">
              <span className="text-xs font-semibold text-white">
                {initials}
              </span>
            </div>
          )}
          <div className="min-w-0">
            <p className="text-sm font-medium text-white truncate">
              {displayName}
            </p>
            <p className="text-[11px] text-slate-400 truncate">{roleLabel}</p>
          </div>
        </div>
      )}

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const isActive =
            item.href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium transition-colors ${
                isActive
                  ? "bg-blue-600/20 text-blue-400"
                  : "text-slate-400 hover:bg-white/[0.05] hover:text-white"
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">
                {item.icon}
              </span>
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="px-3 py-3 border-t border-white/[0.06] space-y-1">
        {SYSTEM_ITEMS.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium transition-colors ${
                isActive
                  ? "bg-blue-600/20 text-blue-400"
                  : "text-slate-400 hover:bg-white/[0.05] hover:text-white"
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">
                {item.icon}
              </span>
              {item.name}
            </Link>
          );
        })}
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-colors w-full"
        >
          <span className="material-symbols-outlined text-[20px]">logout</span>
          Log Out
        </button>
      </div>
    </aside>
  );
}
