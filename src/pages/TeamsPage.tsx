import React, { useEffect, useState } from "react";
import { Plus, Users, Sparkles } from "lucide-react";
import { getTeams, createTeam, joinTeam } from "../firebase/firestore";
import { Team } from "../types";
import TeamCard from "../components/TeamCard";
import CreateTeamModal from "../components/CreateTeamModal";
import LoadingState from "../components/LoadingState";
import EmptyState from "../components/EmptyState";

export default function TeamsPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [joiningId, setJoiningId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<"all" | "open" | "full">("all");
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    async function loadTeams() {
      setIsLoading(true);
      setError("");
      try {
        const fetchedTeams = await getTeams();
        setTeams(fetchedTeams);
      } catch (err) {
        console.error("Failed to load teams:", err);
        setError("ไม่สามารถโหลดข้อมูลทีมทำโปรเจกต์ได้ในขณะนี้");
      } finally {
        setIsLoading(false);
      }
    }
    loadTeams();
  }, [refreshTrigger]);

  const handleCreateTeam = async (teamData: { title: string; course: string; description: string; maxMembers: number; owner: string }) => {
    try {
      await createTeam(teamData);
      setRefreshTrigger(prev => prev + 1);
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  const handleJoinTeam = async (teamId: string, current: number, max: number) => {
    if (joiningId) return;
    setJoiningId(teamId);
    try {
      await joinTeam(teamId, current, max);
      setRefreshTrigger(prev => prev + 1);
    } catch (err) {
      console.error(err);
    } finally {
      setJoiningId(null);
    }
  };

  const filteredTeams = teams.filter((t) => {
    if (filter === "open") return t.currentMembers < t.maxMembers && t.status === "open";
    if (filter === "full") return t.currentMembers >= t.maxMembers || t.status === "full";
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Users className="w-7 h-7 text-[#F05A22]" />
            Team Hub
          </h2>
          <p className="text-slate-400 text-sm font-semibold mt-1">
            ค้นหาและเข้าร่วมทีมทำโปรเจกต์ ประกาศหาเพื่อนร่วมกลุ่มสำหรับงานวิชาต่าง ๆ ใน KKU
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          id="create-team-btn"
          className="bg-[#F05A22] text-white hover:bg-orange-600 transition font-bold px-5 py-3 rounded-2xl shadow-md shadow-orange-500/10 flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
        >
          <Plus className="w-5 h-5" /> Recruitment Post
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {(["all", "open", "full"] as const).map((tab) => (
          <button
            key={tab}
            id={`team-filter-${tab}`}
            onClick={() => setFilter(tab)}
            className={`px-4.5 py-2 rounded-xl text-xs font-bold capitalize transition duration-150 cursor-pointer border ${
              filter === tab
                ? "bg-slate-950 text-white border-slate-950 shadow-xs"
                : "bg-white border-slate-150 text-slate-500 hover:text-slate-800 hover:border-slate-300"
            }`}
          >
            {tab === "all" ? "All Groups" : tab === "open" ? "Looking for Members" : "Full Groups"}
          </button>
        ))}
      </div>

      {/* Error display */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-100 text-rose-600 rounded-2xl text-sm font-semibold">
          {error}
        </div>
      )}

      {/* Content Grid */}
      {isLoading ? (
        <LoadingState type="card" count={3} />
      ) : filteredTeams.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTeams.map((team) => (
            <TeamCard
              key={team.id}
              team={team}
              onJoin={handleJoinTeam}
              joiningId={joiningId || undefined}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          title="ยังไม่มีทีมที่เปิดรับสมาชิก"
          description={
            filter === "full"
              ? "ยังไม่มีทีมใดที่สมาชิกเต็มในตอนนี้"
              : "ยังไม่มีใครสร้างโพสต์รับสมาชิกในหมวดหมู่นี้ คุณสามารถเริ่มสร้างทีมคนแรกของห้องเรียนได้เลย!"
          }
          action={
            filter !== "full"
              ? {
                  label: "สร้างทีมแรกของคุณ",
                  onClick: () => setIsModalOpen(true),
                }
              : undefined
          }
        />
      )}

      {/* Recruitment Modal */}
      <CreateTeamModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateTeam}
      />
    </div>
  );
}
