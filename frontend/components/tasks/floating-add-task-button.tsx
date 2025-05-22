"use client";

import { useState } from "react";
import { Plus, Sparkles } from "lucide-react";
import { CreateTaskDialog } from "./create-task-dialog";
import { cn } from "@/lib/utils";

export function FloatingAddTaskButton({ defaultProjectId }: { defaultProjectId?: string }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={cn(
          "fixed z-50 bottom-8 right-8 flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-primary to-violet-500 text-white shadow-xl hover:scale-105 hover:shadow-2xl transition-all duration-200 group focus:outline-none focus:ring-4 focus:ring-violet-300",
          "text-lg font-semibold"
        )}
        aria-label="Add new task"
      >
        <Plus className="w-5 h-5 mr-1 group-hover:rotate-90 transition-transform duration-200" />
        New Task
        <Sparkles className="w-4 h-4 ml-2 text-yellow-300 animate-pulse" />
      </button>
      <CreateTaskDialog open={open} onOpenChange={setOpen} defaultProjectId={defaultProjectId} />
    </>
  );
} 