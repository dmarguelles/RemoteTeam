import { Employee, WorkStatus } from './types';
import { Monitor, Home, Palmtree, Thermometer, CalendarHeart, Users } from 'lucide-react';

export const INITIAL_EMPLOYEES: Employee[] = [
  { id: '1', name: 'David', role: 'Analyst', avatar: 'D' },
  { id: '2', name: 'Enrique', role: 'Analyst', avatar: 'E' },
  { id: '3', name: 'Adrian', role: 'Designer', avatar: 'A' },
  { id: '4', name: 'Jose', role: 'Manager', avatar: 'J' },
  { id: '5', name: 'Edu', role: 'QA Engineer', avatar: 'Ed' },
  { id: '6', name: 'Gustavo', role: 'DevOps', avatar: 'G' },
];

export const STATUS_CONFIG: Record<WorkStatus, { label: string; color: string; icon: any; bg: string }> = {
  OFFICE: { label: 'Office', color: 'text-blue-600', icon: Monitor, bg: 'bg-blue-50 border-blue-200' },
  WFH: { label: 'Remote', color: 'text-purple-600', icon: Home, bg: 'bg-purple-50 border-purple-200' },
  VACATION: { label: 'Vacation', color: 'text-orange-500', icon: Palmtree, bg: 'bg-orange-50 border-orange-200' },
  SICK: { label: 'Sick', color: 'text-red-500', icon: Thermometer, bg: 'bg-red-50 border-red-200' },
  EVENT: { label: 'Event', color: 'text-emerald-600', icon: CalendarHeart, bg: 'bg-emerald-50 border-emerald-200' },
  MEETING: { label: 'Meeting', color: 'text-cyan-600', icon: Users, bg: 'bg-cyan-50 border-cyan-200' },
};

export const WEEK_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
