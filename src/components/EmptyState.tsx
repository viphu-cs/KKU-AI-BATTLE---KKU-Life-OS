import React from "react";
import { FolderOpen } from "lucide-react";

interface EmptyStateProps {
  id?: string;
  title: string;
  description: string;
  icon?: React.ReactNode;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export default function EmptyState({ id, title, description, icon, action }: EmptyStateProps) {
  return (
    <div id={id || "empty-state"} className="flex flex-col items-center justify-center text-center p-8 sm:p-12 bg-white rounded-2xl border border-dashed border-slate-200/80 shadow-sm">
      <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 mb-4 border border-slate-100">
        {icon || <FolderOpen className="w-6 h-6" />}
      </div>
      <h3 className="text-slate-800 font-semibold text-base mb-1">{title}</h3>
      <p className="text-slate-400 text-sm max-w-sm mb-5 leading-relaxed">{description}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="px-4 py-2 text-sm bg-slate-900 text-white rounded-xl font-medium hover:bg-slate-800 transition-all duration-150 active:scale-95 cursor-pointer shadow-sm"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
