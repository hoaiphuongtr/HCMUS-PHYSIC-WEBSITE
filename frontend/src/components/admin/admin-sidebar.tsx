"use client";

import { useQuery } from "@tanstack/react-query";
import {
  FileText,
  FolderOpen,
  LayoutDashboard,
  LayoutPanelLeft,
  LogOut,
  type LucideIcon,
  Mail,
  Moon,
  Puzzle,
  Settings,
  Sun,
  Users,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { useAdminTheme } from "@/components/admin/admin-theme";
import { authApi, resolveMediaUrl } from "@/lib/api";

type NavItem = { name: string; href: string; icon: LucideIcon };

const NAV_ITEMS: NavItem[] = [
  { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { name: "My Posts", href: "/admin/posts/list", icon: FileText },
  { name: "Media Library", href: "/admin/media", icon: FolderOpen },
  {
    name: "Page Layouts",
    href: "/admin/widgets-layout",
    icon: LayoutPanelLeft,
  },
  { name: "Widget Types", href: "/admin/widgets", icon: Puzzle },
  { name: "Subscribers", href: "/admin/subscriptions", icon: Mail },
];

const SYSTEM_ITEMS: NavItem[] = [
  { name: "Settings", href: "/admin/settings", icon: Settings },
];

const SUPER_ADMIN_ITEMS: NavItem[] = [
  { name: "Admin Management", href: "/admin/admins", icon: Users },
];

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: "Super Admin",
  ADMIN: "Administrator",
};

const isPathActive = (pathname: string, href: string) => {
  if (href === "/admin") return pathname === "/admin";
  if (pathname === href) return true;
  return pathname.startsWith(`${href}/`);
};

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [hovered, setHovered] = useState(false);
  const collapsed = !hovered;
  const { theme, toggle: toggleTheme } = useAdminTheme();
  const isDark = theme === "dark";

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

  const renderNavItem = (item: NavItem, isActive: boolean) => {
    const Icon = item.icon;
    return (
      <Link
        key={item.href}
        href={item.href}
        title={collapsed ? item.name : undefined}
        className={
          "flex items-center gap-3 rounded-lg text-[13px] font-medium transition-colors " +
          (collapsed ? "justify-center px-0 py-2.5 " : "px-3 py-2 ") +
          (isActive
            ? "bg-blue-100 text-blue-700 dark:bg-blue-600/20 dark:text-blue-400"
            : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/[0.05] hover:text-slate-900 dark:hover:text-white")
        }
      >
        <Icon className="w-5 h-5" />
        {!collapsed && item.name}
      </Link>
    );
  };

  return (
    <aside
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocusCapture={() => setHovered(true)}
      onBlurCapture={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
          setHovered(false);
        }
      }}
      className={
        "flex flex-col bg-white dark:bg-[#0B1120] border-r-2 border-slate-200 dark:border-transparent h-full shrink-0 transition-all duration-200 " +
        (collapsed ? "w-[80px]" : "w-[214px]")
      }
    >
      <div
        className={
          "flex items-center h-[64px] shrink-0 border-b border-slate-200 dark:border-white/[0.06] " +
          (collapsed ? "justify-center px-0" : "gap-3 px-5")
        }
      >
        <div className="shrink-0 size-8 relative">
          <Image
            src="/Logo_Phys-blue.png"
            alt="Physics Faculty"
            fill
            sizes="32px"
            priority
            className="object-contain dark:brightness-0 dark:invert"
          />
        </div>
        {!collapsed && (
          <span className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">
            Phys.HCMUS
          </span>
        )}
      </div>

      {profile && !collapsed && (
        <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-200 dark:border-white/[0.06]">
          {profile.avatarUrl ? (
            <div className="relative size-9 rounded-full overflow-hidden shrink-0 bg-slate-200 dark:bg-slate-700">
              <Image
                src={resolveMediaUrl(profile.avatarUrl)}
                alt=""
                fill
                sizes="36px"
                unoptimized
                priority
                className="object-cover"
              />
            </div>
          ) : (
            <div className="size-9 rounded-full bg-blue-600 flex items-center justify-center shrink-0">
              <span className="text-xs font-semibold text-white">
                {initials}
              </span>
            </div>
          )}
          <div className="min-w-0">
            <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
              {displayName}
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
              {roleLabel}
            </p>
          </div>
        </div>
      )}

      {profile && collapsed && (
        <div className="flex justify-center py-4 border-b border-slate-200 dark:border-white/[0.06]">
          {profile.avatarUrl ? (
            <div className="relative size-8 rounded-full overflow-hidden bg-slate-200 dark:bg-slate-700">
              <Image
                src={resolveMediaUrl(profile.avatarUrl)}
                alt=""
                fill
                sizes="32px"
                unoptimized
                priority
                className="object-cover"
              />
            </div>
          ) : (
            <div className="size-8 rounded-full bg-blue-600 flex items-center justify-center">
              <span className="text-[10px] font-semibold text-white">
                {initials}
              </span>
            </div>
          )}
        </div>
      )}

      <nav
        className={
          "flex-1 py-4 space-y-1 overflow-y-auto " +
          (collapsed ? "px-2" : "px-3")
        }
      >
        {NAV_ITEMS.map((item) =>
          renderNavItem(item, isPathActive(pathname, item.href)),
        )}
      </nav>

      <div
        className={
          "py-3 border-t border-slate-200 dark:border-white/[0.06] space-y-1 " +
          (collapsed ? "px-2" : "px-3")
        }
      >
        {profile?.role === "SUPER_ADMIN" &&
          SUPER_ADMIN_ITEMS.map((item) =>
            renderNavItem(item, isPathActive(pathname, item.href)),
          )}
        {SYSTEM_ITEMS.map((item) =>
          renderNavItem(item, isPathActive(pathname, item.href)),
        )}
        <button
          type="button"
          onClick={handleLogout}
          title={collapsed ? "Log Out" : undefined}
          className={
            "flex items-center gap-3 rounded-lg text-[13px] font-medium text-slate-600 dark:text-slate-400 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400 transition-colors w-full " +
            (collapsed ? "justify-center px-0 py-2.5" : "px-3 py-2")
          }
        >
          <LogOut className="w-5 h-5" />
          {!collapsed && "Log Out"}
        </button>

        <div
          className={
            "flex w-full " +
            (collapsed ? "justify-center" : "ml-2 justify-start")
          }
        >
          <button
            type="button"
            role="switch"
            aria-checked={isDark}
            aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
            onClick={toggleTheme}
            className={
              "relative inline-flex items-center rounded-full transition-colors duration-300 shadow-inner border " +
              (isDark
                ? "bg-indigo-1000 border-indigo-600"
                : "bg-slate-200 border-slate-300") +
              (collapsed ? " h-7 w-14" : " h-12 w-[214px]")
            }
          >
            {/* Sliding white knob — only this element moves. */}
            <span
              aria-hidden="true"
              className={
                "absolute top-1/2 -translate-y-1/2 rounded-full bg-white shadow-lg transition-transform duration-300 ring-1 ring-black/5 " +
                (collapsed ? "h-6 w-6" : "h-9 w-9") +
                " " +
                (isDark
                  ? collapsed
                    ? "translate-x-[28px]"
                    : "translate-x-[145px]"
                  : collapsed
                    ? "translate-x-0.5"
                    : "translate-x-[6px]")
              }
            />
            {/* Fixed icons always rendered on top of the knob. */}
            <span
              className={
                "pointer-events-none absolute inset-0 flex items-center justify-between " +
                (collapsed ? "px-2" : "px-[14px]")
              }
            >
              <Sun
                className={
                  (collapsed ? "w-3.5 h-3.5" : "w-5 h-5") +
                  " transition-colors " +
                  (isDark ? "text-slate-300 opacity-80" : "text-amber-500")
                }
              />
              <Moon
                className={
                  (collapsed ? "w-3.5 h-3.5" : "w-5 h-5") +
                  " transition-colors " +
                  (isDark ? "text-indigo-600" : "text-slate-400 opacity-80")
                }
              />
            </span>
          </button>
        </div>
      </div>
    </aside>
  );
}
