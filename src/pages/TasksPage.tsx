import React, { useEffect, useState } from "react";
import { Plus, CheckSquare, Search, BookOpen, RefreshCw, AlertCircle, Sparkles } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { 
  getTasksForUser, 
  createManualTask, 
  updateTaskStatus, 
  deleteTask 
} from "../services/taskService";
import { syncClassroomTasks } from "../services/classroomService";
import { Task } from "../types";
import TaskCard from "../components/TaskCard";
import CreateTaskModal from "../components/CreateTaskModal";
import LoadingState from "../components/LoadingState";
import EmptyState from "../components/EmptyState";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase/config";
import { getTodayDateString } from "../utils/date";

// Overdue utility function
export function isOverdue(task: Task, currentDateTime: string): boolean {
  if (task.status === "completed") return false;
  const dueDate = task.dueDate || task.deadline || "";
  return dueDate < currentDateTime;
}

export default function TasksPage() {
  const { user, accessToken, connectGoogleClassroom } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);
  
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  
  // Filters and Search
  const [searchQuery, setSearchQuery] = useState("");
  const [sourceFilter, setSourceFilter] = useState<"all" | "overdue" | "classroom" | "manual">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "completed">("all");
  
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);

  // Load user tasks
  useEffect(() => {
    async function loadTasks() {
      if (!user) return;
      setIsLoading(true);
      setError("");
      try {
        const fetchedTasks = await getTasksForUser(user.uid);
        setTasks(fetchedTasks);
      } catch (err) {
        console.error("Failed to load tasks:", err);
        setError("ไม่สามารถโหลดรายการงานได้ในขณะนี้");
      } finally {
        setIsLoading(false);
      }
    }
    loadTasks();
  }, [user, refreshTrigger]);

  const handleSyncClassroom = async () => {
    if (!user) return;
    setIsSyncing(true);
    setError("");
    setSuccessMessage("");
    try {
      let token = accessToken;
      if (!token) {
        // If no token in cache, prompt to connect Google Classroom
        token = await connectGoogleClassroom();
      }
      
      const result = await syncClassroomTasks(token, user.uid);
      setSuccessMessage(`ซิงค์ข้อมูลจาก Google Classroom สำเร็จ! (เพิ่มใหม่ ${result.synced} งาน, อัปเดต ${result.updated} งาน)`);
      setRefreshTrigger(prev => prev + 1);
    } catch (err: any) {
      console.error("Sync failed:", err);
      setError("การซิงค์ล้มเหลว กรุณาตรวจสอบสิทธิ์การเข้าถึง Google Classroom และลองอีกครั้ง");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleCreateOrUpdateTask = async (taskData: { title: string; course: string; deadline: string; priority: 'High' | 'Medium' | 'Low' }) => {
    if (!user) return;
    try {
      if (taskToEdit) {
        // Edit mode
        const taskRef = doc(db, "tasks", taskToEdit.id);
        await updateDoc(taskRef, {
          title: taskData.title,
          courseName: taskData.course,
          dueDate: taskData.deadline,
          priority: taskData.priority,
          
          // Backward compatibility
          course: taskData.course,
          deadline: taskData.deadline,
          updatedAt: Date.now()
        });
        setSuccessMessage("อัปเดตงานสำเร็จ!");
      } else {
        // Create mode
        await createManualTask(user.uid, {
          title: taskData.title,
          courseName: taskData.course,
          dueDate: taskData.deadline,
          priority: taskData.priority,
          description: ""
        });
        setSuccessMessage("สร้างงานใหม่สำเร็จ!");
      }
      setTaskToEdit(null);
      setRefreshTrigger(prev => prev + 1);
    } catch (err) {
      console.error("Error creating/updating task:", err);
      throw err;
    }
  };

  const handleCompleteTask = async (taskId: string) => {
    try {
      await updateTaskStatus(taskId, "completed");
      setRefreshTrigger(prev => prev + 1);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (window.confirm("คุณต้องการลบงานนี้ใช่หรือไม่?")) {
      try {
        await deleteTask(taskId);
        setRefreshTrigger(prev => prev + 1);
        setSuccessMessage("ลบงานสำเร็จ!");
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleEditClick = (task: Task) => {
    setTaskToEdit(task);
    setIsModalOpen(true);
  };

  const todayStr = getTodayDateString();
  const d = new Date();
  d.setDate(d.getDate() + 1);
  const tomorrowStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

  const pendingCount = tasks.filter(t => t.status === "pending").length;

  // 1. Search filter pool for total tab counts
  const searchFilteredTasks = tasks.filter((t) => {
    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase();
      const matchTitle = t.title.toLowerCase().includes(q);
      const matchDesc = (t.description || "").toLowerCase().includes(q);
      const matchCourse = (t.courseName || t.course || "").toLowerCase().includes(q);
      return matchTitle || matchDesc || matchCourse;
    }
    return true;
  });

  // 2. Count calculations for SOURCE filter buttons
  const countAll = searchFilteredTasks.length;
  const countOverdue = searchFilteredTasks.filter(t => isOverdue(t, todayStr)).length;
  const countClassroom = searchFilteredTasks.filter(t => (t.source || "manual") === "classroom").length;
  const countManual = searchFilteredTasks.filter(t => (t.source || "manual") !== "classroom").length;

  // 3. Filter by SOURCE / TYPE
  const sourceFilteredPool = searchFilteredTasks.filter((t) => {
    const source = t.source || "manual";
    if (sourceFilter === "overdue") {
      return isOverdue(t, todayStr);
    } else if (sourceFilter !== "all") {
      return source === sourceFilter;
    }
    return true;
  });

  // 4. Count calculations for STATUS filter buttons (dynamically matches chosen Source)
  const countAllStatus = sourceFilteredPool.length;
  const countPending = sourceFilteredPool.filter(t => t.status !== "completed").length;
  const countCompleted = sourceFilteredPool.filter(t => t.status === "completed").length;

  // 5. Filter by STATUS
  const finalFilteredTasks = sourceFilteredPool.filter((t) => {
    if (statusFilter === "pending" && t.status !== "pending") return false;
    if (statusFilter === "completed" && t.status !== "completed") return false;
    return true;
  });

  // Helper to determine sorting group/bucket (1 to 5)
  const getTaskGroupAndWeight = (task: Task) => {
    const dueDate = task.dueDate || task.deadline || "";
    const isCompleted = task.status === "completed";

    if (isCompleted) {
      return { group: 5, label: "Completed" };
    }
    if (isOverdue(task, todayStr)) {
      return { group: 1, label: "Overdue" };
    }
    if (dueDate === todayStr) {
      return { group: 2, label: "Due Today" };
    }
    if (dueDate === tomorrowStr) {
      return { group: 3, label: "Due Tomorrow" };
    }
    return { group: 4, label: "Future" };
  };

  // 6. Sort all tasks matching the requirements (Section 6)
  const sortedTasks = [...finalFilteredTasks].sort((a, b) => {
    const infoA = getTaskGroupAndWeight(a);
    const infoB = getTaskGroupAndWeight(b);

    if (infoA.group !== infoB.group) {
      return infoA.group - infoB.group;
    }

    const dateA = a.dueDate || a.deadline || "";
    const dateB = b.dueDate || b.deadline || "";

    if (dateA !== dateB) {
      if (infoA.group === 1) {
        // Overdue pending: closest to today first (descending, e.g. 20 July then 19 July)
        return dateB.localeCompare(dateA);
      } else {
        // Other groups: closest to today first (ascending, e.g. tomorrow then next week)
        if (!dateA) return 1;
        if (!dateB) return -1;
        return dateA.localeCompare(dateB);
      }
    }

    // Secondary sort: Priority
    const priorityWeight: Record<string, number> = { High: 3, Medium: 2, Low: 1 };
    const pA = a.priority || "Medium";
    const pB = b.priority || "Medium";
    return (priorityWeight[pB] || 0) - (priorityWeight[pA] || 0);
  });

  // Split into pending and completed groups for visual split rendering
  const pendingTasks = sortedTasks.filter(t => t.status !== "completed");
  const completedTasks = sortedTasks.filter(t => t.status === "completed");

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-xs">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <CheckSquare className="w-7 h-7 text-[#F05A22]" />
            Task Manager
          </h2>
          <p className="text-slate-400 text-sm font-semibold mt-1">
            คุณมีงานค้างส่งอยู่ทั้งหมด <span className="text-[#F05A22] font-bold">{pendingCount} งาน</span> สำหรับภาคการศึกษานี้
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Sync Button */}
          <button
            onClick={handleSyncClassroom}
            disabled={isSyncing}
            className={`flex items-center justify-center gap-2 px-4 py-3 rounded-2xl text-xs font-bold transition border border-emerald-150 cursor-pointer text-emerald-700 bg-emerald-50 hover:bg-emerald-100 active:scale-95 disabled:opacity-50`}
          >
            <BookOpen className="w-4 h-4" />
            {isSyncing ? "Syncing..." : "Sync Google Classroom"}
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? "animate-spin" : ""}`} />
          </button>

          {/* Add Button */}
          <button
            onClick={() => {
              setTaskToEdit(null);
              setIsModalOpen(true);
            }}
            id="add-task-btn"
            className="bg-[#F05A22] text-white hover:bg-orange-600 transition font-bold px-5 py-3 rounded-2xl shadow-md shadow-orange-500/10 flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
          >
            <Plus className="w-5 h-5" /> Add New Task
          </button>
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-100 text-rose-600 rounded-2xl text-sm font-semibold flex items-center gap-2 animate-fade-in">
          <AlertCircle className="w-5 h-5 text-rose-500 flex-shrink-0" />
          {error}
        </div>
      )}

      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-2xl text-sm font-semibold flex items-center gap-2 animate-fade-in">
          <Sparkles className="w-5 h-5 text-emerald-500 flex-shrink-0" />
          {successMessage}
        </div>
      )}

      {/* Search and Advanced Filters Card */}
      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs space-y-4">
        {/* Search Input */}
        <div className="relative max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
          <input
            type="text"
            placeholder="ค้นหาชื่องาน รายวิชา หรือรายละเอียด..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10.5 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:border-[#F05A22] text-sm text-slate-800 transition"
          />
        </div>

        {/* Filters Group Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-50">
          {/* Source/Type Filter */}
          <div className="space-y-2">
            <span className="text-[11px] font-extrabold text-slate-400 tracking-wider uppercase block">SOURCE</span>
            <div className="flex flex-wrap items-center gap-1.5">
              {([
                { value: "all", label: "All", count: countAll },
                { value: "overdue", label: "Overdue 🔴", count: countOverdue },
                { value: "classroom", label: "Google Classroom", count: countClassroom },
                { value: "manual", label: "My Tasks", count: countManual }
              ] as const).map((tab) => (
                <button
                  key={tab.value}
                  onClick={() => {
                    setSourceFilter(tab.value);
                    // Reset statusFilter if overdue is selected to avoid contradictory state
                    if (tab.value === "overdue") {
                      setStatusFilter("all");
                    }
                  }}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition duration-150 cursor-pointer border flex items-center gap-1.5 ${
                    sourceFilter === tab.value
                      ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                      : "bg-white border-slate-200 text-slate-500 hover:text-slate-800 hover:border-slate-300"
                  }`}
                >
                  <span>{tab.label}</span>
                  <span className={`text-[10px] px-1.5 py-0.25 rounded-md ${
                    sourceFilter === tab.value 
                      ? "bg-white/20 text-white" 
                      : tab.value === "overdue" && tab.count > 0
                        ? "bg-rose-100 text-rose-700 font-black"
                        : "bg-slate-100 text-slate-600"
                  }`}>
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Status Filter */}
          <div className="space-y-2">
            <span className="text-[11px] font-extrabold text-slate-400 tracking-wider uppercase block">STATUS</span>
            <div className="flex flex-wrap items-center gap-1.5">
              {([
                { value: "all", label: "All Statuses", count: countAllStatus },
                { value: "pending", label: "Pending", count: countPending },
                { value: "completed", label: "Completed", count: countCompleted }
              ] as const).map((tab) => (
                <button
                  key={tab.value}
                  onClick={() => setStatusFilter(tab.value)}
                  disabled={sourceFilter === "overdue" && tab.value === "completed"}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition duration-150 cursor-pointer border flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed ${
                    statusFilter === tab.value
                      ? "bg-[#F05A22] text-white border-[#F05A22] shadow-xs"
                      : "bg-white border-slate-200 text-slate-500 hover:text-slate-800 hover:border-slate-300"
                  }`}
                >
                  <span>{tab.label}</span>
                  <span className={`text-[10px] px-1.5 py-0.25 rounded-md ${
                    statusFilter === tab.value 
                      ? "bg-white/20 text-white" 
                      : "bg-slate-100 text-slate-600"
                  }`}>
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main tasks display */}
      {isLoading ? (
        <LoadingState type="list" count={4} />
      ) : sortedTasks.length > 0 ? (
        <div className="space-y-8 animate-fade-in">
          {/* Pending Tasks Section */}
          {pendingTasks.length > 0 && (
            <div className="space-y-4">
              {statusFilter === "all" && completedTasks.length > 0 && (
                <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#F05A22]"></span>
                  <h3 className="text-lg font-black text-slate-800 tracking-tight">
                    งานที่ต้องจัดการ ({pendingTasks.length})
                  </h3>
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {pendingTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onComplete={handleCompleteTask}
                    onDelete={handleDeleteTask}
                    onEdit={handleEditClick}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Divider between Pending and Completed */}
          {pendingTasks.length > 0 && completedTasks.length > 0 && (
            <div className="relative py-4">
              <div className="absolute inset-0 flex items-center" aria-hidden="true">
                <div className="w-full border-t border-slate-200/80 border-dashed" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-slate-50 px-4 text-xs font-bold text-slate-400 uppercase tracking-widest">
                  Completed / สำเร็จแล้ว
                </span>
              </div>
            </div>
          )}

          {/* Completed Tasks Section */}
          {completedTasks.length > 0 && (
            <div className="space-y-4">
              {(statusFilter === "all" || statusFilter === "completed") && (
                <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                  <span className="w-2.5 h-2.5 rounded-full bg-green-500"></span>
                  <h3 className="text-lg font-black text-slate-800 tracking-tight">
                    งานที่เสร็จสิ้นแล้ว ({completedTasks.length})
                  </h3>
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {completedTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onComplete={handleCompleteTask}
                    onDelete={handleDeleteTask}
                    onEdit={handleEditClick}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Dynamic Empty States matching requirements from Section 10 */
        <EmptyState
          title={
            sourceFilter === "overdue"
              ? "🎉 You're all caught up!"
              : statusFilter === "completed"
              ? "No completed tasks yet."
              : statusFilter === "pending"
              ? "You're all caught up!"
              : "No tasks yet."
          }
          description={
            sourceFilter === "overdue"
              ? "No overdue tasks."
              : statusFilter === "completed"
              ? "คุณยังไม่มีงานที่ทำเครื่องหมายว่าเสร็จสิ้นแล้ว"
              : statusFilter === "pending"
              ? "ไม่มีงานค้างที่ต้องจัดการในขณะนี้!"
              : "ยังไม่มีรายการงานในระบบ เริ่มสร้างงานของคุณหรือเชื่อมต่อกับ Google Classroom เลย!"
          }
          action={
            sourceFilter !== "overdue" && statusFilter !== "completed" && tasks.length === 0
              ? {
                  label: "สร้างงานเขียนขึ้นเอง",
                  onClick: () => {
                    setTaskToEdit(null);
                    setIsModalOpen(true);
                  },
                }
              : undefined
          }
        />
      )}

      {/* Modals */}
      <CreateTaskModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setTaskToEdit(null);
        }}
        onSubmit={handleCreateOrUpdateTask}
        taskToEdit={taskToEdit}
      />
    </div>
  );
}
