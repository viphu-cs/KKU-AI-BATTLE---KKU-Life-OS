import { 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  where,
  setDoc 
} from "firebase/firestore";
import { db } from "../firebase/config";
import { Task } from "../types";

const TASKS_COL = "tasks";

/**
 * Fetches all tasks for a specific user (both manual and classroom).
 * Sorts them in-memory to avoid requiring complex Firestore composite indexes.
 */
export async function getTasksForUser(userId: string): Promise<Task[]> {
  try {
    const q = query(collection(db, TASKS_COL), where("userId", "==", userId));
    const snapshot = await getDocs(q);
    
    const tasks: Task[] = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      tasks.push({
        id: doc.id,
        userId: data.userId,
        title: data.title,
        description: data.description || "",
        courseName: data.courseName || data.course || "",
        dueDate: data.dueDate || data.deadline || "",
        priority: data.priority || "Medium",
        status: data.status || "pending",
        source: data.source || "manual",
        classroomCourseId: data.classroomCourseId || null,
        classroomCourseworkId: data.classroomCourseworkId || null,
        classroomUrl: data.classroomUrl || null,
        createdAt: data.createdAt || Date.now(),
        updatedAt: data.updatedAt || Date.now(),
        
        // Backward compatibility
        course: data.courseName || data.course || "",
        deadline: data.dueDate || data.deadline || "",
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
      
      const dateA = a.dueDate ? new Date(a.dueDate).getTime() : 0;
      const dateB = b.dueDate ? new Date(b.dueDate).getTime() : 0;
      if (dateA !== dateB) return dateA - dateB;
      
      const priorityWeight = { High: 3, Medium: 2, Low: 1 };
      return (priorityWeight[b.priority] || 0) - (priorityWeight[a.priority] || 0);
    });
  } catch (error) {
    console.error("Error fetching tasks for user:", error);
    throw error;
  }
}

/**
 * Creates a manual task under a specific user's ID.
 */
export async function createManualTask(
  userId: string, 
  taskData: { title: string; courseName: string; dueDate: string; priority: 'High' | 'Medium' | 'Low'; description?: string }
): Promise<string> {
  try {
    const tasksRef = collection(db, TASKS_COL);
    // Create an empty doc reference to get a generated ID
    const newDocRef = doc(tasksRef);
    
    const newTask: Task = {
      id: newDocRef.id,
      userId: userId,
      title: taskData.title,
      description: taskData.description || "",
      courseName: taskData.courseName,
      dueDate: taskData.dueDate,
      priority: taskData.priority,
      status: "pending",
      source: "manual",
      classroomCourseId: null,
      classroomCourseworkId: null,
      classroomUrl: null,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      
      // Backward compatibility
      course: taskData.courseName,
      deadline: taskData.dueDate,
    };

    await setDoc(newDocRef, newTask);
    return newDocRef.id;
  } catch (error) {
    console.error("Error creating manual task:", error);
    throw error;
  }
}

/**
 * Updates status of a task.
 */
export async function updateTaskStatus(taskId: string, status: 'pending' | 'completed'): Promise<void> {
  try {
    const docRef = doc(db, TASKS_COL, taskId);
    await updateDoc(docRef, {
      status,
      updatedAt: Date.now()
    });
  } catch (error) {
    console.error("Error updating task status:", error);
    throw error;
  }
}

/**
 * Deletes a task.
 */
export async function deleteTask(taskId: string): Promise<void> {
  try {
    const docRef = doc(db, TASKS_COL, taskId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error("Error deleting task:", error);
    throw error;
  }
}
