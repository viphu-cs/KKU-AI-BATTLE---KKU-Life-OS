import React from "react";
import { AlertCircle, Calendar, Tag } from "lucide-react";
import { Announcement } from "../types";
import { formatHumanDate } from "../utils/date";

interface AnnouncementCardProps {
  key?: React.Key;
  announcement: Announcement & { source?: string; sender?: string };
  compact?: boolean;
  onClick?: () => void;
}

export default function AnnouncementCard({ announcement, compact = false, onClick }: AnnouncementCardProps) {
  const isImportant = announcement.isImportant;
  const isGmail = announcement.source === "Gmail";

  const categoryColors: Record<string, string> = {
    Competition: "bg-orange-50 text-orange-600 border-orange-100",
    Academic: "bg-blue-50 text-blue-600 border-blue-100",
    Registration: "bg-indigo-50 text-indigo-600 border-indigo-100",
    Services: "bg-emerald-50 text-emerald-600 border-emerald-100",
    "Campus Life": "bg-purple-50 text-purple-600 border-purple-100",
    "From KKU": "bg-amber-50 text-amber-700 border-amber-200",
  };

  const getCategoryClass = (cat: string) => {
    return categoryColors[cat] || "bg-slate-50 text-slate-500 border-slate-100";
  };

  return (
    <div 
      id={`announcement-card-${announcement.id}`}
      onClick={onClick}
      className={`bg-white rounded-2xl border transition-all duration-200 p-5 ${
        onClick ? "cursor-pointer hover:-translate-y-0.5" : ""
      } ${
        isImportant 
          ? "border-rose-200/80 bg-rose-50/20 shadow-sm shadow-rose-100/50 hover:border-rose-300" 
          : "border-slate-100 hover:border-slate-200 shadow-sm hover:shadow-md"
      }`}
    >
      <div className="flex flex-col gap-3">
        {/* Header - Category and tags */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            {isGmail ? (
              <span className="text-[10px] px-2.5 py-0.5 rounded-md font-extrabold bg-gradient-to-r from-orange-500 to-amber-500 text-white border border-orange-200 shadow-xs">
                📢 KKU Official Announcement
              </span>
            ) : (
              <span className={`text-[10px] px-2.5 py-0.5 rounded-md font-semibold border ${getCategoryClass(announcement.category)}`}>
                {announcement.category}
              </span>
            )}
            
            {isImportant && (
              <span className="inline-flex items-center gap-1 text-[10px] px-2.5 py-0.5 rounded-md font-bold bg-rose-100 text-rose-700 border border-rose-200">
                <AlertCircle className="w-3 h-3 animate-bounce" />
                Important
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-1 text-slate-400 text-xs font-medium shrink-0">
            <Calendar className="w-3.5 h-3.5" />
            <span>{formatHumanDate(new Date(announcement.createdAt).toISOString().split("T")[0])}</span>
          </div>
        </div>

        {/* Content body */}
        <div>
          <h3 className={`font-bold text-slate-800 tracking-tight leading-snug ${compact ? "text-base" : "text-lg"}`}>
            {announcement.title}
          </h3>
          <p className="text-slate-400 text-xs mt-1 font-semibold block truncate">
            {announcement.sender || "KKU OS Announcement Team"}
          </p>
          <p className={`text-slate-500 text-sm mt-1.5 leading-relaxed ${compact ? "line-clamp-2" : "line-clamp-3"}`}>
            {announcement.description}
          </p>
        </div>
      </div>
    </div>
  );
}
