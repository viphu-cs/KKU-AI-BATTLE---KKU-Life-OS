import React from "react";

interface LoadingStateProps {
  id?: string;
  count?: number;
  type?: "list" | "card" | "dashboard";
}

export default function LoadingState({ id, count = 3, type = "list" }: LoadingStateProps) {
  return (
    <div id={id || "loading-state"} className="space-y-4 w-full animate-pulse">
      {type === "list" && (
        <div className="space-y-3">
          {Array.from({ length: count }).map((_, idx) => (
            <div key={idx} className="bg-white p-4 rounded-xl border border-slate-100 flex items-center justify-between">
              <div className="space-y-2 flex-1">
                <div className="h-4 bg-slate-200 rounded-md w-1/3"></div>
                <div className="h-3 bg-slate-100 rounded-md w-1/4"></div>
              </div>
              <div className="h-8 bg-slate-200 rounded-lg w-20"></div>
            </div>
          ))}
        </div>
      )}

      {type === "card" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: count }).map((_, idx) => (
            <div key={idx} className="bg-white p-5 rounded-2xl border border-slate-100 space-y-4">
              <div className="space-y-2">
                <div className="h-3 bg-slate-100 rounded-md w-1/4"></div>
                <div className="h-5 bg-slate-200 rounded-md w-3/4"></div>
              </div>
              <div className="h-16 bg-slate-50 rounded-xl"></div>
              <div className="flex justify-between items-center pt-2">
                <div className="h-4 bg-slate-200 rounded-md w-24"></div>
                <div className="h-8 bg-slate-200 rounded-lg w-16"></div>
              </div>
            </div>
          ))}
        </div>
      )}

      {type === "dashboard" && (
        <div className="space-y-6">
          <div className="space-y-2">
            <div className="h-4 bg-slate-100 rounded-md w-28"></div>
            <div className="h-8 bg-slate-200 rounded-md w-56"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="h-28 bg-white border border-slate-100 rounded-2xl p-5 space-y-3">
              <div className="h-4 bg-slate-200 rounded w-1/3"></div>
              <div className="h-8 bg-slate-200 rounded w-1/2"></div>
            </div>
            <div className="h-28 bg-white border border-slate-100 rounded-2xl p-5 space-y-3">
              <div className="h-4 bg-slate-200 rounded w-1/3"></div>
              <div className="h-8 bg-slate-200 rounded w-1/2"></div>
            </div>
            <div className="h-28 bg-white border border-slate-100 rounded-2xl p-5 space-y-3">
              <div className="h-4 bg-slate-200 rounded w-1/3"></div>
              <div className="h-8 bg-slate-200 rounded w-1/2"></div>
            </div>
          </div>
          <div className="h-64 bg-white border border-slate-100 rounded-2xl"></div>
        </div>
      )}
    </div>
  );
}
