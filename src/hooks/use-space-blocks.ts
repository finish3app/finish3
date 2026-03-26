"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/contexts/auth-context";
import type { SpaceBlock } from "@/components/block-editor";

// Module-level cache — persists across component unmounts and re-renders
const blocksCache = new Map<string, SpaceBlock[]>();

// Pre-fetch blocks for ALL spaces in a single query and warm the cache
export async function prefetchAllSpaceBlocks(spaceIds: string[]) {
  if (spaceIds.length === 0) return;
  const supabase = createClient();
  const { data } = await supabase
    .from("space_blocks")
    .select("*")
    .in("space_id", spaceIds)
    .order("order_index");
  if (!data) return;

  // Group blocks by space_id
  const grouped = new Map<string, SpaceBlock[]>();
  for (const b of data) {
    let type = b.type;
    if (b.type === "heading" && b.content?.level === 1) type = "heading1";
    else if (b.type === "heading" && b.content?.level === 3) type = "heading3";

    const block: SpaceBlock = {
      id: b.id,
      type: type as any,
      content: b.content?.text || "",
    };

    const existing = grouped.get(b.space_id) || [];
    existing.push(block);
    grouped.set(b.space_id, existing);
  }

  // Populate cache — also set empty arrays for spaces with no blocks
  for (const id of spaceIds) {
    blocksCache.set(id, grouped.get(id) || []);
  }
}

export function useSpaceBlocks(spaceId: string) {
  const { user } = useAuth();
  const supabase = createClient();

  // Initialize from cache if available, otherwise empty
  const [blocks, setBlocksState] = useState<SpaceBlock[]>(
    () => blocksCache.get(spaceId) || []
  );

  // Wrapper that syncs both state and cache
  const setBlocks = useCallback(
    (newBlocks: SpaceBlock[] | ((prev: SpaceBlock[]) => SpaceBlock[])) => {
      setBlocksState((prev) => {
        const resolved = typeof newBlocks === "function" ? newBlocks(prev) : newBlocks;
        blocksCache.set(spaceId, resolved);
        return resolved;
      });
    },
    [spaceId]
  );

  // Fetch fresh blocks from Supabase
  const fetchBlocks = useCallback(async () => {
    if (!spaceId || !user) return;
    const { data } = await supabase
      .from("space_blocks")
      .select("*")
      .eq("space_id", spaceId)
      .order("order_index");
    if (data) {
      const mapped = data.map((b: any) => {
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
      });
      blocksCache.set(spaceId, mapped);
      setBlocksState(mapped);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spaceId, user]);

  // Fetch on mount (data may already be showing from cache)
  useEffect(() => {
    fetchBlocks();
  }, [fetchBlocks]);

  return { blocks, setBlocks, fetchBlocks };
}
