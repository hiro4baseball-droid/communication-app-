export interface User {
  id: number;
  name: string;
  role: 'admin' | 'teacher';
}

export interface Student {
  id: number;
  name: string;
  grade: string;
  created_at: string;
}

export interface CommunicationLog {
  id: number;
  teacher_id: number;
  student_id: number;
  shift_date: string;
  teacher_name: string;
  student_name: string;
  note: string;
  created_at: string;
}

export interface StudentRecord {
  id: number;
  student_id: number;
  likes: string;
  efforts: string;
  talk_history: string;
  updated_by: number | null;
  updated_by_name: string | null;
  updated_at: string;
}

export interface TeacherActivity {
  id: number;
  name: string;
  last_login: string | null;
  total_comms: number;
  total_shifts: number;
  last_shift: string | null;
  login_count: number;
}

export interface StudentOverview {
  id: number;
  name: string;
  grade: string;
  total_comms: number;
  teacher_count: number;
  last_comm_date: string | null;
  teachers_talked_to: string | null;
}
