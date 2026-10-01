export interface Task {
  id: string;
  userId: string;
  title: string;
  description: string;
  courseName: string;
  dueDate: string; // "YYYY-MM-DD"
  priority: 'High' | 'Medium' | 'Low';
  status: 'pending' | 'completed';
  source: 'classroom' | 'manual';
  classroomCourseId: string | null;
  classroomCourseworkId: string | null;
  classroomUrl: string | null;
  createdAt: number;
  updatedAt: number;

  // Backward compatibility fields for original UI
  course: string;
  deadline: string;
}

export interface Team {
  id: string;
  title: string;
  course: string;
  description: string;
  currentMembers: number;
  maxMembers: number;
  owner: string;
  status: 'open' | 'full';
  createdAt: number;
}

export interface Announcement {
  id: string;
  title: string;
  description: string;
  category: string;
  isImportant: boolean;
  createdAt: number;
}
