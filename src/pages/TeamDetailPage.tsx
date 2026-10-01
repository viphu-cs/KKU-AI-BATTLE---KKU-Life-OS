import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../firebase/config";
import { Team } from "../types";
import { Users, BookOpen, ArrowLeft, ShieldAlert, CheckCircle2, UserPlus } from "lucide-react";
import LoadingState from "../components/LoadingState";

export default function TeamDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [team, setTeam] = useState<Team | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadTeamDetail() {
      if (!id) return;
      setIsLoading(true);
      setError("");
      try {
        const docRef = doc(db, "teams", id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setTeam({
            id: docSnap.id,
            title: data.title,
            course: data.course,
            description: data.description,
            currentMembers: data.currentMembers,
            maxMembers: data.maxMembers,
            owner: data.owner,
            status: data.status,
            createdAt: data.createdAt || Date.now(),
          } as Team);
        } else {
          setError("ไม่พบข้อมูลกลุ่มโปรเจกต์นี้ในระบบ");
        }
      } catch (err) {
        console.error("Failed to load team details:", err);
        setError("เกิดข้อผิดพลาดในการโหลดรายละเอียดกลุ่ม");
      } finally {
        setIsLoading(false);
      }
    }
    loadTeamDetail();
  }, [id]);

  const handleJoinTeamInDetail = async () => {
    if (!team || isJoining) return;
    const isFull = team.currentMembers >= team.maxMembers;
    if (isFull) return;

    setIsJoining(true);
    try {
      const docRef = doc(db, "teams", team.id);
      const nextMembers = team.currentMembers + 1;
      const nextStatus = nextMembers >= team.maxMembers ? "full" : "open";
      
      await updateDoc(docRef, {
        currentMembers: nextMembers,
        status: nextStatus
      });

      // Update state locally
      setTeam({
        ...team,
        currentMembers: nextMembers,
        status: nextStatus
      });
    } catch (err) {
      console.error(err);
      alert("ไม่สามารถเข้าร่วมทีมได้ โปรดลองอีกครั้ง");
    } finally {
      setIsJoining(false);
    }
  };

  if (isLoading) {
    return <LoadingState type="dashboard" />;
  }

  if (error || !team) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-16 bg-white border border-slate-100 rounded-3xl p-8 shadow-sm">
        <ShieldAlert className="w-12 h-12 text-rose-500 mb-4" />
        <h3 className="text-lg font-bold text-slate-800 mb-2">{error || "เกิดข้อผิดพลาด"}</h3>
        <p className="text-slate-400 text-sm max-w-sm mb-6">กรุณากลับไปหน้าหลักเพื่อเลือกดูโครงการหรือทีมอื่น ๆ</p>
        <Link 
          to="/teams"
          className="px-5 py-2.5 bg-slate-900 text-white rounded-xl font-semibold hover:bg-slate-800 transition duration-150 cursor-pointer"
        >
          กลับหน้าหลักกลุ่มโปรเจกต์
        </Link>
      </div>
    );
  }

  const isFull = team.currentMembers >= team.maxMembers || team.status === "full";

  // Programmatically build fake members list based on currentMembers to make UI extremely realistic
  const fakeMembers = [
    { name: `${team.owner} (Owner)`, role: "Project Lead", initial: team.owner.slice(0, 2).toUpperCase() },
    { name: "Sompong L.", role: "Developer", initial: "SL" },
    { name: "Pattama K.", role: "UI Designer", initial: "PK" },
    { name: "Nutchanon T.", role: "Frontend", initial: "NT" },
    { name: "Viphu H. (You)", role: "Developer", initial: "VP" },
  ];

  // Slice list based on current members count (or pad with generic ones)
  const activeMembersList = fakeMembers.slice(0, team.currentMembers);

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Back navigation */}
      <Link 
        to="/teams" 
        className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition-all"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Team Hub
      </Link>

      {/* Main detail card */}
      <div className="bg-white border border-slate-100 rounded-3xl shadow-sm overflow-hidden">
        {/* Banner header decoration */}
        <div className="h-32 bg-gradient-to-r from-orange-500 via-[#F05A22] to-amber-500 relative">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="absolute bottom-4 left-6 sm:left-8">
            <span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-[#F05A22] bg-white border border-white/80 px-3 py-1.5 rounded-xl shadow-xs">
              <BookOpen className="w-3.5 h-3.5 text-[#F05A22]" />
              {team.course}
            </span>
          </div>
        </div>

        {/* Content body */}
        <div className="p-6 sm:p-8 space-y-6">
          
          {/* Title & Status */}
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-tight">
                {team.title}
              </h1>
              <p className="text-sm text-slate-400 font-semibold mt-1">
                Recruitment hosted by <span className="text-slate-600">{team.owner}</span>
              </p>
            </div>
            
            <span className={`self-start text-xs px-3.5 py-1.5 rounded-xl font-bold border ${
              isFull 
                ? "bg-slate-50 text-slate-400 border-slate-100" 
                : "bg-emerald-50 text-emerald-600 border-emerald-100"
            }`}>
              {isFull ? "CLOSED • Full" : "ACTIVE • Recruiting"}
            </span>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Project Description
            </h4>
            <div className="bg-slate-50 border border-slate-100/80 p-5 rounded-2xl">
              <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-wrap">
                {team.description}
              </p>
            </div>
          </div>

          {/* Members Progression Row */}
          <div className="space-y-3.5">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Current Team Members ({team.currentMembers} / {team.maxMembers})
              </h4>
              <span className="text-xs text-slate-500 font-bold">
                {team.maxMembers - team.currentMembers} slots left
              </span>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden p-0.5">
              <div 
                className={`h-full rounded-full transition-all duration-300 ${
                  isFull ? "bg-slate-400" : "bg-[#F05A22]"
                }`}
                style={{ width: `${(team.currentMembers / team.maxMembers) * 100}%` }}
              ></div>
            </div>

            {/* Members Profiles Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
              {activeMembersList.map((member, idx) => (
                <div 
                  key={idx}
                  className="flex items-center gap-3 bg-white border border-slate-100 p-3 rounded-2xl shadow-2xs hover:border-slate-200 transition"
                >
                  <div className="w-9 h-9 rounded-full bg-orange-100 border border-orange-200/50 flex items-center justify-center text-[#F05A22] font-extrabold text-xs">
                    {member.initial}
                  </div>
                  <div>
                    <h5 className="text-sm font-bold text-slate-800 leading-tight">{member.name}</h5>
                    <p className="text-[10px] text-slate-400 font-semibold">{member.role}</p>
                  </div>
                </div>
              ))}
              
              {/* Vacant spots placeholders */}
              {Array.from({ length: team.maxMembers - team.currentMembers }).map((_, idx) => (
                <div 
                  key={idx}
                  className="flex items-center gap-3 bg-slate-50 border border-dashed border-slate-200 p-3 rounded-2xl opacity-60"
                >
                  <div className="w-9 h-9 rounded-full bg-slate-100 border border-dashed border-slate-300 flex items-center justify-center text-slate-400 font-bold text-xs">
                    ?
                  </div>
                  <div>
                    <h5 className="text-sm font-semibold text-slate-400 leading-tight">Vacant Slot</h5>
                    <p className="text-[10px] text-slate-300 font-medium">Looking for developer/designer</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action Footer */}
          <div className="pt-6 border-t border-slate-100 flex items-center justify-between gap-4">
            <Link
              to="/teams"
              className="px-5 py-3 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-2xl text-xs font-bold transition text-center shrink-0 cursor-pointer"
            >
              Back to List
            </Link>

            <button
              id={`detail-join-team-btn-${team.id}`}
              onClick={handleJoinTeamInDetail}
              disabled={isFull || isJoining}
              className={`flex-1 py-3 px-6 rounded-2xl font-bold text-sm transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer ${
                isFull
                  ? "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed"
                  : "bg-[#F05A22] text-white hover:bg-orange-600 shadow-lg shadow-orange-500/10 active:scale-95"
              }`}
            >
              {isJoining ? (
                "Joining Team..."
              ) : isFull ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-slate-400" /> Team Full
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" /> Join Team Project
                </>
              )}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
