export type WorkStatus = 'OFFICE' | 'WFH' | 'VACATION' | 'SICK' | 'EVENT' | 'MEETING';

export interface Employee {
  id: string;
  name: string;
  role: string;
  avatar: string; // URL or Initials
}

export interface DaySchedule {
  date: string; // ISO string YYYY-MM-DD
  status: WorkStatus;
  note?: string;
}

export interface EmployeeSchedule {
  employeeId: string;
  days: Record<string, DaySchedule>; // Key is date string YYYY-MM-DD
}

export type WeekView = 'current' | 'next' | 'prev';

export interface SwapRequest {
  requesterId: string;
  targetId: string;
  date: string;
}

export interface GemniScheduleResponse {
  schedules: {
    employeeName: string;
    schedule: {
      day: string; // Monday, Tuesday, etc.
      status: 'OFFICE' | 'WFH';
    }[];
  }[];
}
