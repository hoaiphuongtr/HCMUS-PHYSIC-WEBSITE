"use client";

import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "react-toastify";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { type PageLayout, pageLayoutApi } from "@/lib/api";
import { suggestSlugs, toSlug } from "@/lib/utils";

export function CreateLayoutModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (layout: PageLayout) => void;
}) {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugSuggestions, setSlugSuggestions] = useState<string[]>([]);
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
    const generated = toSlug(value);
    setSlug(generated);
    setSlugSuggestions(suggestSlugs(value).filter((s) => s !== generated));
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
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Layout</DialogTitle>
        </DialogHeader>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-1.5">
            <Label>Name</Label>
            <Input
              placeholder="e.g. Trang chủ, Homepage"
              required
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Slug</Label>
            <Input
              placeholder="e.g. trang-chu, homepage"
              required
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
            />
            {slugSuggestions.length > 0 && (
              <div className="flex items-center gap-1.5 mt-1">
                <span className="text-[10px] text-muted-foreground">
                  Suggestions:
                </span>
                {slugSuggestions.map((s) => (
                  <Badge
                    key={s}
                    variant="outline"
                    className="cursor-pointer text-[10px]"
                    onClick={() => setSlug(s)}
                  >
                    {s}
                  </Badge>
                ))}
              </div>
            )}
          </div>
          <div className="space-y-1.5">
            <Label>Description (optional)</Label>
            <Input
              placeholder="Brief description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
