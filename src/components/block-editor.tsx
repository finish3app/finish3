"use client";

import React, { useState, useEffect } from "react";
import { useDashboard } from "@/contexts/dashboard-context";
import { LinearTaskRow } from "@/components/linear-ui/linear-task-row";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  GripVertical,
  Plus,
  Trash2,
  Type,
  Heading1,
  Heading2,
  Heading3,
  CheckSquare,
  Minus,
} from "lucide-react";
import type { CustomSpace, Task } from "@/lib/types";

export interface SpaceBlock {
  id: string;
  type: "text" | "heading1" | "heading" | "heading3" | "task_list" | "divider";
  content: string; // for text or heading blocks 
}

interface BlockEditorProps {
  spaceId: string;
  space: CustomSpace;
  blocks: SpaceBlock[];
  onBlocksChange: (blocks: SpaceBlock[]) => void;
  onOpenTaskDialog: (blockId?: string) => void;
  onTaskComplete: (task: Task) => void;
  onTaskMoveToToday: (task: Task) => void;
  onTaskMoveToInbox: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
  refreshTrigger: number;
}

export function BlockEditor({
  spaceId,
  space,
  blocks,
  onBlocksChange,
  onOpenTaskDialog,
  onTaskComplete,
  onTaskMoveToToday,
  onTaskMoveToInbox,
  onDeleteTask,
  refreshTrigger,
}: BlockEditorProps) {
  const { tasks } = useDashboard();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Artificial load check or data resolution wait
    const timer = setTimeout(() => setLoading(false), 300);
    return () => clearTimeout(timer);
  }, []);

  const addBlock = (type: SpaceBlock["type"]) => {
    const newBlock: SpaceBlock = {
      id: crypto.randomUUID(),
      type,
      content: "",
    };
    onBlocksChange([...blocks, newBlock]);
  };

  const removeBlock = (id: string) => {
    onBlocksChange(blocks.filter((b) => b.id !== id));
  };

  const updateBlock = (id: string, newContent: string) => {
    onBlocksChange(
      blocks.map((b) => (b.id === id ? { ...b, content: newContent } : b))
    );
  };

  if (loading) {
    return (
      <div className="min-h-[200px] pl-1 space-y-4 animate-pulse pt-4">
        <div className="h-4 bg-gray-100/50 rounded w-full max-w-lg" />
        <div className="h-4 bg-gray-100/50 rounded w-full max-w-sm" />
        <div className="h-4 bg-gray-100/50 rounded w-full max-w-xl" />
      </div>
    );
  }

  // --- Render Inline Block Menu Variant ---
  const BlockMenuDropdown = ({ inline = false }: { inline?: boolean }) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {inline ? (
          <button className="h-6 w-6 p-0 flex items-center justify-center bg-gray-50 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors opacity-0 group-hover/editor:opacity-100 data-[state=open]:opacity-100 focus:outline-none">
            <Plus className="w-4 h-4" />
          </button>
        ) : (
          <button className="flex items-center justify-center gap-2 w-full h-12 border border-dashed border-gray-200 hover:border-gray-300 hover:bg-gray-50/50 text-gray-400 hover:text-gray-600 rounded-lg text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-violet-500/20">
            <Plus className="w-4 h-4" />
            Click to add a block
          </button>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-48 p-1">
        <DropdownMenuItem onClick={() => addBlock("text")} className="gap-2 cursor-pointer text-sm font-medium">
          <Type className="w-4 h-4 text-gray-400" /> Text
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => addBlock("heading1")} className="gap-2 cursor-pointer text-sm font-medium">
          <Heading1 className="w-4 h-4 text-gray-400" /> Heading 1
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => addBlock("heading")} className="gap-2 cursor-pointer text-sm font-medium">
          <Heading2 className="w-4 h-4 text-gray-400" /> Heading 2
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => addBlock("heading3")} className="gap-2 cursor-pointer text-sm font-medium">
          <Heading3 className="w-4 h-4 text-gray-400" /> Heading 3
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => addBlock("task_list")} className="gap-2 cursor-pointer text-sm font-medium">
          <CheckSquare className="w-4 h-4 text-gray-400" /> Task List
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => addBlock("divider")} className="gap-2 cursor-pointer text-sm font-medium">
          <Minus className="w-4 h-4 text-gray-400" /> Divider
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <div className="group/editor min-h-[200px] pl-1 pb-20 relative">
      
      {/* Empty State */}
      {blocks.length === 0 ? (
        <div className="mt-4">
          <BlockMenuDropdown />
        </div>
      ) : (
        <div className="space-y-1">
          {blocks.map((block) => (
            <div key={block.id} className="group/block relative -ml-10 pl-10 hover:bg-gray-50/30 rounded-lg py-1 transition-colors">
              
              {/* Visual Anchor (Left Controls) */}
              <div className="absolute left-0 top-1.5 opacity-0 group-hover/block:opacity-100 transition-opacity flex items-center justify-center">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="h-6 w-6 flex items-center justify-center text-gray-300 hover:text-gray-600 hover:bg-gray-100 rounded-md cursor-grab active:cursor-grabbing focus:outline-none">
                      <GripVertical className="w-4 h-4" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-36">
                    <DropdownMenuItem onClick={() => removeBlock(block.id)} className="text-red-500 focus:text-red-600 focus:bg-red-50 font-medium">
                      <Trash2 className="w-4 h-4 mr-2" /> Delete Block
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* --- Block Layout Rendering --- */}
              <div className="w-full">
                {block.type === "text" && (
                  <textarea
                    value={block.content}
                    onChange={(e) => updateBlock(block.id, e.target.value)}
                    placeholder="Type something..."
                    className="w-full min-h-[24px] bg-transparent border-none text-gray-700 placeholder:text-gray-300 resize-none outline-none focus:ring-0 text-base py-1 leading-relaxed"
                    rows={1}
                    onInput={(e) => {
                      e.currentTarget.style.height = 'auto';
                      e.currentTarget.style.height = e.currentTarget.scrollHeight + 'px';
                    }}
                  />
                )}

                {block.type === "heading1" && (
                  <input
                    type="text"
                    value={block.content}
                    onChange={(e) => updateBlock(block.id, e.target.value)}
                    placeholder="Heading 1"
                    className="w-full bg-transparent border-none focus:ring-0 text-3xl font-bold text-gray-900 placeholder:text-gray-300 py-2 pt-4 outline-none"
                  />
                )}

                {block.type === "heading" && (
                  <input
                    type="text"
                    value={block.content}
                    onChange={(e) => updateBlock(block.id, e.target.value)}
                    placeholder="Heading 2"
                    className="w-full bg-transparent border-none focus:ring-0 text-2xl font-bold text-gray-900 placeholder:text-gray-300 py-2 pt-4 outline-none"
                  />
                )}

                {block.type === "heading3" && (
                  <input
                    type="text"
                    value={block.content}
                    onChange={(e) => updateBlock(block.id, e.target.value)}
                    placeholder="Heading 3"
                    className="w-full bg-transparent border-none focus:ring-0 text-xl font-semibold text-gray-900 placeholder:text-gray-300 py-1.5 pt-3 outline-none"
                  />
                )}

                {block.type === "divider" && (
                  <div className="py-3 w-full">
                    <hr className="w-full border-t border-gray-200" />
                  </div>
                )}

                {block.type === "task_list" && (
                  <div className="py-2">
                     <div className="space-y-0.5">
                       {/* Map tasks tied to this specific block & space */}
                       {tasks
                         .filter(t => t.space_id === space.id && t.block_id === block.id && !t.is_completed && !t.is_daily_top_3)
                         .map((task) => (
                           <LinearTaskRow
                             key={task.id}
                             task={task}
                             onToggleComplete={onTaskComplete}
                             onDelete={onDeleteTask}
                             onMoveToToday={onTaskMoveToToday}
                             onMoveToInbox={onTaskMoveToInbox}
                           />
                       ))}
                     </div>

                     <div className="mt-2 text-left">
                       {tasks.filter(t => t.space_id === space.id && t.block_id === block.id && !t.is_completed && !t.is_daily_top_3).length === 0 ? (
                          <button
                             onClick={() => onOpenTaskDialog(block.id)}
                             className="inline-flex items-center text-xs font-medium text-gray-400 hover:text-gray-600 border border-dashed border-gray-200 hover:border-gray-300 rounded px-3 py-1.5 transition-colors focus:outline-none"
                          >
                             <Plus className="w-3.5 h-3.5 mr-1.5" />
                             Add a task to list
                          </button>
                       ) : (
                          <button
                             onClick={() => onOpenTaskDialog(block.id)}
                             className="inline-flex items-center text-xs font-medium text-gray-400 hover:text-gray-600 transition-colors ml-8 focus:outline-none"
                          >
                             <Plus className="w-3.5 h-3.5 mr-1" />
                             New item
                          </button>
                       )}
                     </div>
                  </div>
                )}
              </div>
            </div>
          ))}
          
          {/* Add block button after last block — always visible */}
          <div className="mt-4">
            <BlockMenuDropdown />
          </div>
        </div>
      )}
    </div>
  );
}
