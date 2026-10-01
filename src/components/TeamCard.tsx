import React from "react";
import { Link } from "react-router-dom";
import { Users, BookOpen, ArrowRight } from "lucide-react";
import { Team } from "../types";

interface TeamCardProps {
  key?: React.Key;
  team: Team;
  onJoin: (id: string, current: number, max: number) => void;
  joiningId?: string;
}

export default function TeamCard({ team, onJoin, joiningId }: TeamCardProps) {
  const isFull = team.currentMembers >= team.maxMembers || team.status === "full";
  const isJoining = joiningId === team.id;

  return (
    <div 
      id={`team-card-${team.id}`}
      className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm hover:shadow-md hover:border-slate-200 transition-all duration-200 flex flex-col justify-between h-full"
    >
      <div>
        {/* Course Header */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#F05A22] bg-orange-50/60 border border-orange-100/60 px-2.5 py-1 rounded-lg truncate max-w-[200px]">
            <BookOpen className="w-3.5 h-3.5 text-[#F05A22] shrink-0" />
            {team.course}
          </span>
          <span className={`text-[10px] px-2 py-0.5 rounded-md font-semibold border ${
            isFull 
              ? "bg-slate-50 text-slate-400 border-slate-100" 
              : "bg-emerald-50 text-emerald-600 border-emerald-100"
          }`}>
            {isFull ? "Full" : "Recruiting"}
          </span>
        </div>

        {/* Project Name */}
        <h3 className="font-bold text-slate-900 text-lg leading-snug mb-2">
          {team.title}
        </h3>

        {/* Description */}
        <p className="text-slate-500 text-sm line-clamp-3 mb-4 leading-relaxed">
          {team.description}
        </p>
      </div>

      <div className="space-y-4 pt-3.5 border-t border-slate-50">
        {/* Members ratio progress bar */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span className="flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-slate-400" />
              Members
            </span>
            <span className="font-bold text-slate-700">
              {team.currentMembers} / {team.maxMembers}
            </span>
          </div>
          {/* Progress bar */}
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-300 ${
                isFull ? "bg-slate-400" : "bg-[#F05A22]"
              }`}
              style={{ width: `${(team.currentMembers / team.maxMembers) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Looking for badge / Creator */}
        <div className="flex items-center justify-between gap-2 pt-1 text-xs">
          <span className="text-slate-400 font-medium">
            Host: <span className="text-slate-600 font-semibold">{team.owner}</span>
          </span>
        </div>

        {/* Action button row */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <Link
            id={`view-team-${team.id}`}
            to={`/teams/${team.id}`}
            className="flex items-center justify-center gap-1 text-xs font-semibold text-slate-600 bg-slate-50 hover:bg-slate-100 py-2.5 rounded-xl transition-all duration-150 cursor-pointer border border-slate-100"
          >
            Details <ArrowRight className="w-3.5 h-3.5" />
          </Link>

          <button
            id={`join-team-btn-${team.id}`}
            onClick={() => onJoin(team.id, team.currentMembers, team.maxMembers)}
            disabled={isFull || isJoining}
            className={`text-xs font-semibold py-2.5 px-3 rounded-xl transition-all duration-150 cursor-pointer text-center ${
              isFull
                ? "bg-slate-100 text-slate-400 border border-slate-100 cursor-not-allowed"
                : "bg-[#F05A22] text-white hover:bg-orange-600 shadow-sm hover:shadow-orange-500/10 active:scale-95"
            }`}
          >
            {isJoining ? "Joining..." : isFull ? "Team Full" : "Join Team"}
          </button>
        </div>
      </div>
    </div>
  );
}
