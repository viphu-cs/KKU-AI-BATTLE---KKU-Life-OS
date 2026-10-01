import { 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  orderBy, 
  serverTimestamp 
} from "firebase/firestore";
import { db, auth } from "./config";
import { Task, Team, Announcement } from "../types";

// Helper to get formatted date string (YYYY-MM-DD)
export function getTodayDateString(offsetDays = 0): string {
  const d = new Date();
  if (offsetDays !== 0) {
    d.setDate(d.getDate() + offsetDays);
  }
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// Collections
const TASKS_COL = "tasks";
const TEAMS_COL = "teams";
const ANNOUNCEMENTS_COL = "announcements";

// --- FIRESTORE ERROR HANDLING AS REQUIRED BY FIREBASE-INTEGRATION SKILL ---
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid || null,
      email: auth.currentUser?.email || null,
      emailVerified: auth.currentUser?.emailVerified || null,
      isAnonymous: auth.currentUser?.isAnonymous || null,
      tenantId: auth.currentUser?.tenantId || null,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Auto-seed function to make the demo immediately alive and beautiful
export async function seedDemoDataIfEmpty() {
  try {
    const tasksSnapshot = await getDocs(collection(db, TASKS_COL));
    const teamsSnapshot = await getDocs(collection(db, TEAMS_COL));
    const announcementsSnapshot = await getDocs(collection(db, ANNOUNCEMENTS_COL));

    const isDbEmpty = tasksSnapshot.empty && teamsSnapshot.empty && announcementsSnapshot.empty;

    if (isDbEmpty) {
      console.log("Database is empty. Seeding gorgeous KKU LifeOS demo data...");

      // 1. Seed Announcements
      const announcementsData: Omit<Announcement, 'id'>[] = [
        {
          title: "KKU AI Battle 2026 Hackathon",
          description: "Registration ends today! Get ready for the biggest AI Hackathon on campus. Grand prize is 50,000 THB with mentor support from top tech industries.",
          category: "Competition",
          isImportant: true,
          createdAt: Date.now() - 3600000 * 4, // 4 hours ago
        },
        {
          title: "Midterm Exam Seat Allocation",
          description: "Please check your midterm exam schedules and seat allocation on the KKU REG portal. Exams begin next Monday at 09:00 AM.",
          category: "Academic",
          isImportant: true,
          createdAt: Date.now() - 3600000 * 24, // 24 hours ago
        },
        {
          title: "Central Library 24/7 Service",
          description: "During the exam weeks, KKU Central Library will be open 24/7 starting today to support all students' study sessions.",
          category: "Campus Life",
          isImportant: false,
          createdAt: Date.now() - 3600000 * 48,
        }
      ];

      for (const item of announcementsData) {
        await addDoc(collection(db, ANNOUNCEMENTS_COL), item);
      }

      // 2. Seed Teams
      const teamsData: Omit<Team, 'id'>[] = [
        {
          title: "Team AI Innovators",
          course: "SC310007 Artificial Intelligence",
          description: "We are building a smart campus navigation app with Gemini API. Looking for an enthusiastic Frontend Developer skilled in Tailwind CSS and React!",
          currentMembers: 2,
          maxMembers: 4,
          owner: "Phu",
          status: "open",
          createdAt: Date.now() - 3600000 * 10,
        },
        {
          title: "DB Design Masterminds",
          course: "SC310002 Database Systems",
          description: "Database normalization group assignment. We have a solid ER diagram and need 1 more member to finalize the SQL statements.",
          currentMembers: 3,
          maxMembers: 4,
          owner: "Jane",
          status: "open",
          createdAt: Date.now() - 3600000 * 5,
        },
        {
          title: "SE Agile Team 9",
          course: "SC310005 Software Engineering",
          description: "Agile group project. Full stack system setup. This team is already complete, just created for logging purposes.",
          currentMembers: 4,
          maxMembers: 4,
          owner: "Mark",
          status: "full",
          createdAt: Date.now() - 3600000 * 48,
        }
      ];

      for (const item of teamsData) {
        await addDoc(collection(db, TEAMS_COL), item);
      }

      console.log("Demo data seeded successfully.");
    }
  } catch (error) {
    console.error("Failed to seed demo data:", error);
  }
}

// --- TASKS CRUD ---

export async function getTasks(): Promise<Task[]> {
  try {
    const queryCol = collection(db, TASKS_COL);
    const snapshot = await getDocs(queryCol);
    const tasks: Task[] = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      tasks.push({
        id: doc.id,
        title: data.title,
        course: data.course,
        deadline: data.deadline,
        priority: data.priority,
        status: data.status || "pending",
        createdAt: data.createdAt || Date.now(),
      } as Task);
    });
    
    // Custom sorting:
    // Completed tasks are sorted last
    // Then pending tasks sorted by deadline ascending
    // If deadline same, sort by priority (High > Medium > Low)
    return tasks.sort((a, b) => {
      if (a.status !== b.status) {
        return a.status === "completed" ? 1 : -1;
      }
      const dateA = new Date(a.deadline).getTime();
      const dateB = new Date(b.deadline).getTime();
      if (dateA !== dateB) return dateA - dateB;
      
      const priorityWeight = { High: 3, Medium: 2, Low: 1 };
      return (priorityWeight[b.priority] || 0) - (priorityWeight[a.priority] || 0);
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, TASKS_COL);
  }
}

export async function createTask(task: Omit<Task, 'id' | 'createdAt'>): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, TASKS_COL), {
      ...task,
      createdAt: Date.now()
    });
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, TASKS_COL);
  }
}

export async function completeTask(taskId: string): Promise<void> {
  const path = `${TASKS_COL}/${taskId}`;
  try {
    const docRef = doc(db, TASKS_COL, taskId);
    await updateDoc(docRef, {
      status: "completed"
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteTask(taskId: string): Promise<void> {
  const path = `${TASKS_COL}/${taskId}`;
  try {
    const docRef = doc(db, TASKS_COL, taskId);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// --- TEAMS CRUD ---

export async function getTeams(): Promise<Team[]> {
  try {
    const snapshot = await getDocs(collection(db, TEAMS_COL));
    const teams: Team[] = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      teams.push({
        id: doc.id,
        title: data.title,
        course: data.course,
        description: data.description,
        currentMembers: data.currentMembers,
        maxMembers: data.maxMembers,
        owner: data.owner,
        status: data.status,
        createdAt: data.createdAt || Date.now(),
      } as Team);
    });
    
    // Sort by creation time descending
    return teams.sort((a, b) => b.createdAt - a.createdAt);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, TEAMS_COL);
  }
}

export async function createTeam(team: Omit<Team, 'id' | 'currentMembers' | 'status' | 'createdAt'>): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, TEAMS_COL), {
      ...team,
      currentMembers: 1, // Start with 1 member (the owner)
      status: team.maxMembers <= 1 ? "full" : "open",
      createdAt: Date.now()
    });
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, TEAMS_COL);
  }
}

export async function joinTeam(teamId: string, currentMembers: number, maxMembers: number): Promise<void> {
  const path = `${TEAMS_COL}/${teamId}`;
  try {
    const nextMembers = currentMembers + 1;
    const nextStatus = nextMembers >= maxMembers ? "full" : "open";
    const docRef = doc(db, TEAMS_COL, teamId);
    await updateDoc(docRef, {
      currentMembers: nextMembers,
      status: nextStatus
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

// --- ANNOUNCEMENTS CRUD ---

export async function getAnnouncements(): Promise<Announcement[]> {
  try {
    const snapshot = await getDocs(collection(db, ANNOUNCEMENTS_COL));
    const announcements: Announcement[] = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      announcements.push({
        id: doc.id,
        title: data.title,
        description: data.description,
        category: data.category,
        isImportant: !!data.isImportant,
        createdAt: data.createdAt || Date.now(),
      } as Announcement);
    });
    
    // Sort by: isImportant first, then createdAt descending
    return announcements.sort((a, b) => {
      if (a.isImportant !== b.isImportant) {
        return a.isImportant ? -1 : 1;
      }
      return b.createdAt - a.createdAt;
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, ANNOUNCEMENTS_COL);
  }
}
