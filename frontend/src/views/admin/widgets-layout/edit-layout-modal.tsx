"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "react-toastify";
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
import { toSlug } from "@/lib/utils";

export function EditLayoutModal({
  layout,
  onClose,
  onUpdated,
}: {
  layout: PageLayout;
  onClose: () => void;
  onUpdated: (layout: PageLayout) => void;
}) {
  const queryClient = useQueryClient();
  const [name, setName] = useState(layout.name);
  const [slug, setSlug] = useState(layout.slug);
  const [description, setDescription] = useState(layout.description || "");
  const [slugTouched, setSlugTouched] = useState(false);

  const updateMutation = useMutation({
    mutationKey: ["PAGE_LAYOUTS", "UPDATE"],
    mutationFn: (body: {
      name: string;
      slug: string;
      description?: string;
    }) => pageLayoutApi.update(layout.id, body),
    onSuccess(data) {
      queryClient.invalidateQueries({ queryKey: ["PAGE_LAYOUTS"] });
      queryClient.invalidateQueries({
        queryKey: ["PAGE_LAYOUTS", layout.id],
      });
      toast.success("Layout updated");
      onUpdated(data);
      onClose();
    },
    onError(err: { message?: string }) {
      toast.error(err.message || "Failed to update layout");
    },
  });

  const handleNameChange = (value: string) => {
    setName(value);
    if (!slugTouched) setSlug(toSlug(value));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate({
      name,
      slug,
      description: description || undefined,
    });
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Layout</DialogTitle>
        </DialogHeader>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-1.5">
            <Label>Name</Label>
            <Input
              required
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Slug</Label>
            <Input
              required
              value={slug}
              onChange={(e) => {
                setSlug(e.target.value);
                setSlugTouched(true);
              }}
            />
            <p className="text-[10px] text-muted-foreground">
              Public URL path. Changing this will break existing links.
            </p>
          </div>
          <div className="space-y-1.5">
            <Label>Description (optional)</Label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={updateMutation.isPending}>
              {updateMutation.isPending ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
