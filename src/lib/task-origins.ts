export interface TaskOrigin {
  from: "space" | "inbox";
  spaceId?: string;
  blockId?: string | null;
}

const STORAGE_KEY = "finish3_task_origins";

export function getTaskOrigins(): Record<string, TaskOrigin> {
  if (typeof window === "undefined") return {};
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : {};
  } catch (e) {
    console.error("Failed to parse task origins from localStorage", e);
    return {};
  }
}

export function saveTaskOrigins(origins: Record<string, TaskOrigin>) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(origins));
  } catch (e) {
    console.error("Failed to save task origins to localStorage", e);
  }
}

export function setTaskOrigin(taskId: string, origin: TaskOrigin) {
  const origins = getTaskOrigins();
  origins[taskId] = origin;
  saveTaskOrigins(origins);
}

export function removeTaskOrigin(taskId: string) {
  const origins = getTaskOrigins();
  if (origins[taskId]) {
    delete origins[taskId];
    saveTaskOrigins(origins);
  }
}

export function getTaskOrigin(taskId: string): TaskOrigin | undefined {
  const origins = getTaskOrigins();
  return origins[taskId];
}
