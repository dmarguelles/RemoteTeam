import React, { useMemo, useState } from 'react';
import { X, BarChart3, Trophy, Calendar, TrendingUp } from 'lucide-react';
import { EmployeeSchedule, WorkStatus, DaySchedule } from '../types';
import { INITIAL_EMPLOYEES, STATUS_CONFIG, WEEK_DAYS } from '../constants';
import { getDay, eachDayOfInterval, isWeekend, startOfMonth, endOfMonth, startOfYear, endOfYear, format } from 'date-fns';

interface StatisticsModalProps {
  isOpen: boolean;
  onClose: () => void;
  schedules: EmployeeSchedule[];
  currentDate: Date;
}

interface EmployeeStats {
  employeeId: string;
  name: string;
  avatar: string;
  role: string;
  totalDays: number;
  statusCounts: Record<WorkStatus, number>;
  dayOfWeekWfh: number[]; // Index 0-4 for Mon-Fri
}

export const StatisticsModal: React.FC<StatisticsModalProps> = ({ isOpen, onClose, schedules, currentDate }) => {
  const [scope, setScope] = useState<'month' | 'year'>('month');
  
  // Calculate date range based on scope (month or year)
  const dateRange = useMemo(() => {
    const rangeStart = scope === 'month' 
      ? startOfMonth(currentDate) 
      : startOfYear(currentDate);
    const rangeEnd = scope === 'month' 
      ? endOfMonth(currentDate) 
      : endOfYear(currentDate);
    
    // Limit end to today to not count future days
    const today = new Date();
    today.setHours(23, 59, 59, 999); // End of today
    
    // For past periods, use the full range; for current/future, cap at today
    const effectiveEnd = rangeEnd <= today ? rangeEnd : today;
    
    // If the entire range is in the future, return null
    if (rangeStart > today) return null;
    
    // Get all workdays in the range
    const allDays = eachDayOfInterval({ start: rangeStart, end: effectiveEnd });
    const workdays = allDays.filter(d => !isWeekend(d));
    
    console.log('Statistics dateRange:', { 
      currentDate: format(currentDate, 'yyyy-MM-dd'),
      scope,
      rangeStart: format(rangeStart, 'yyyy-MM-dd'),
      rangeEnd: format(rangeEnd, 'yyyy-MM-dd'),
      effectiveEnd: format(effectiveEnd, 'yyyy-MM-dd'),
      workdaysCount: workdays.length 
    });
    
    return { minDate: rangeStart, maxDate: effectiveEnd, workdays };
  }, [currentDate, scope]);

  const statistics = useMemo(() => {
    const stats: EmployeeStats[] = INITIAL_EMPLOYEES.map(emp => {
      const schedule = schedules.find(s => s.employeeId === emp.id);
      const days = schedule?.days || {};
      
      const statusCounts: Record<WorkStatus, number> = {
        OFFICE: 0,
        WFH: 0,
        VACATION: 0,
        SICK: 0,
        EVENT: 0,
        MEETING: 0
      };
      
      // Count by day of week (0=Mon, 1=Tue, etc.)
      const dayOfWeekWfh = [0, 0, 0, 0, 0];
      const dayOfWeekOffice = [0, 0, 0, 0, 0];
      
      // If we have a date range, iterate through ALL workdays
      if (dateRange) {
        dateRange.workdays.forEach(date => {
          const dateStr = format(date, 'yyyy-MM-dd');
          const dayData = days[dateStr] as DaySchedule | undefined;
          // Default to OFFICE if no explicit entry
          const status: WorkStatus = dayData?.status || 'OFFICE';
          
          statusCounts[status]++;
          
          // Get day of week (date-fns getDay: 0=Sun, 1=Mon, etc.)
          const dow = getDay(date);
          // Convert to Mon=0, Tue=1, etc. (skip weekends - already filtered)
          if (dow >= 1 && dow <= 5) {
            const adjustedDow = dow - 1;
            if (status === 'WFH') {
              dayOfWeekWfh[adjustedDow]++;
            } else if (status === 'OFFICE') {
              dayOfWeekOffice[adjustedDow]++;
            }
          }
        });
      }
      
      const totalDays = Object.values(statusCounts).reduce((a, b) => a + b, 0);
      
      return {
        employeeId: emp.id,
        name: emp.name,
        avatar: emp.avatar,
        role: emp.role,
        totalDays,
        statusCounts,
        dayOfWeekWfh
      };
    });
    
    return stats;
  }, [schedules, dateRange, scope]);

  // Calculate overall totals
  const overallStats = useMemo(() => {
    const totals: Record<WorkStatus, number> = {
      OFFICE: 0,
      WFH: 0,
      VACATION: 0,
      SICK: 0,
      EVENT: 0,
      MEETING: 0
    };
    
    statistics.forEach(stat => {
      (Object.keys(stat.statusCounts) as WorkStatus[]).forEach(status => {
        totals[status] += stat.statusCounts[status];
      });
    });
    
    const total = Object.values(totals).reduce((a, b) => a + b, 0);
    return { totals, total };
  }, [statistics]);

  // Leaderboard sorted by office attendance
  const leaderboard = useMemo(() => {
    return [...statistics]
      .filter(s => s.totalDays > 0)
      .sort((a, b) => {
        const aPercent = a.totalDays > 0 ? (a.statusCounts.OFFICE / a.totalDays) : 0;
        const bPercent = b.totalDays > 0 ? (b.statusCounts.OFFICE / b.totalDays) : 0;
        return bPercent - aPercent;
      });
  }, [statistics]);

  // Get max WFH count for day-of-week heatmap scaling
  const maxWfhCount = useMemo(() => {
    let max = 1;
    statistics.forEach(stat => {
      stat.dayOfWeekWfh.forEach(count => {
        if (count > max) max = count;
      });
    });
    return max;
  }, [statistics]);

  const getHeatmapColor = (count: number): string => {
    if (count === 0) return 'bg-gray-100 text-gray-400';
    const intensity = count / maxWfhCount;
    if (intensity > 0.75) return 'bg-purple-500 text-white';
    if (intensity > 0.5) return 'bg-purple-400 text-white';
    if (intensity > 0.25) return 'bg-purple-300 text-purple-800';
    return 'bg-purple-200 text-purple-700';
  };

  const getPercentage = (value: number, total: number): number => {
    return total > 0 ? Math.round((value / total) * 100) : 0;
  };

  const [activeTab, setActiveTab] = useState<'distribution' | 'heatmap' | 'leaderboard'>('distribution');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-indigo-600 to-purple-600">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-lg">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Statistics Dashboard</h2>
              <p className="text-indigo-100 text-sm">
                {scope === 'month' 
                  ? format(currentDate, 'MMMM yyyy')
                  : format(currentDate, 'yyyy')
                } • Team attendance analytics
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Scope Toggle */}
            <div className="flex bg-white/20 rounded-lg p-1">
              <button
                onClick={() => setScope('month')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                  scope === 'month'
                    ? 'bg-white text-indigo-700 shadow-sm'
                    : 'text-white/80 hover:text-white hover:bg-white/10'
                }`}
              >
                Month
              </button>
              <button
                onClick={() => setScope('year')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                  scope === 'year'
                    ? 'bg-white text-indigo-700 shadow-sm'
                    : 'text-white/80 hover:text-white hover:bg-white/10'
                }`}
              >
                Year
              </button>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

        {/* Tabs Header */}
        <div className="flex gap-1 p-4 bg-gray-50 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('distribution')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all ${
              activeTab === 'distribution'
                ? 'bg-white text-indigo-700 shadow-sm border border-gray-200'
                : 'text-gray-600 hover:bg-white/50'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            Work Style Distribution
          </button>
          <button
            onClick={() => setActiveTab('heatmap')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all ${
              activeTab === 'heatmap'
                ? 'bg-white text-indigo-700 shadow-sm border border-gray-200'
                : 'text-gray-600 hover:bg-white/50'
            }`}
          >
            <Calendar className="w-4 h-4" />
            Day-of-Week Analysis
          </button>
          <button
            onClick={() => setActiveTab('leaderboard')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all ${
              activeTab === 'leaderboard'
                ? 'bg-white text-indigo-700 shadow-sm border border-gray-200'
                : 'text-gray-600 hover:bg-white/50'
            }`}
          >
            <Trophy className="w-4 h-4" />
            Attendance Leaderboard
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          
          {/* Work Style Distribution Tab */}
          {activeTab === 'distribution' && (
            <section>
            {overallStats.total === 0 ? (
              <div className="bg-gray-50 rounded-xl p-6 text-center text-gray-500">
                No data yet. Start scheduling to see statistics.
              </div>
            ) : (
              <div className="space-y-4">
                {/* Overall bar */}
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Team Overall</span>
                    <span className="text-xs text-gray-500">{overallStats.total} days tracked</span>
                  </div>
                  <div className="flex h-8 rounded-lg overflow-hidden">
                    {(['OFFICE', 'WFH', 'VACATION', 'SICK', 'EVENT', 'MEETING'] as WorkStatus[]).map(status => {
                      const percent = getPercentage(overallStats.totals[status], overallStats.total);
                      if (percent === 0) return null;
                      const config = STATUS_CONFIG[status];
                      return (
                        <div
                          key={status}
                          className={`flex items-center justify-center text-xs font-medium transition-all ${config.bg.replace('border-', 'border-r-')} ${config.color}`}
                          style={{ width: `${percent}%` }}
                          title={`${config.label}: ${percent}%`}
                        >
                          {percent >= 10 && `${percent}%`}
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex flex-wrap gap-4 mt-3">
                    {(['OFFICE', 'WFH', 'VACATION', 'SICK', 'EVENT', 'MEETING'] as WorkStatus[]).map(status => {
                      const config = STATUS_CONFIG[status];
                      const Icon = config.icon;
                      return (
                        <div key={status} className="flex items-center gap-1.5 text-xs">
                          <Icon className={`w-3.5 h-3.5 ${config.color}`} />
                          <span className="text-gray-600">{config.label}:</span>
                          <span className="font-medium text-gray-900">
                            {getPercentage(overallStats.totals[status], overallStats.total)}%
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Per-employee bars */}
                <div className="grid gap-3">
                  {statistics.filter(s => s.totalDays > 0).map(stat => (
                    <div key={stat.employeeId} className="bg-white border border-gray-200 rounded-xl p-3">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center text-indigo-700 font-bold text-sm">
                          {stat.avatar}
                        </div>
                        <div className="flex-1">
                          <span className="text-sm font-medium text-gray-900">{stat.name}</span>
                          <span className="text-xs text-gray-500 ml-2">{stat.totalDays} days</span>
                        </div>
                      </div>
                      <div className="flex h-6 rounded-lg overflow-hidden">
                        {(['OFFICE', 'WFH', 'VACATION', 'SICK', 'EVENT', 'MEETING'] as WorkStatus[]).map(status => {
                          const percent = getPercentage(stat.statusCounts[status], stat.totalDays);
                          if (percent === 0) return null;
                          const config = STATUS_CONFIG[status];
                          return (
                            <div
                              key={status}
                              className={`flex items-center justify-center text-[10px] font-medium ${config.bg} ${config.color}`}
                              style={{ width: `${percent}%` }}
                              title={`${config.label}: ${percent}%`}
                            >
                              {percent >= 15 && `${percent}%`}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
          )}

          {/* Day-of-Week Analysis Tab */}
          {activeTab === 'heatmap' && (
            <div className="bg-gray-50 rounded-xl p-4 overflow-x-auto">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xs text-gray-500 bg-white px-2 py-1 rounded-full border">WFH Heatmap</span>
              </div>
              <table className="w-full">
                <thead>
                  <tr>
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider pb-3 pr-4">
                      Employee
                    </th>
                    {WEEK_DAYS.map(day => (
                      <th key={day} className="text-center text-xs font-semibold text-gray-500 uppercase tracking-wider pb-3 px-2">
                        {day.slice(0, 3)}
                      </th>
                    ))}
                    <th className="text-center text-xs font-semibold text-gray-500 uppercase tracking-wider pb-3 pl-4">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {statistics.map(stat => {
                    const totalWfh = stat.dayOfWeekWfh.reduce((a, b) => a + b, 0);
                    return (
                      <tr key={stat.employeeId}>
                        <td className="py-2 pr-4">
                          <div className="flex items-center gap-2">
                            <div className="h-7 w-7 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center text-indigo-700 font-bold text-xs">
                              {stat.avatar}
                            </div>
                            <span className="text-sm font-medium text-gray-900">{stat.name}</span>
                          </div>
                        </td>
                        {stat.dayOfWeekWfh.map((count, idx) => (
                          <td key={idx} className="py-2 px-2">
                            <div 
                              className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold mx-auto ${getHeatmapColor(count)}`}
                              title={`${WEEK_DAYS[idx]}: ${count} WFH days`}
                            >
                              {count}
                            </div>
                          </td>
                        ))}
                        <td className="py-2 pl-4">
                          <div className="flex items-center justify-center">
                            <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm font-bold">
                              {totalWfh}
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              
              {/* Legend */}
              <div className="flex items-center justify-end gap-2 mt-4 pt-3 border-t border-gray-200">
                <span className="text-xs text-gray-500">Less WFH</span>
                <div className="flex gap-1">
                  <div className="w-4 h-4 rounded bg-gray-100" />
                  <div className="w-4 h-4 rounded bg-purple-200" />
                  <div className="w-4 h-4 rounded bg-purple-300" />
                  <div className="w-4 h-4 rounded bg-purple-400" />
                  <div className="w-4 h-4 rounded bg-purple-500" />
                </div>
                <span className="text-xs text-gray-500">More WFH</span>
              </div>
            </div>
          )}

          {/* Attendance Leaderboard Tab */}
          {activeTab === 'leaderboard' && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">Office presence ranking</span>
              </div>
              
              {leaderboard.length === 0 ? (
                <div className="bg-gray-50 rounded-xl p-6 text-center text-gray-500">
                  No attendance data yet.
                </div>
              ) : (
                <div className="grid gap-2">
                  {leaderboard.map((stat, index) => {
                    const officePercent = getPercentage(stat.statusCounts.OFFICE, stat.totalDays);
                    const medals = ['🥇', '🥈', '🥉'];
                    const medal = index < 3 ? medals[index] : null;
                    
                    return (
                      <div 
                        key={stat.employeeId}
                        className={`flex items-center gap-4 p-3 rounded-xl border transition-all ${
                          index === 0 ? 'bg-yellow-50 border-yellow-200' :
                          index === 1 ? 'bg-gray-50 border-gray-200' :
                          index === 2 ? 'bg-orange-50 border-orange-200' :
                          'bg-white border-gray-100'
                        }`}
                      >
                        <div className="w-8 text-center">
                          {medal ? (
                            <span className="text-2xl">{medal}</span>
                          ) : (
                            <span className="text-sm font-bold text-gray-400">#{index + 1}</span>
                          )}
                        </div>
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center text-indigo-700 font-bold">
                          {stat.avatar}
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900">{stat.name}</p>
                          <p className="text-xs text-gray-500">{stat.role}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-blue-600">{officePercent}%</p>
                          <p className="text-xs text-gray-500">
                            {stat.statusCounts.OFFICE} of {stat.totalDays} days
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
