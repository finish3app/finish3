"use client";

import React, { useState, useEffect } from "react";
import TextareaAutosize from 'react-textarea-autosize';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
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
  Copy,
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
  content: string;
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

// --- Sortable Block Item ---
function SortableBlockItem({
  block,
  children,
  onDuplicate,
  onRemove,
}: {
  block: SpaceBlock;
  children: React.ReactNode;
  onDuplicate: (id: string) => void;
  onRemove: (id: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: block.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : "auto" as any,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="group/block relative -ml-14 pl-14 hover:bg-gray-50/30 rounded-lg py-1 transition-colors"
    >
      {/* Drag Handle + Menu */}
      <div className="absolute left-0 top-1/2 -translate-y-1/2 opacity-0 group-hover/block:opacity-100 transition-opacity flex items-center gap-0.5">
        {/* Drag handle — only this element triggers drag */}
        <button
          {...attributes}
          {...listeners}
          className="h-6 w-6 flex items-center justify-center text-gray-300 hover:text-gray-600 hover:bg-gray-100 rounded-md cursor-grab active:cursor-grabbing focus:outline-none touch-none"
        >
          <GripVertical className="w-4 h-4" />
        </button>
      </div>

      {/* Block Menu (separate from drag handle) */}
      <div className="absolute left-7 top-1/2 -translate-y-1/2 opacity-0 group-hover/block:opacity-100 transition-opacity">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="h-5 w-5 flex items-center justify-center text-gray-300 hover:text-gray-500 rounded focus:outline-none">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                <circle cx="8" cy="3" r="1.5" />
                <circle cx="8" cy="8" r="1.5" />
                <circle cx="8" cy="13" r="1.5" />
              </svg>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-40">
            <DropdownMenuItem onClick={() => onDuplicate(block.id)} className="gap-2 cursor-pointer text-sm font-medium">
              <Copy className="w-4 h-4" /> Duplicate
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onRemove(block.id)} className="gap-2 cursor-pointer text-sm font-medium text-red-500 focus:text-red-600 focus:bg-red-50">
              <Trash2 className="w-4 h-4" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Block Content */}
      <div className="w-full">
        {children}
      </div>
    </div>
  );
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
    const timer = setTimeout(() => setLoading(false), 300);
    return () => clearTimeout(timer);
  }, []);

  // Use distance activation to distinguish click from drag
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // Must move 5px before drag activates
      },
    })
  );

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

  const duplicateBlock = (id: string) => {
    const index = blocks.findIndex((b) => b.id === id);
    if (index === -1) return;
    const original = blocks[index];
    const duplicate: SpaceBlock = {
      id: crypto.randomUUID(),
      type: original.type,
      content: original.content,
    };
    const newBlocks = [...blocks];
    newBlocks.splice(index + 1, 0, duplicate);
    onBlocksChange(newBlocks);
  };

  const updateBlock = (id: string, newContent: string) => {
    onBlocksChange(
      blocks.map((b) => (b.id === id ? { ...b, content: newContent } : b))
    );
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = blocks.findIndex((b) => b.id === active.id);
    const newIndex = blocks.findIndex((b) => b.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const newBlocks = [...blocks];
    const [moved] = newBlocks.splice(oldIndex, 1);
    newBlocks.splice(newIndex, 0, moved);
    onBlocksChange(newBlocks);
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

  // --- Block Content Renderer ---
  const renderBlockContent = (block: SpaceBlock) => {
    switch (block.type) {
      case "text":
        return (
          <TextareaAutosize
            value={block.content}
            onChange={(e) => updateBlock(block.id, e.target.value)}
            placeholder="Type something..."
            className="w-full min-h-[24px] bg-transparent border-none text-gray-700 placeholder:text-gray-300 resize-none outline-none focus:ring-0 text-base py-1 leading-relaxed overflow-hidden"
          />
        );
      case "heading1":
        return (
          <input
            type="text"
            value={block.content}
            onChange={(e) => updateBlock(block.id, e.target.value)}
            placeholder="Heading 1"
            className="w-full bg-transparent border-none focus:ring-0 text-3xl font-bold text-gray-900 placeholder:text-gray-300 py-2 pt-4 outline-none"
          />
        );
      case "heading":
        return (
          <input
            type="text"
            value={block.content}
            onChange={(e) => updateBlock(block.id, e.target.value)}
            placeholder="Heading 2"
            className="w-full bg-transparent border-none focus:ring-0 text-2xl font-bold text-gray-900 placeholder:text-gray-300 py-2 pt-4 outline-none"
          />
        );
      case "heading3":
        return (
          <input
            type="text"
            value={block.content}
            onChange={(e) => updateBlock(block.id, e.target.value)}
            placeholder="Heading 3"
            className="w-full bg-transparent border-none focus:ring-0 text-xl font-semibold text-gray-900 placeholder:text-gray-300 py-1.5 pt-3 outline-none"
          />
        );
      case "divider":
        return (
          <div className="py-3 w-full">
            <hr className="w-full border-t border-gray-200" />
          </div>
        );
      case "task_list":
        return (
          <div className="py-2">
            <div className="space-y-0.5">
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
        );
      default:
        return null;
    }
  };

  return (
    <div className="group/editor min-h-[200px] pl-1 pb-20 relative">
      {blocks.length === 0 ? (
        <div className="mt-4">
          <BlockMenuDropdown />
        </div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={blocks.map(b => b.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-1">
              {blocks.map((block) => (
                <SortableBlockItem
                  key={block.id}
                  block={block}
                  onDuplicate={duplicateBlock}
                  onRemove={removeBlock}
                >
                  {renderBlockContent(block)}
                </SortableBlockItem>
              ))}

              <div className="mt-4">
                <BlockMenuDropdown />
              </div>
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
}
