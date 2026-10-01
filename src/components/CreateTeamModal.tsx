import React, { useState } from "react";
import { X, Users, PlusCircle } from "lucide-react";

interface CreateTeamModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (team: { title: string; course: string; description: string; maxMembers: number; owner: string }) => Promise<void>;
}

export default function CreateTeamModal({ isOpen, onClose, onSubmit }: CreateTeamModalProps) {
  const [title, setTitle] = useState("");
  const [course, setCourse] = useState("");
  const [description, setDescription] = useState("");
  const [maxMembers, setMaxMembers] = useState(4);
  const [owner, setOwner] = useState("Phu"); // Default to Phu (the demo student)
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !course.trim() || !description.trim() || !owner.trim()) {
      setError("Please fill out all fields.");
      return;
    }
    if (maxMembers < 2 || maxMembers > 10) {
      setError("Maximum members must be between 2 and 10.");
      return;
    }

    setIsSubmitting(true);
    setError("");
    try {
      await onSubmit({
        title: title.trim(),
        course: course.trim(),
        description: description.trim(),
        maxMembers,
        owner: owner.trim()
      });
      // Reset form
      setTitle("");
      setCourse("");
      setDescription("");
      setMaxMembers(4);
      setOwner("Phu");
      onClose();
    } catch (err) {
      setError("Failed to create team. Please try again.");
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
            <Users className="w-5 h-5 text-[#F05A22]" />
            <h3 className="font-bold text-slate-900 text-lg">Create Recruitment Post</h3>
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

          {/* Project Title */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
              Project Name
            </label>
            <input
              type="text"
              id="team-title-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. AI-powered Campus Nav App"
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
              id="team-course-input"
              value={course}
              onChange={(e) => setCourse(e.target.value)}
              placeholder="e.g. SC310007 Artificial Intelligence"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:border-[#F05A22] text-sm text-slate-800 transition"
              required
            />
          </div>

          {/* Max Members */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
              Maximum Members (including Host)
            </label>
            <input
              type="number"
              id="team-max-members-input"
              min="2"
              max="10"
              value={maxMembers}
              onChange={(e) => setMaxMembers(parseInt(e.target.value, 10))}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:border-[#F05A22] text-sm text-slate-800 transition"
              required
            />
          </div>

          {/* Owner/Your Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
              Host Name
            </label>
            <input
              type="text"
              id="team-owner-input"
              value={owner}
              onChange={(e) => setOwner(e.target.value)}
              placeholder="Your Name (e.g. Phu)"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:border-[#F05A22] text-sm text-slate-800 transition"
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
              Project Description & Looking For
            </label>
            <textarea
              id="team-description-input"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tell other students what the project is about and what roles you need (e.g. looking for frontend coder skilled in Tailwind)"
              rows={3}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:border-[#F05A22] text-sm text-slate-800 transition resize-none"
              required
            ></textarea>
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
              id="submit-team-btn"
              disabled={isSubmitting}
              className="flex-1 py-2.5 bg-[#F05A22] text-white rounded-xl text-sm font-semibold hover:bg-orange-600 shadow-md shadow-orange-500/10 active:scale-95 transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              {isSubmitting ? "Creating..." : "Post Recruitment"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
