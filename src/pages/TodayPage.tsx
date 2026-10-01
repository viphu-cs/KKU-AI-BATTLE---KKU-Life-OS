import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { 
  CheckSquare, 
  Users, 
  Newspaper, 
  AlertCircle, 
  CheckCircle, 
  ChevronRight, 
  Calendar,
  Sparkles
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { getTasksForUser, updateTaskStatus, deleteTask } from "../services/taskService";
import { 
  getTeams, 
  getAnnouncements, 
  seedDemoDataIfEmpty,
  getTodayDateString 
} from "../firebase/firestore";
import { getKKUAnnouncements } from "../services/gmailService";
import { Task, Team, Announcement } from "../types";
import { getTodayFormatted } from "../utils/date";
import LoadingState from "../components/LoadingState";
import TaskCard from "../components/TaskCard";
import TeamCard from "../components/TeamCard";
import AnnouncementCard from "../components/AnnouncementCard";

export default function TodayPage() {
  const { user, accessToken } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [announcements, setAnnouncements] = useState<(Announcement & { source?: string; sender?: string })[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const todayStr = getTodayDateString();

  useEffect(() => {
    async function fetchData() {
      if (!user) return;
      setIsLoading(true);
      setError("");
      try {
        // Seed first if empty (Announcements & Teams)
        await seedDemoDataIfEmpty();
        
        // Fetch tasks and teams
        const [tasksData, teamsData, annData] = await Promise.all([
          getTasksForUser(user.uid),
          getTeams(),
          getAnnouncements()
        ]);
        
        setTasks(tasksData);
        setTeams(teamsData);

        // Fetch Gmail announcements if logged in and authenticated
        let gmailAnnouncements: any[] = [];
        if (accessToken) {
          try {
            gmailAnnouncements = await getKKUAnnouncements(accessToken, 5);
          } catch (gmailErr) {
            console.error("Gmail error in dashboard:", gmailErr);
          }
        }

        // Map Firestore announcements
        const mappedFirestore = annData.map(ann => ({
          ...ann,
          source: "Firestore",
          sender: "KKU Student OS System",
        }));

        // Map Gmail announcements
        const mappedGmail = gmailAnnouncements.map(ann => ({
          id: ann.id,
          title: ann.title,
          description: ann.description,
          category: ann.category,
          isImportant: ann.isImportant,
          createdAt: ann.createdAt,
          source: "Gmail",
          sender: ann.sender,
        }));

        // Combine and sort by newest first
        const combined = [...mappedGmail, ...mappedFirestore].sort((a, b) => b.createdAt - a.createdAt);
        setAnnouncements(combined);

      } catch (err) {
        console.error("Error loading dashboard data:", err);
        setError("ไม่สามารถโหลดข้อมูลแดชบอร์ดได้สำเร็จ");
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, [user, accessToken, refreshTrigger]);

  const handleCompleteTask = async (taskId: string) => {
    try {
      await updateTaskStatus(taskId, "completed");
      setRefreshTrigger(prev => prev + 1);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (window.confirm("คุณต้องการลบงานนี้ใช่หรือไม่?")) {
      try {
        await deleteTask(taskId);
        setRefreshTrigger(prev => prev + 1);
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleJoinTeam = async (teamId: string, current: number, max: number) => {
    try {
      const { joinTeam } = await import("../firebase/firestore");
      await joinTeam(teamId, current, max);
      setRefreshTrigger(prev => prev + 1);
    } catch (e) {
      console.error(e);
    }
  };

  const getGreeting = () => {
    const hr = new Date().getHours();
    const name = user?.displayName ? user.displayName.split(" ")[0] : "Student";
    if (hr < 12) return `Good Morning, ${name} 👋`;
    if (hr < 17) return `Good Afternoon, ${name} 👋`;
    return `Good Evening, ${name} 👋`;
  };

  if (isLoading) {
    return <LoadingState type="dashboard" />;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-16 bg-white border border-slate-100 rounded-3xl p-8 shadow-sm">
        <AlertCircle className="w-12 h-12 text-rose-500 mb-4 animate-bounce" />
        <h3 className="text-lg font-bold text-slate-800 mb-2">{error}</h3>
        <p className="text-slate-400 text-sm max-w-sm mb-6">เกิดความผิดพลาดในการเชื่อมต่อกับ Firebase โปรดตรวจสอบการเชื่อมต่อของคุณ</p>
        <button 
          onClick={() => setRefreshTrigger(prev => prev + 1)}
          className="px-5 py-2.5 bg-[#F05A22] text-white rounded-xl font-semibold hover:bg-orange-600 transition duration-150 shadow-md shadow-orange-500/10 cursor-pointer"
        >
          ลองใหม่อีกครั้ง
        </button>
      </div>
    );
  }

  // TODAY'S CALCULATIONS
  const pendingTasks = tasks.filter(t => t.status === "pending");
  const completedTasksCount = tasks.filter(t => t.status === "completed").length;
  const totalTasksCount = tasks.length;
  const progressPercent = totalTasksCount > 0 ? Math.round((completedTasksCount / totalTasksCount) * 100) : 0;

  const dueTodayTasks = pendingTasks.filter(t => (t.dueDate || t.deadline) === todayStr);
  const overdueTasks = pendingTasks.filter(t => (t.dueDate || t.deadline) < todayStr);
  const importantAnnouncements = announcements.filter(a => a.isImportant);
  const activeTeams = teams.filter(t => t.status === "open");

  // TODAY'S PRIORITIES (Pending High or Medium priority tasks due today or overdue, sorted by priority)
  const todayPriorities = [...dueTodayTasks, ...overdueTasks].sort((a, b) => {
    const pWeight = { High: 3, Medium: 2, Low: 1 };
    return (pWeight[b.priority || 'Medium'] || 0) - (pWeight[a.priority || 'Medium'] || 0);
  });

  return (
    <div className="space-y-8">
      {/* Welcome & Header Row */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
            {getGreeting()}
          </h2>
          <p className="text-slate-400 font-semibold text-sm flex items-center gap-1.5 mt-1">
            <Calendar className="w-4 h-4 text-[#F05A22]" />
            {getTodayFormatted()}
          </p>
        </div>
        
        {/* Quick status counters */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 bg-slate-50 p-2 rounded-2xl border border-slate-100/80">
          <div className="px-3.5 py-2 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center gap-1.5 text-xs font-bold">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
            {dueTodayTasks.length + overdueTasks.length} Due Tasks
          </div>
          <div className="px-3.5 py-2 rounded-xl bg-amber-50 border border-amber-100 text-amber-600 flex items-center gap-1.5 text-xs font-bold">
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
            {activeTeams.length} Open Teams
          </div>
          <div className="px-3.5 py-2 rounded-xl bg-sky-50 border border-sky-100 text-sky-600 flex items-center gap-1.5 text-xs font-bold">
            <span className="w-2 h-2 rounded-full bg-sky-500 animate-pulse"></span>
            {importantAnnouncements.length} Bulletins
          </div>
        </div>
      </div>

      {/* Grid Layout: Main Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left 2 Columns: Priorities, Progress, and Feeds */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Progress Card */}
          <section className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-emerald-500" />
                Today's Progress
              </h3>
              <span className="text-sm font-bold text-[#F05A22] bg-orange-50 px-2.5 py-1 rounded-lg">
                {completedTasksCount} / {totalTasksCount} Tasks Completed
              </span>
            </div>
            
            {/* Tailwind Progress Bar with aesthetic details */}
            <div className="space-y-3">
              <div className="w-full bg-slate-100 h-4 rounded-full overflow-hidden p-0.5 border border-slate-200/50">
                <div 
                  className="bg-gradient-to-r from-[#F05A22] to-amber-500 h-full rounded-full transition-all duration-500 shadow-xs"
                  style={{ width: `${progressPercent}%` }}
                ></div>
              </div>
              <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
                <span>0% Progress</span>
                <span className="font-extrabold text-slate-600 text-sm">{progressPercent}% Completed</span>
                <span>100% Finished</span>
              </div>
            </div>
          </section>

          {/* Today's Priorities */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-xl tracking-tight">
                🔥 Today's Priorities
              </h3>
              <Link to="/tasks" className="text-xs font-bold text-[#F05A22] hover:text-orange-600 flex items-center gap-0.5 transition">
                View All Tasks <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            {todayPriorities.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {todayPriorities.slice(0, 4).map((task) => (
                  <TaskCard 
                    key={task.id} 
                    task={task} 
                    onComplete={handleCompleteTask} 
                    onDelete={handleDeleteTask} 
                  />
                ))}
              </div>
            ) : (
              <div className="p-6 bg-white border border-slate-100 rounded-2xl text-center space-y-1 shadow-sm">
                <p className="text-emerald-600 font-bold text-base">You're all caught up! 🎉</p>
                <p className="text-slate-400 text-xs">ไม่มีงานด่วนหรือค้างส่งที่ต้องทำในตอนนี้</p>
              </div>
            )}
          </section>

          {/* Featured Recruitment Team Projects */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-xl tracking-tight">
                👥 Recommended Team Projects
              </h3>
              <Link to="/teams" className="text-xs font-bold text-[#F05A22] hover:text-orange-600 flex items-center gap-0.5 transition">
                Explore Teams <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            {activeTeams.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {activeTeams.slice(0, 2).map((team) => (
                  <TeamCard 
                    key={team.id} 
                    team={team} 
                    onJoin={handleJoinTeam} 
                  />
                ))}
              </div>
            ) : (
              <div className="p-6 bg-white border border-slate-100 rounded-2xl text-center space-y-1 shadow-sm">
                <p className="text-slate-500 font-bold text-base">ยังไม่มีกลุ่มเปิดรับสมัคร</p>
                <p className="text-slate-400 text-xs">เข้าร่วมสร้างทีมใหม่เพื่อหาสมาชิกกันเลย!</p>
              </div>
            )}
          </section>

        </div>

        {/* Right 1 Column: Bulletins, Announcements & Campus Info */}
        <div className="space-y-8">
          
          {/* Important Campus Notices */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-xl tracking-tight">
                📢 Bulletins & Feeds
              </h3>
              <Link to="/feed" className="text-xs font-bold text-[#F05A22] hover:text-orange-600 flex items-center gap-0.5 transition">
                View Feed <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="space-y-4">
              {importantAnnouncements.length > 0 ? (
                importantAnnouncements.slice(0, 3).map((ann) => (
                  <AnnouncementCard 
                    key={ann.id} 
                    announcement={ann} 
                    compact={true} 
                  />
                ))
              ) : announcements.length > 0 ? (
                announcements.slice(0, 3).map((ann) => (
                  <AnnouncementCard 
                    key={ann.id} 
                    announcement={ann} 
                    compact={true} 
                  />
                ))
              ) : (
                <div className="p-6 bg-white border border-slate-100 rounded-2xl text-center shadow-sm">
                  <p className="text-slate-400 text-xs">ไม่มีประกาศสำคัญในตอนนี้</p>
                </div>
              )}
            </div>
          </section>

          {/* Quick campus tips */}
          <section className="bg-gradient-to-br from-orange-500/10 via-[#F05A22]/5 to-white border border-orange-100/70 p-5 rounded-3xl shadow-xs space-y-3.5">
            <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-[#F05A22]" />
              KKU LifeOS Advice
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              <strong>"Today" page</strong> acts as your unified dashboard. It tracks all coursework, team deliverables, and campus life events in one place, ensuring you never miss a deadline.
            </p>
            <div className="text-[10px] text-[#F05A22] font-semibold bg-orange-50 border border-orange-100/40 rounded-lg px-2.5 py-1.5 inline-block">
              Tip: Keep your personal tasks updated!
            </div>
          </section>

        </div>

      </div>
    </div>
  );
}
