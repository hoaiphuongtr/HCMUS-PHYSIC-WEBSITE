"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { pageLayoutApi, type PageLayout } from "@/lib/api";

export function CreateLayoutModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (layout: PageLayout) => void;
}) {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");

  const createMutation = useMutation({
    mutationKey: ["PAGE_LAYOUTS", "CREATE"],
    mutationFn: pageLayoutApi.create,
    onSuccess(data) {
      toast.success("Layout created");
      onCreated(data);
    },
    onError(err: { message?: string }) {
      toast.error(err.message || "Failed to create layout");
    },
  });

  const handleNameChange = (value: string) => {
    setName(value);
    setSlug(
      value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, ""),
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      name,
      slug,
      description: description || undefined,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">
          Create New Layout
        </h2>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">
              Name
            </label>
            <input
              className="block w-full rounded-md border border-slate-200 py-2 px-3 text-sm text-slate-900 focus:ring-2 focus:ring-blue-200 focus:border-blue-300 outline-none"
              placeholder="e.g. Homepage"
              required
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">
              Slug
            </label>
            <input
              className="block w-full rounded-md border border-slate-200 py-2 px-3 text-sm text-slate-900 focus:ring-2 focus:ring-blue-200 focus:border-blue-300 outline-none"
              placeholder="e.g. homepage"
              required
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">
              Description (optional)
            </label>
            <input
              className="block w-full rounded-md border border-slate-200 py-2 px-3 text-sm text-slate-900 focus:ring-2 focus:ring-blue-200 focus:border-blue-300 outline-none"
              placeholder="Brief description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 border border-slate-200 rounded-md hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="px-4 py-2 text-sm font-medium text-white bg-slate-900 rounded-md hover:bg-black transition-colors shadow-sm disabled:opacity-50"
            >
              {createMutation.isPending ? "Creating..." : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
