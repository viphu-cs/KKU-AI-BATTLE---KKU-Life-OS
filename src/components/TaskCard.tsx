import React from "react";
import { Check, Trash2, Calendar, BookOpen, User, Edit2 } from "lucide-react";
import { Task } from "../types";
import { getTodayDateString, formatHumanDate } from "../utils/date";

interface TaskCardProps {
  key?: React.Key;
  task: Task;
  onComplete: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit?: (task: Task) => void;
}

export default function TaskCard({ task, onComplete, onDelete, onEdit }: TaskCardProps) {
  const todayStr = getTodayDateString();
  const isCompleted = task.status === "completed";
  
  // Safe fallbacks for backward compatibility
  const courseName = task.courseName || task.course || "No Course";
  const dueDate = task.dueDate || task.deadline || todayStr;
  const source = task.source || "manual";
  
  // Determine tomorrow's date string for "Due Tomorrow"
  const d = new Date();
  d.setDate(d.getDate() + 1);
  const tomorrowStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

  // Determine due badge
  let dueLabel = "";
  let dueColorClass = "";
  
  if (isCompleted) {
    dueLabel = "✓ Completed";
    dueColorClass = "bg-green-50 text-green-600 border border-green-100 font-bold";
  } else if (dueDate < todayStr) {
    dueLabel = "🔴 Overdue";
    dueColorClass = "bg-rose-50 text-rose-600 border border-rose-100 font-extrabold animate-pulse";
  } else if (dueDate === todayStr) {
    dueLabel = "🔴 Due Today";
    dueColorClass = "bg-rose-50 text-rose-600 border border-rose-100 font-bold";
  } else if (dueDate === tomorrowStr) {
    dueLabel = "🟡 Due Tomorrow";
    dueColorClass = "bg-amber-50 text-amber-600 border border-amber-100 font-semibold";
  } else {
    dueLabel = "🟢 Upcoming";
    dueColorClass = "bg-emerald-50 text-emerald-600 border border-emerald-100 font-medium";
  }

  const priorityColors = {
    High: "bg-red-50 text-red-600 border-red-100",
    Medium: "bg-amber-50 text-amber-600 border-amber-100",
    Low: "bg-emerald-50 text-emerald-600 border-emerald-100",
  };

  return (
    <div 
      id={`task-card-${task.id}`}
      className={`group bg-white p-5 rounded-2xl border transition-all duration-200 flex flex-col justify-between h-full ${
        isCompleted 
          ? "border-slate-100 opacity-75 shadow-none" 
          : "border-slate-100 hover:border-slate-200 shadow-sm hover:shadow-md hover:-translate-y-0.5"
      }`}
    >
      <div>
        {/* Header - Course and Source Badge */}
        <div className="flex flex-col gap-2.5 mb-3.5">
          <div className="flex items-center justify-between gap-2">
            {/* Source Badge */}
            {source === "classroom" ? (
              <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                <BookOpen className="w-3 h-3" />
                Google Classroom
              </span>
            ) : (
              <span className="flex items-center gap-1 text-[10px] font-bold text-slate-600 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100">
                <User className="w-3 h-3" />
                My Task
              </span>
            )}

            <div className="flex items-center gap-1.5">
              {dueLabel && (
                <span className={`text-[10px] px-2 py-0.5 rounded-md font-medium ${dueColorClass}`}>
                  {dueLabel}
                </span>
              )}
              <span className={`text-[10px] px-2 py-0.5 rounded-md font-semibold border ${priorityColors[task.priority || 'Medium']}`}>
                {task.priority || 'Medium'} Priority
              </span>
            </div>
          </div>

          <span className="text-xs font-semibold text-slate-400 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100 max-w-full truncate block">
            {courseName}
          </span>
        </div>

        {/* Task Title */}
        <h3 className={`font-bold text-slate-800 text-base leading-snug mb-3 ${isCompleted ? "line-through text-slate-400" : ""}`}>
          {task.title}
        </h3>

        {/* Task Description (If present) */}
        {task.description && (
          <p className="text-xs text-slate-400 line-clamp-2 mb-3">
            {task.description}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-3">
        {source === "classroom" && task.classroomUrl && (
          <a
            href={task.classroomUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-bold text-[#F05A22] bg-orange-50 hover:bg-orange-100 hover:text-orange-700 border border-orange-100 rounded-xl transition duration-150 w-full"
          >
            Open in Classroom
          </a>
        )}

        <div className="border-t border-slate-50 pt-3 flex items-center justify-between">
          {/* Deadline Info */}
          <div className="flex items-center gap-1.5 text-slate-400 text-xs">
            <Calendar className="w-3.5 h-3.5" />
            <span className={dueDate < todayStr && !isCompleted ? "text-red-600 font-medium" : ""}>
              {formatHumanDate(dueDate)}
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            {!isCompleted && (
              <button
                onClick={() => onComplete(task.id)}
                id={`complete-task-${task.id}`}
                className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded-lg transition-all duration-150 cursor-pointer border border-emerald-100 active:scale-90"
                title="Mark as completed"
              >
                <Check className="w-4 h-4 stroke-[3]" />
              </button>
            )}

            {source === "manual" && onEdit && (
              <button
                onClick={() => onEdit(task)}
                id={`edit-task-${task.id}`}
                className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg transition-all duration-150 cursor-pointer border border-blue-100 active:scale-90"
                title="Edit task"
              >
                <Edit2 className="w-4 h-4" />
              </button>
            )}
            
            <button
              onClick={() => onDelete(task.id)}
              id={`delete-task-${task.id}`}
              className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-500 rounded-lg transition-all duration-150 cursor-pointer border border-rose-100 active:scale-90 opacity-40 group-hover:opacity-100"
              title="Delete task"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
