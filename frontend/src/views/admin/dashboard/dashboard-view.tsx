"use client";

import { useQuery } from "@tanstack/react-query";
import { Settings as SettingsIcon } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import {
  authApi,
  type PageLayout,
  type PostRecord,
  pageLayoutApi,
  postApi,
  resolveMediaUrl,
} from "@/lib/api";
import { RecentActivity } from "./recent-activity";
import { ScheduledModal } from "./scheduled-modal";
import { StatCard } from "./stat-card";

const NEW_ACCOUNT_THRESHOLD_MS = 7 * 24 * 60 * 60 * 1000;

const isNewAccount = (createdAt: string): boolean =>
  Date.now() - new Date(createdAt).getTime() < NEW_ACCOUNT_THRESHOLD_MS;

const initials = (first: string | null, last: string | null): string => {
  const f = first?.[0] ?? "";
  const l = last?.[0] ?? "";
  return (f + l || "AD").toUpperCase();
};

export function AdminDashboardView() {
  const [scheduledOpen, setScheduledOpen] = useState(false);

  const userQuery = useQuery({
    queryKey: ["AUTH", "PROFILE"],
    queryFn: authApi.getProfile,
  });
  const postsQuery = useQuery({
    queryKey: ["DASHBOARD", "POSTS"],
    queryFn: () => postApi.listPaged({ page: 1, pageSize: 100 }),
  });
  const layoutsQuery = useQuery({
    queryKey: ["DASHBOARD", "LAYOUTS"],
    queryFn: pageLayoutApi.list,
  });

  const posts: PostRecord[] = postsQuery.data?.items ?? [];
  const layouts: PageLayout[] = layoutsQuery.data ?? [];

  const stats = useMemo(() => {
    const draftPosts = posts.filter((p) => p.status === "DRAFT").length;
    const draftLayouts = layouts.filter(
      (l) => !l.isPublished && !l.scheduledAt,
    ).length;
    const publishedPosts = posts.filter((p) => p.status === "PUBLISHED").length;
    const publishedLayouts = layouts.filter((l) => l.isPublished).length;
    const scheduledPosts = posts.filter((p) => p.status === "SCHEDULED").length;
    const scheduledLayouts = layouts.filter(
      (l) => !!l.scheduledAt && !l.isPublished,
    ).length;
    return {
      drafts: draftPosts + draftLayouts,
      published: publishedPosts + publishedLayouts,
      scheduled: scheduledPosts + scheduledLayouts,
    };
  }, [posts, layouts]);

  const scheduledItems = useMemo(() => {
    const p = posts
      .filter((post) => post.status === "SCHEDULED" && post.scheduledAt)
      .map((post) => ({
        kind: "post" as const,
        id: post.id,
        title: post.title,
        scheduledAt: post.scheduledAt as string,
      }));
    const l = layouts
      .filter((layout) => !!layout.scheduledAt && !layout.isPublished)
      .map((layout) => ({
        kind: "layout" as const,
        id: layout.id,
        title: layout.name,
        scheduledAt: layout.scheduledAt as string,
      }));
    return [...p, ...l].sort(
      (a, b) =>
        new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime(),
    );
  }, [posts, layouts]);

  const recentItems = useMemo(() => {
    const fromPosts = posts.map((post) => ({
      kind: "post" as const,
      id: post.id,
      title: post.title,
      status: post.status,
      updatedAt: post.updatedAt,
      href: `/admin/posts?id=${post.id}`,
    }));
    const fromLayouts = layouts.map((layout) => ({
      kind: "layout" as const,
      id: layout.id,
      title: layout.name,
      status: layout.isPublished
        ? "PUBLISHED"
        : layout.scheduledAt
          ? "SCHEDULED"
          : "DRAFT",
      updatedAt: layout.updatedAt,
      href: `/admin/widgets-layout?edit=${layout.id}`,
    }));
    return [...fromPosts, ...fromLayouts]
      .sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
      )
      .slice(0, 6);
  }, [posts, layouts]);

  const user = userQuery.data;
  const greeting = user
    ? `Welcome${isNewAccount(user.createdAt) ? "" : " back"}, ${user.firstName ?? "Admin"}`
    : "Welcome";

  return (
    <div className="dark min-h-full bg-[#101622] text-slate-100">
      <header className="flex h-14 items-center justify-between border-b border-slate-800 bg-[#0f1422] px-6 shrink-0">
        <div className="text-sm font-medium">
          <span className="text-slate-500">Physics Faculty</span>
          <span className="mx-2 text-slate-700">/</span>
          <span className="text-slate-100">Dashboard</span>
        </div>
        <Link
          href="/admin/settings"
          className="flex items-center gap-3 rounded-full bg-slate-800/60 px-2 py-1.5 hover:bg-slate-800 transition-colors"
          title="Open settings"
        >
          <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-blue-600 text-xs font-semibold text-white">
            {user?.avatarUrl ? (
              // biome-ignore lint/performance/noImgElement: avatar from arbitrary remote
              <img
                src={resolveMediaUrl(user.avatarUrl)}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              initials(user?.firstName ?? null, user?.lastName ?? null)
            )}
          </div>
          <div className="hidden sm:flex flex-col text-left pr-2">
            <span className="text-xs font-semibold text-slate-100 leading-none">
              {user?.firstName ?? "Admin"} {user?.lastName ?? ""}
            </span>
            <span className="text-[10px] text-slate-400 leading-none mt-1">
              {user?.role ?? ""}
            </span>
          </div>
          <SettingsIcon className="w-4 h-4 text-slate-400 mr-2" />
        </Link>
      </header>

      <div className="px-6 py-6 space-y-6">
        <section className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
              {greeting}
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Here&apos;s what&apos;s happening with your content today.
            </p>
          </div>
          <Link
            href="/admin/posts"
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white shadow"
          >
            + Create New Post
          </Link>
        </section>

        <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard
            label="Drafts"
            value={stats.drafts}
            tone="slate"
            icon="📝"
            href="/admin/posts/list"
          />
          <StatCard
            label="Published"
            value={stats.published}
            tone="emerald"
            icon="✓"
            href="/admin/posts/list"
          />
          <StatCard
            label="Scheduled"
            value={stats.scheduled}
            tone="amber"
            icon="⏰"
            onClick={() => setScheduledOpen(true)}
          />
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
          <RecentActivity items={recentItems} />
        </section>
      </div>

      <ScheduledModal
        open={scheduledOpen}
        onOpenChange={setScheduledOpen}
        items={scheduledItems}
      />
    </div>
  );
}
