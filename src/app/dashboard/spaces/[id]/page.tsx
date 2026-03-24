"use client";

import React, { useState, useEffect, use, useMemo } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { createClient } from "@/lib/supabase/client";
import { useDashboard } from "@/contexts/dashboard-context";
import { BlockEditor, type SpaceBlock } from "@/components/block-editor";
import { TaskCreationDialog } from "@/components/task-creation-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  ArrowLeft,
  MoreHorizontal,
  Trash2,
  Archive,
  Image as ImageIcon,
  Search,
} from "lucide-react";
import type { CustomSpace } from "@/lib/types";

const EmojiPicker = dynamic(() => import("emoji-picker-react"), {
  ssr: false,
  loading: () => <div className="w-[352px] h-[400px] flex items-center justify-center text-gray-400 text-sm">Loading emojis...</div>,
});

const gradients = [
  "from-pink-200 via-purple-200 to-indigo-200",
  "from-yellow-200 via-orange-200 to-red-200",
  "from-green-200 via-teal-200 to-blue-200",
  "from-blue-100 via-indigo-100 to-purple-100",
];

export default function SpaceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { spaces, updateSpace, deleteSpace, toggleComplete, moveToToday, moveToInbox, deleteTask } = useDashboard();
  
  const [space, setSpace] = useState<CustomSpace | null>(null);
  
  const { user } = useAuth();
  const supabase = createClient();
  const [blocks, setBlocks] = useState<SpaceBlock[]>([]); 
  
  const [titleValue, setTitleValue] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [activeBlockId, setActiveBlockId] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    if (!id || !user) return;
    const fetchBlocks = async () => {
      const { data } = await supabase
        .from("space_blocks")
        .select("*")
        .eq("space_id", id)
        .order("order_index");
      if (data) {
        setBlocks(
          data.map((b: any) => {
            let type = b.type;
            if (b.type === "heading" && b.content?.level === 1) {
              type = "heading1";
            } else if (b.type === "heading" && b.content?.level === 3) {
              type = "heading3";
            }
            return {
              id: b.id,
              type: type as any,
              content: b.content?.text || "",
            };
          })
        );
      }
    };
    fetchBlocks();
  }, [id, user, supabase]);

  const handleBlocksChange = async (newBlocks: SpaceBlock[]) => {
    if (!user || !space) return;
    setBlocks(newBlocks);
    
    const dbBlocks = newBlocks.map((b, i) => {
      let dbType: string = b.type;
      let content: Record<string, unknown> = { text: b.content };

      if (b.type === "heading1") {
        dbType = "heading";
        content = { text: b.content, level: 1 };
      } else if (b.type === "heading3") {
        dbType = "heading";
        content = { text: b.content, level: 3 };
      }

      return {
        id: b.id,
        space_id: space.id,
        user_id: user.id,
        type: dbType,
        content,
        order_index: i,
      };
    });

    const currentIds = newBlocks.map(b => b.id);
    const deletedIds = blocks.filter(b => !currentIds.includes(b.id)).map(b => b.id);

    if (deletedIds.length > 0) {
      await supabase.from("space_blocks").delete().in("id", deletedIds);
    }
    
    if (dbBlocks.length > 0) {
       await supabase.from("space_blocks").upsert(dbBlocks);
    }
  };

  useEffect(() => {
    const found = spaces.find((s) => s.id === id);
    if (found) {
      setSpace(found);
      setTitleValue(found.name);
      // NOTE: Normally found.blocks would load here if backend supported space_blocks strictly locally.
    }
  }, [spaces, id]);

  const gradientClass = useMemo(() => {
    if (!space) return gradients[0];
    const index = space.name.length % gradients.length;
    return gradients[index];
  }, [space]);

  const handleTitleSave = async () => {
    if (space && titleValue.trim() && titleValue !== space.name) {
      await updateSpace(space.id, { name: titleValue.trim() });
    }
  };

  const handleEmojiChange = async (emojiObject: { emoji: string }) => {
    if (space) {
      await updateSpace(space.id, { emoji: emojiObject.emoji });
    }
  };

  const handleDeleteSpace = async () => {
    if (space && window.confirm("Are you sure you want to delete this space?")) {
      await deleteSpace(space.id);
      router.push("/dashboard/spaces");
    }
  };

  const handleArchiveSpace = async () => {
    if (space && window.confirm("Are you sure you want to archive this space?")) {
      await updateSpace(space.id, { is_archived: true } as any);
      router.push("/dashboard/spaces");
    }
  };

  const openTaskDialogForBlock = (blockId?: string) => {
    setActiveBlockId(blockId || null);
    setDialogOpen(true);
  };

  if (!space) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[60vh] text-center">
        <span className="text-6xl mb-4">🔍</span>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Space not found</h2>
        <p className="text-gray-500 mb-6 max-w-sm">This space may have been deleted or doesn&apos;t exist.</p>
        <button
          onClick={() => router.push("/dashboard/spaces")}
          className="text-amber-600 hover:text-amber-700 font-medium text-sm transition-colors"
        >
          &larr; Back to Spaces
        </button>
      </div>
    );
  }

  return (
    <div className="h-full relative bg-white min-h-screen">
      
      {/* 2.4 Cover Area */}
      <div className={`group relative h-48 w-full bg-gradient-to-r ${gradientClass} transition-colors duration-500`}>
        {/* Navigation back overlay helper */}
        <div className="absolute top-4 left-4 z-10">
           <button
             onClick={() => router.push("/dashboard/spaces")}
             className="flex items-center gap-2 px-3 py-1.5 bg-white/40 hover:bg-white/60 backdrop-blur-sm rounded-lg text-sm font-medium text-gray-800 transition-colors"
           >
             <ArrowLeft className="w-4 h-4" /> Spaces
           </button>
        </div>

        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors" />
        <Button 
          variant="secondary" 
          size="sm" 
          className="absolute bottom-4 right-8 opacity-0 group-hover:opacity-100 bg-white/80 hover:bg-white transition-opacity"
        >
          <ImageIcon className="w-4 h-4 mr-2" /> Change cover
        </Button>
      </div>

      {/* 2.3 Content Area */}
      <div className="max-w-4xl mx-auto px-4 sm:px-8 md:px-12 pb-32 -mt-12 relative z-10">
        
        {/* 2.5 Emoji Picker */}
        <div className="mb-4">
          <Popover>
            <PopoverTrigger asChild>
              <button className="text-[72px] leading-none hover:bg-gray-100 rounded-lg p-1 transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500/20">
                {space.emoji || "📄"}
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 border-none shadow-none bg-transparent" align="start" sideOffset={8}>
               <div className="bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden">
                 <EmojiPicker onEmojiClick={handleEmojiChange} lazyLoadEmojis={true} />
               </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* 2.6 Title & Menu */}
        <div className="group flex items-start justify-between gap-4 mb-8 relative">
          <input
            type="text"
            value={titleValue}
            onChange={(e) => setTitleValue(e.target.value)}
            onBlur={handleTitleSave}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.currentTarget.blur();
              }
            }}
            placeholder="Untitled"
            className="text-3xl sm:text-4xl font-bold text-gray-900 placeholder:text-gray-300 bg-transparent border-none focus:ring-0 p-0 w-full outline-none leading-tight"
          />
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 text-gray-400 focus:opacity-100 mt-2 shrink-0">
                <MoreHorizontal className="w-5 h-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem 
                onClick={() => {
                   // Focus trick by finding the massive title input above
                   document.querySelector<HTMLInputElement>("input.text-4xl")?.focus();
                }}
              >
                Rename
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleArchiveSpace}>
                <Archive className="w-4 h-4 mr-2" /> Archive
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleDeleteSpace} className="text-red-600 focus:text-red-700 focus:bg-red-50">
                <Trash2 className="w-4 h-4 mr-2" /> Delete Space
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* 2.7 Block Editor Context */}
        <BlockEditor
          spaceId={space.id}
          space={space}
          blocks={blocks}
          onBlocksChange={handleBlocksChange}
          onOpenTaskDialog={openTaskDialogForBlock}
          onTaskComplete={toggleComplete}
          onDeleteTask={deleteTask}
          onTaskMoveToToday={moveToToday}
          onTaskMoveToInbox={moveToInbox}
          refreshTrigger={refreshTrigger}
        />
      </div>

      {/* 2.8 ImprovedTaskCreationDialog wrapper (Standardized as TaskCreationDialog inside our codebase generally for this context unless specified externally) */}
      <TaskCreationDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        spaceId={space.id}
        spaceName={space.name}
        spaceEmoji={space.emoji}
        blockId={activeBlockId || undefined}
        onCreated={() => setRefreshTrigger(prev => prev + 1)}
      />
    </div>
  );
}
