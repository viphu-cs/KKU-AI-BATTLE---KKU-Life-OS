import { doc, getDoc, setDoc, collection } from "firebase/firestore";
import { db } from "../firebase/config";
import { Task } from "../types";

export interface ClassroomCourse {
  id: string;
  name: string;
  section?: string;
  descriptionHeading?: string;
  courseState: string;
  alternateLink?: string;
}

export interface ClassroomCourseWork {
  id: string;
  courseId: string;
  title: string;
  description?: string;
  alternateLink?: string;
  state: string;
  dueDate?: {
    year: number;
    month: number;
    day: number;
  };
  dueTime?: {
    hours?: number;
    minutes?: number;
    seconds?: number;
    nanos?: number;
  };
  creationTime: string;
  updateTime: string;
}

export interface ClassroomStudentSubmission {
  id: string;
  courseId: string;
  courseWorkId: string;
  userId: string;
  state: string;
}

/**
 * Fetches courses where the student is active.
 */
export async function fetchActiveCourses(accessToken: string): Promise<ClassroomCourse[]> {
  const url = "https://classroom.googleapis.com/v1/courses?courseStates=ACTIVE";
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch Classroom courses: ${response.statusText}`);
  }

  const data = await response.json();
  return data.courses || [];
}

/**
 * Fetches coursework (assignments) for a specific course.
 */
export async function fetchCourseWork(accessToken: string, courseId: string): Promise<ClassroomCourseWork[]> {
  const url = `https://classroom.googleapis.com/v1/courses/${courseId}/courseWork`;
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    // Graceful handling: if coursework is empty or disabled for a specific course, return empty list
    console.warn(`Could not fetch coursework for course ${courseId}: ${response.statusText}`);
    return [];
  }

  const data = await response.json();
  return data.courseWork || [];
}

/**
 * Fetches student submissions for a specific course.
 */
export async function fetchStudentSubmissions(accessToken: string, courseId: string): Promise<ClassroomStudentSubmission[]> {
  const url = `https://classroom.googleapis.com/v1/courses/${courseId}/courseWork/-/studentSubmissions?userId=me`;
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    console.warn(`Could not fetch student submissions for course ${courseId}: ${response.statusText}`);
    return [];
  }

  const data = await response.json();
  return data.studentSubmissions || [];
}

/**
 * Syncs coursework from Google Classroom to Firestore.
 * Avoids duplicates using deterministic IDs: `classroom_${userId}_${courseworkId}`
 */
export async function syncClassroomTasks(accessToken: string, userId: string): Promise<{ synced: number; updated: number }> {
  try {
    const courses = await fetchActiveCourses(accessToken);
    if (courses.length === 0) {
      return { synced: 0, updated: 0 };
    }

    // Fetch coursework and submissions for all courses in parallel
    const courseWorkPromises = courses.map(async (course) => {
      try {
        const [cws, submissions] = await Promise.all([
          fetchCourseWork(accessToken, course.id),
          fetchStudentSubmissions(accessToken, course.id)
        ]);

        // Map submissions by coursework ID
        const submissionMap = new Map<string, string>();
        submissions.forEach((sub) => {
          if (sub.courseWorkId) {
            submissionMap.set(sub.courseWorkId, sub.state);
          }
        });

        return cws.map((cw) => ({
          ...cw,
          courseName: course.name,
          submissionState: submissionMap.get(cw.id) || null,
        }));
      } catch (err) {
        console.error(`Error fetching coursework or submissions for course ${course.name}:`, err);
        return [];
      }
    });

    const allCourseWorkNested = await Promise.all(courseWorkPromises);
    const allCourseWork = allCourseWorkNested.flat();

    let syncedCount = 0;
    let updatedCount = 0;

    for (const cw of allCourseWork) {
      // Deterministic document ID to prevent duplicates across multiple syncs
      const docId = `classroom_${userId}_${cw.id}`;
      const docRef = doc(db, "tasks", docId);
      
      // Check if document already exists
      const docSnap = await getDoc(docRef);
      const exists = docSnap.exists();

      let existingStatus: "pending" | "completed" = "pending";
      let existingPriority: "High" | "Medium" | "Low" = "Medium";
      let existingCreatedAt = Date.now();

      if (exists) {
        const data = docSnap.data();
        existingStatus = data.status || "pending";
        existingPriority = data.priority || "Medium";
        existingCreatedAt = data.createdAt || Date.now();
      }

      // Format Due Date
      let dueDateStr = "";
      if (cw.dueDate) {
        const y = cw.dueDate.year;
        const m = String(cw.dueDate.month).padStart(2, "0");
        const d = String(cw.dueDate.day).padStart(2, "0");
        dueDateStr = `${y}-${m}-${d}`;
      } else {
        // Fallback: 7 days from now
        const fallback = new Date();
        fallback.setDate(fallback.getDate() + 7);
        const y = fallback.getFullYear();
        const m = String(fallback.getMonth() + 1).padStart(2, "0");
        const d = String(fallback.getDate()).padStart(2, "0");
        dueDateStr = `${y}-${m}-${d}`;
      }

      // Check if the assignment is completed in Classroom ("TURNED_IN" or "RETURNED")
      const isCompletedInClassroom = cw.submissionState === "TURNED_IN" || cw.submissionState === "RETURNED";
      const finalStatus = (existingStatus === "completed" || isCompletedInClassroom) ? "completed" as const : "pending" as const;

      const taskData = {
        id: docId,
        userId: userId,
        title: cw.title,
        description: cw.description || "",
        courseName: cw.courseName,
        dueDate: dueDateStr,
        priority: existingPriority, // preserve existing priority if updated
        status: finalStatus, // auto completed if turned in in Classroom
        source: "classroom" as const,
        classroomCourseId: cw.courseId,
        classroomCourseworkId: cw.id,
        classroomUrl: cw.alternateLink || null,
        createdAt: existingCreatedAt,
        updatedAt: Date.now(),
        
        // Backward compatibility
        course: cw.courseName,
        deadline: dueDateStr,
      };

      await setDoc(docRef, taskData);

      if (exists) {
        updatedCount++;
      } else {
        syncedCount++;
      }
    }

    return { synced: syncedCount, updated: updatedCount };
  } catch (error) {
    console.error("Failed to sync Classroom tasks:", error);
    throw error;
  }
}
