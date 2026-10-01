import React, { useState, useEffect } from "react";
import { X, CheckSquare } from "lucide-react";
import { getTodayDateString } from "../utils/date";
import { Task } from "../types";

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (task: { title: string; course: string; deadline: string; priority: 'High' | 'Medium' | 'Low' }) => Promise<void>;
  taskToEdit?: Task | null;
}

export default function CreateTaskModal({ isOpen, onClose, onSubmit, taskToEdit }: CreateTaskModalProps) {
  const [title, setTitle] = useState("");
  const [course, setCourse] = useState("");
  const [deadline, setDeadline] = useState(getTodayDateString());
  const [priority, setPriority] = useState<'High' | 'Medium' | 'Low'>("Medium");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (taskToEdit) {
      setTitle(taskToEdit.title);
      setCourse(taskToEdit.courseName || taskToEdit.course || "");
      setDeadline(taskToEdit.dueDate || taskToEdit.deadline || getTodayDateString());
      setPriority(taskToEdit.priority || "Medium");
    } else {
      setTitle("");
      setCourse("");
      setDeadline(getTodayDateString());
      setPriority("Medium");
    }
  }, [taskToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !course.trim() || !deadline) {
      setError("Please fill out all fields.");
      return;
    }
    
    setIsSubmitting(true);
    setError("");
    try {
      await onSubmit({
        title: title.trim(),
        course: course.trim(),
        deadline,
        priority
      });
      onClose();
    } catch (err) {
      setError(taskToEdit ? "Failed to update task. Please try again." : "Failed to create task. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl border border-slate-100 flex flex-col overflow-hidden max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-[#F05A22]" />
            <h3 className="font-bold text-slate-900 text-lg">
              {taskToEdit ? "Edit Task" : "Create New Task"}
            </h3>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-lg transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
          {error && (
            <div className="p-3.5 bg-rose-50 border border-rose-100 text-rose-600 rounded-xl text-xs font-semibold">
              {error}
            </div>
          )}

          {/* Task Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
              Task Name
            </label>
            <input
              type="text"
              id="task-title-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Normalization Homework"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:border-[#F05A22] text-sm text-slate-800 transition"
              required
            />
          </div>

          {/* Course Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
              Course
            </label>
            <input
              type="text"
              id="task-course-input"
              value={course}
              onChange={(e) => setCourse(e.target.value)}
              placeholder="e.g. SC310002 Database Systems"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:border-[#F05A22] text-sm text-slate-800 transition"
              required
            />
          </div>

          {/* Deadline */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
              Deadline
            </label>
            <input
              type="date"
              id="task-deadline-input"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:border-[#F05A22] text-sm text-slate-800 transition"
              required
            />
          </div>

          {/* Priority */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
              Priority
            </label>
            <div className="grid grid-cols-3 gap-2.5">
              {(["Low", "Medium", "High"] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  id={`priority-btn-${p.toLowerCase()}`}
                  onClick={() => setPriority(p)}
                  className={`py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer text-center ${
                    priority === p
                      ? p === "High"
                        ? "bg-rose-50 text-rose-600 border-rose-300 shadow-xs"
                        : p === "Medium"
                        ? "bg-amber-50 text-amber-600 border-amber-300 shadow-xs"
                        : "bg-emerald-50 text-emerald-600 border-emerald-300 shadow-xs"
                      : "bg-white border-slate-200 text-slate-400 hover:border-slate-300"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="pt-4 border-t border-slate-50 flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 border border-slate-200 text-slate-500 rounded-xl text-sm font-semibold hover:bg-slate-50 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              id="submit-task-btn"
              disabled={isSubmitting}
              className="flex-1 py-2.5 bg-[#F05A22] text-white rounded-xl text-sm font-semibold hover:bg-orange-600 shadow-md shadow-orange-500/10 active:scale-95 transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              {isSubmitting 
                ? (taskToEdit ? "Saving..." : "Creating...") 
                : (taskToEdit ? "Save Changes" : "Create Task")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
