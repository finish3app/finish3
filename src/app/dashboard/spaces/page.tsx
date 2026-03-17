"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useDashboard } from "@/contexts/dashboard-context";
import { useAuth } from "@/contexts/auth-context";
import { canCreateSpace } from "@/lib/subscription";
import { Layout, Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

export default function SpacesPage() {
  const { spaces, addSpace } = useDashboard();
  const { profile } = useAuth();
  const router = useRouter();
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);

  const canCreate = canCreateSpace(profile, spaces.length);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setCreating(true);

    const space = await addSpace(newName.trim(), "📄"); 
    if (space) {
      setNewName("");
      setDialogOpen(false);
      router.push(`/dashboard/spaces/${space.id}`);
    }
    setCreating(false);
  };

  return (
    <div className="max-w-[1000px] mx-auto px-6 py-10 bg-background min-h-screen">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-10">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-foreground tracking-tight">Spaces</h1>
          <p className="text-muted-foreground text-[13px] mt-1">Organize tasks by project or area</p>
        </div>
        
        <button
          onClick={() => canCreate ? setDialogOpen(true) : router.push("/dashboard/settings")}
          className="inline-flex items-center justify-center gap-1.5 h-8 px-4 bg-[#0F1115] dark:bg-white hover:bg-black dark:hover:bg-gray-200 text-white dark:text-black text-[13px] font-medium rounded-md transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">New space</span>
          <span className="sm:hidden">New</span>
        </button>
      </div>

      {spaces.length === 0 ? (
        /* Empty State */
        <div className="flex flex-col items-center justify-center py-24 text-center border-t border-border">
          <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center mb-4">
            <Layout className="w-5 h-5 text-muted-foreground" />
          </div>
          <h3 className="text-[15px] font-medium text-foreground mb-1">No spaces yet</h3>
          <p className="text-sm text-muted-foreground mb-6 max-w-sm">
            Create spaces to organize your tasks by project, client, or any distinct area.
          </p>
          <button
            onClick={() => canCreate ? setDialogOpen(true) : router.push("/dashboard/settings")}
            className="inline-flex items-center justify-center gap-1.5 h-8 px-4 bg-[#0F1115] dark:bg-white hover:bg-black dark:hover:bg-gray-200 text-white dark:text-black text-[13px] font-medium rounded-md transition-colors"
          >
            Create space
          </button>
        </div>
      ) : (
        /* Space Grid */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          
          {spaces.map((space) => (
            <button
              key={space.id}
              onClick={() => router.push(`/dashboard/spaces/${space.id}`)}
              className="group flex flex-col items-start gap-3 p-4 bg-card border border-border rounded-lg hover:border-muted-foreground/30 transition-colors text-left focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <div className="flex items-center gap-2.5 w-full">
                <span className="text-lg leading-none">{space.emoji || "📄"}</span>
                <span className="font-medium text-[14px] text-foreground truncate">{space.name}</span>
              </div>
              {space.description && (
                <p className="text-[13px] text-muted-foreground line-clamp-2 w-full">{space.description}</p>
              )}
            </button>
          ))}

          {/* Add Space Card */}
          <button
            onClick={() => canCreate ? setDialogOpen(true) : router.push("/dashboard/settings")}
            className="flex flex-col items-center justify-center min-h-[5.5rem] p-4 border border-dashed border-border rounded-lg hover:border-muted-foreground/40 hover:bg-secondary/50 transition-colors text-muted-foreground hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <div className="flex items-center gap-2 text-[13px] font-medium">
              <Plus className="w-4 h-4" />
              <span>New space</span>
            </div>
          </button>
        </div>
      )}

      {/* Add Space Dialog */}
      <Dialog 
        open={dialogOpen} 
        onOpenChange={(isOpen) => {
          setDialogOpen(isOpen);
          if (!isOpen) setNewName(""); 
        }}
      >
        <DialogContent className="sm:max-w-[400px] p-0 gap-0 overflow-hidden border-border shadow-lg" aria-describedby={undefined}>
          <DialogTitle className="sr-only">New Space</DialogTitle>
          <form onSubmit={handleCreate}>
            <div className="p-5 pb-4">
              <h2 className="text-[15px] font-medium text-foreground mb-4">Create new space</h2>
              <input
                type="text"
                placeholder="Space name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                maxLength={50}
                required
                autoFocus
                className="w-full h-9 px-3 text-[13px] bg-background border border-border focus:border-muted-foreground focus:ring-1 focus:ring-muted-foreground rounded-md outline-none transition-all placeholder:text-muted-foreground"
              />
            </div>
            <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-border bg-secondary/30">
              <button
                type="button"
                onClick={() => setDialogOpen(false)}
                className="px-3 h-8 text-[13px] font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!newName.trim() || creating}
                className="inline-flex items-center justify-center min-w-[70px] h-8 px-3 bg-[#0F1115] dark:bg-white hover:bg-black dark:hover:bg-gray-200 text-white dark:text-black text-[13px] font-medium rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {creating ? "Creating..." : "Create"}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
