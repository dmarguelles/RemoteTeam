import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { startOfWeek, startOfMonth, endOfMonth, addDays, format, isSameDay, addWeeks, subWeeks, addMonths, subMonths, getDay, isWeekend, getWeek } from 'date-fns';
import { ChevronLeft, ChevronRight, Wand2, RefreshCw, AlertCircle, Calendar as CalendarIcon, Loader2, Sparkles, Share2, Check, Users, CalendarRange, CalendarDays, BarChart3 } from 'lucide-react';
import { Header } from './components/Header';
import { StatusSelector } from './components/StatusSelector';
import { StatisticsModal } from './components/StatisticsModal';
import { INITIAL_EMPLOYEES, STATUS_CONFIG, WEEK_DAYS } from './constants';
import { Employee, EmployeeSchedule, WorkStatus, DaySchedule } from './types';
import { generateSmartSchedule } from './services/geminiService';

const STORAGE_KEY = 'flexteam-schedules';

type ViewMode = 'week' | 'month';

const App: React.FC = () => {
  const [currentWeekStart, setCurrentWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [currentMonth, setCurrentMonth] = useState(startOfMonth(new Date()));
  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [schedules, setSchedules] = useState<EmployeeSchedule[]>([]);
  const [loadingAi, setLoadingAi] = useState(false);
  const [activeSelector, setActiveSelector] = useState<{ empId: string; dateStr: string } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showStats, setShowStats] = useState(false);

  // Load schedules from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as EmployeeSchedule[];
        // Ensure all employees have a schedule entry
        const merged = INITIAL_EMPLOYEES.map(emp => {
          const existing = parsed.find(s => s.employeeId === emp.id);
          return existing || { employeeId: emp.id, days: {} };
        });
        setSchedules(merged);
      } catch {
        // If parsing fails, initialize fresh
        setSchedules(INITIAL_EMPLOYEES.map(emp => ({ employeeId: emp.id, days: {} })));
      }
    } else {
      setSchedules(INITIAL_EMPLOYEES.map(emp => ({ employeeId: emp.id, days: {} })));
    }
  }, []);

  // Auto-save schedules to localStorage whenever they change
  useEffect(() => {
    if (schedules.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(schedules));
    }
  }, [schedules]);

  const getDayStatus = (empId: string, date: Date): WorkStatus => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const schedule = schedules.find(s => s.employeeId === empId);
    return schedule?.days[dateStr]?.status || 'OFFICE';
  };

  const updateStatus = (empId: string, date: Date, status: WorkStatus) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    setSchedules(prev => prev.map(sch => {
      if (sch.employeeId !== empId) return sch;
      return {
        ...sch,
        days: {
          ...sch.days,
          [dateStr]: { date: dateStr, status }
        }
      };
    }));
    setActiveSelector(null);
  };

  // Quick toggle between Office and WFH on click
  const handleCellClick = (empId: string, date: Date) => {
    const current = getDayStatus(empId, date);
    // Simple toggle logic for left click
    const next = current === 'OFFICE' ? 'WFH' : 'OFFICE';
    updateStatus(empId, date, next);
  };

  // Open context menu for right click or long press
  const handleCellContextMenu = (e: React.MouseEvent, empId: string, date: Date) => {
    e.preventDefault();
    const dateStr = format(date, 'yyyy-MM-dd');
    setActiveSelector({ empId, dateStr });
  };

  const handleGenerateSchedule = async () => {
    setLoadingAi(true);
    setErrorMsg(null);
    try {
      const weekStartStr = format(currentWeekStart, 'yyyy-MM-dd');
      const result = await generateSmartSchedule(INITIAL_EMPLOYEES, weekStartStr);
      
      const newSchedules = [...schedules];
      
      // Apply the AI generated schedule
      result.schedules.forEach((aiSch: any) => {
        const emp = INITIAL_EMPLOYEES.find(e => e.name === aiSch.employeeName);
        if (!emp) return;

        const scheduleIdx = newSchedules.findIndex(s => s.employeeId === emp.id);
        if (scheduleIdx === -1) return;

        aiSch.schedule.forEach((daySch: any) => {
          // Map "Monday" back to actual date
          const dayIndex = WEEK_DAYS.indexOf(daySch.day);
          if (dayIndex !== -1) {
            const actualDate = addDays(currentWeekStart, dayIndex);
            const dateStr = format(actualDate, 'yyyy-MM-dd');
            
            newSchedules[scheduleIdx].days[dateStr] = {
              date: dateStr,
              status: daySch.status as WorkStatus
            };
          }
        });
      });

      setSchedules(newSchedules);
    } catch (err) {
      setErrorMsg("Failed to generate schedule. Check API Key or try again.");
    } finally {
      setLoadingAi(false);
    }
  };

  const clearPeriod = () => {
    const periodLabel = viewMode === 'week' ? 'week' : 'month';
    if(!window.confirm(`Clear all entries for this ${periodLabel}?`)) return;
    
    const datesToClear = viewMode === 'week'
      ? Array.from({ length: 5 }).map((_, i) => format(addDays(currentWeekStart, i), 'yyyy-MM-dd'))
      : getMonthWorkdays(currentMonth).map(d => format(d, 'yyyy-MM-dd'));
    
    setSchedules(prev => prev.map(sch => {
      const newDays = { ...sch.days };
      datesToClear.forEach(d => delete newDays[d]);
      return { ...sch, days: newDays };
    }));
  };

  // Get all workdays (Mon-Fri) for a given month
  const getMonthWorkdays = (monthStart: Date): Date[] => {
    const start = startOfMonth(monthStart);
    const end = endOfMonth(monthStart);
    const workdays: Date[] = [];
    
    let current = start;
    while (current <= end) {
      if (!isWeekend(current)) {
        workdays.push(current);
      }
      current = addDays(current, 1);
    }
    return workdays;
  };

  const handleShareSchedule = async () => {
    const shareDates = viewMode === 'week' 
      ? Array.from({ length: 5 }).map((_, i) => addDays(currentWeekStart, i))
      : getMonthWorkdays(currentMonth);
    
    const periodLabel = viewMode === 'week' 
      ? `Week of ${format(currentWeekStart, 'MMMM d, yyyy')}`
      : format(currentMonth, 'MMMM yyyy');
    
    // Build the text summary
    const lines: string[] = [
      `📅 FlexTeam Schedule — ${periodLabel}`,
      '━'.repeat(45),
      ''
    ];

    INITIAL_EMPLOYEES.forEach(emp => {
      const schedule = schedules.find(s => s.employeeId === emp.id);
      const daysSummary = shareDates.map(day => {
        const dateStr = format(day, 'yyyy-MM-dd');
        const status = schedule?.days[dateStr]?.status || 'OFFICE';
        const dayName = viewMode === 'week' ? format(day, 'EEE') : format(day, 'MM/dd');
        const emoji = status === 'WFH' ? '🏠' : status === 'VACATION' ? '🏝️' : status === 'SICK' ? '🤒' : status === 'EVENT' ? '🎪' : status === 'MEETING' ? '🤝' : '🏢';
        return `${dayName}: ${emoji}`;
      }).join(' | ');
      
      lines.push(`👤 ${emp.name} (${emp.role})`);
      lines.push(`   ${daysSummary}`);
      lines.push('');
    });

    lines.push('━'.repeat(45));
    lines.push('Legend: 🏢 Office | 🏠 Remote | 🏝️ Vacation | 🤒 Sick | ⛔ N/A');

    const text = lines.join('\n');

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Get display days based on view mode
  const displayDays = viewMode === 'week'
    ? Array.from({ length: 5 }).map((_, i) => addDays(currentWeekStart, i))
    : getMonthWorkdays(currentMonth);

  // Group days by week for month view - returns week number for each day
  const weekGroups = useMemo(() => {
    if (viewMode === 'week') return [];
    return displayDays.map(day => getWeek(day, { weekStartsOn: 1 }));
  }, [displayDays, viewMode]);

  // Check if a day is the first day of a new week (for visual separation)
  const isNewWeek = (index: number): boolean => {
    if (viewMode === 'week' || index === 0) return false;
    return weekGroups[index] !== weekGroups[index - 1];
  };

  // Get week label for a given day
  const getWeekLabel = (day: Date): string => {
    const weekNum = getWeek(day, { weekStartsOn: 1 });
    return `W${weekNum}`;
  };

  // Navigation handlers
  const handlePrevious = () => {
    if (viewMode === 'week') {
      setCurrentWeekStart(subWeeks(currentWeekStart, 1));
    } else {
      setCurrentMonth(subMonths(currentMonth, 1));
    }
  };

  const handleNext = () => {
    if (viewMode === 'week') {
      setCurrentWeekStart(addWeeks(currentWeekStart, 1));
    } else {
      setCurrentMonth(addMonths(currentMonth, 1));
    }
  };

  // Get display label for current period
  const getPeriodLabel = () => {
    if (viewMode === 'week') {
      return format(currentWeekStart, 'MMMM d, yyyy');
    }
    return format(currentMonth, 'MMMM yyyy');
  };

  // Calculate office coverage for a specific day
  const getOfficeCoverage = (date: Date): { count: number; total: number; percentage: number } => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const total = INITIAL_EMPLOYEES.length;
    const count = INITIAL_EMPLOYEES.filter(emp => {
      const schedule = schedules.find(s => s.employeeId === emp.id);
      const status = schedule?.days[dateStr]?.status || 'OFFICE';
      return status === 'OFFICE';
    }).length;
    return { count, total, percentage: Math.round((count / total) * 100) };
  };

  // Get color classes based on coverage percentage
  const getCoverageStyle = (percentage: number): { bg: string; text: string; label: string } => {
    if (percentage >= 60) return { bg: 'bg-green-100 border-green-300', text: 'text-green-700', label: 'Good' };
    if (percentage >= 40) return { bg: 'bg-yellow-100 border-yellow-300', text: 'text-yellow-700', label: 'Fair' };
    return { bg: 'bg-red-100 border-red-300', text: 'text-red-700', label: 'Low' };
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Toolbar */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          
          <div className="flex items-center gap-2">
            {/* View Mode Toggle */}
            <div className="flex bg-white rounded-xl shadow-sm border border-gray-200 p-1">
              <button
                onClick={() => setViewMode('week')}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  viewMode === 'week'
                    ? 'bg-indigo-100 text-indigo-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <CalendarDays className="w-4 h-4" />
                Week
              </button>
              <button
                onClick={() => setViewMode('month')}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  viewMode === 'month'
                    ? 'bg-indigo-100 text-indigo-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <CalendarRange className="w-4 h-4" />
                Month
              </button>
            </div>

            {/* Navigation */}
            <div className="flex items-center gap-4 bg-white p-1.5 rounded-xl shadow-sm border border-gray-200">
              <button 
                onClick={handlePrevious}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600"
                title={viewMode === 'week' ? 'Previous week' : 'Previous month'}
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-2 px-2">
                <CalendarIcon className="w-5 h-5 text-indigo-600" />
                <span className="font-semibold text-gray-800 whitespace-nowrap min-w-[160px] text-center">
                  {getPeriodLabel()}
                </span>
              </div>
              <button 
                onClick={handleNext}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600"
                title={viewMode === 'week' ? 'Next week' : 'Next month'}
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleShareSchedule}
              className={`flex items-center gap-2 px-4 py-2.5 border rounded-xl transition-all font-medium shadow-sm ${
                copied 
                  ? 'bg-green-50 text-green-700 border-green-300' 
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" />
                  Copied!
                </>
              ) : (
                <>
                  <Share2 className="w-4 h-4" />
                  Share
                </>
              )}
            </button>
            <button
              onClick={() => setShowStats(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-white text-gray-700 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors font-medium shadow-sm"
            >
              <BarChart3 className="w-4 h-4" />
              Statistics
            </button>
             <button
              onClick={clearPeriod}
              className="flex items-center gap-2 px-4 py-2.5 bg-white text-gray-700 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors font-medium shadow-sm"
            >
              <RefreshCw className="w-4 h-4" />
              Reset {viewMode === 'week' ? 'Week' : 'Month'}
            </button>
            <button
              onClick={handleGenerateSchedule}
              disabled={loadingAi}
              className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all shadow-md hover:shadow-lg font-medium disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loadingAi ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Wand2 className="w-4 h-4" />
              )}
              {loadingAi ? 'Thinking...' : 'AI Auto-Schedule'}
            </button>
          </div>
        </div>

        {errorMsg && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            {errorMsg}
          </div>
        )}

        {/* Schedule Grid */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className={`w-full ${viewMode === 'month' ? 'min-w-[1400px]' : 'min-w-[800px]'}`}>
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100">
                  <th className={`py-5 px-6 text-left ${viewMode === 'month' ? 'w-48 sticky left-0 bg-gray-50/95 z-10' : 'w-64'}`}>
                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Employee</span>
                  </th>
                  {displayDays.map((day, idx) => {
                    const showWeekStart = viewMode === 'month' && (idx === 0 || isNewWeek(idx));
                    const dayOfWeek = getDay(day);
                    const isFriday = dayOfWeek === 5;
                    
                    return (
                      <th 
                        key={day.toString()} 
                        className={`py-5 text-center relative
                          ${viewMode === 'month' ? 'px-1' : 'px-4'}
                          ${viewMode === 'month' && isNewWeek(idx) ? 'border-l-2 border-indigo-300' : ''}
                          ${viewMode === 'month' && isFriday ? 'border-r border-gray-200' : ''}
                        `}
                      >
                        {/* Week badge for first day of week */}
                        {showWeekStart && (
                          <div className="absolute -top-1 left-1/2 -translate-x-1/2 -translate-y-full">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-700 border border-indigo-200 shadow-sm">
                              {getWeekLabel(day)}
                            </span>
                          </div>
                        )}
                        <div className="flex flex-col items-center">
                          <span className={`font-semibold text-gray-900 ${viewMode === 'month' ? 'text-xs' : 'text-sm'}`}>
                            {viewMode === 'month' ? format(day, 'EEE') : format(day, 'EEEE')}
                          </span>
                          <span className={`font-medium text-gray-500 mt-1 ${viewMode === 'month' ? 'text-[10px]' : 'text-xs'}`}>
                            {format(day, 'MMM d')}
                          </span>
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {INITIAL_EMPLOYEES.map((emp) => (
                  <tr key={emp.id} className="group hover:bg-gray-50/50 transition-colors">
                    <td className={`py-4 px-6 ${viewMode === 'month' ? 'sticky left-0 bg-white group-hover:bg-gray-50/50 z-10' : ''}`}>
                      <div className="flex items-center gap-4">
                        <div className={`rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center text-indigo-700 font-bold border border-indigo-50 shadow-sm ${viewMode === 'month' ? 'h-8 w-8 text-sm' : 'h-10 w-10'}`}>
                          {emp.avatar}
                        </div>
                        <div>
                          <p className={`font-semibold text-gray-900 ${viewMode === 'month' ? 'text-sm' : ''}`}>{emp.name}</p>
                          <p className="text-xs text-gray-500">{emp.role}</p>
                        </div>
                      </div>
                    </td>
                    {displayDays.map((day, idx) => {
                      const status = getDayStatus(emp.id, day);
                      const config = STATUS_CONFIG[status];
                      const Icon = config.icon;
                      const dateStr = format(day, 'yyyy-MM-dd');
                      const isMenuOpen = activeSelector?.empId === emp.id && activeSelector?.dateStr === dateStr;
                      const dayOfWeek = getDay(day);
                      const isFriday = dayOfWeek === 5;

                      return (
                        <td 
                          key={dateStr} 
                          className={`relative 
                            ${viewMode === 'month' ? 'p-1' : 'p-2'}
                            ${viewMode === 'month' && isNewWeek(idx) ? 'border-l-2 border-indigo-300' : ''}
                            ${viewMode === 'month' && isFriday ? 'border-r border-gray-200' : ''}
                          `}
                        >
                          <div 
                            onClick={() => handleCellClick(emp.id, day)}
                            onContextMenu={(e) => handleCellContextMenu(e, emp.id, day)}
                            className={`
                              mx-auto rounded-xl border transition-all duration-200 cursor-pointer
                              flex flex-col items-center justify-center
                              hover:shadow-md hover:scale-[1.02] active:scale-95
                              ${config.bg}
                              ${viewMode === 'month' ? 'h-12 w-full gap-0.5' : 'h-16 w-full gap-1.5'}
                            `}
                          >
                            <Icon className={`${viewMode === 'month' ? 'w-4 h-4' : 'w-5 h-5'} ${config.color}`} />
                            {viewMode === 'week' && (
                              <span className={`text-xs font-medium ${config.color}`}>
                                {config.label}
                              </span>
                            )}
                          </div>

                          {/* Status Popup Menu */}
                          {isMenuOpen && (
                            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50">
                                <div 
                                    className="fixed inset-0 z-40" 
                                    onClick={(e) => {
                                        e.stopPropagation(); 
                                        setActiveSelector(null);
                                    }} 
                                />
                                <StatusSelector 
                                    currentStatus={status}
                                    onSelect={(newStatus) => updateStatus(emp.id, day, newStatus)}
                                    onClose={() => setActiveSelector(null)}
                                />
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-gradient-to-r from-gray-50 to-gray-100 border-t-2 border-gray-200">
                  <td className={`py-4 px-6 ${viewMode === 'month' ? 'sticky left-0 bg-gradient-to-r from-gray-50 to-gray-100 z-10' : ''}`}>
                    <div className="flex items-center gap-3">
                      <div className={`rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-sm ${viewMode === 'month' ? 'h-8 w-8' : 'h-10 w-10'}`}>
                        <Users className={`text-white ${viewMode === 'month' ? 'w-4 h-4' : 'w-5 h-5'}`} />
                      </div>
                      <div>
                        <p className={`font-semibold text-gray-900 ${viewMode === 'month' ? 'text-sm' : ''}`}>Office Coverage</p>
                        <p className="text-xs text-gray-500">People in office</p>
                      </div>
                    </div>
                  </td>
                  {displayDays.map((day, idx) => {
                    const coverage = getOfficeCoverage(day);
                    const style = getCoverageStyle(coverage.percentage);
                    const dateStr = format(day, 'yyyy-MM-dd');
                    const dayOfWeek = getDay(day);
                    const isFriday = dayOfWeek === 5;

                    return (
                      <td 
                        key={`coverage-${dateStr}`} 
                        className={`
                          ${viewMode === 'month' ? 'p-1' : 'p-2'}
                          ${viewMode === 'month' && isNewWeek(idx) ? 'border-l-2 border-indigo-300' : ''}
                          ${viewMode === 'month' && isFriday ? 'border-r border-gray-200' : ''}
                        `}
                      >
                        <div 
                          className={`
                            mx-auto rounded-xl border-2 transition-all duration-200
                            flex flex-col items-center justify-center
                            ${style.bg}
                            ${viewMode === 'month' ? 'h-12 w-full gap-0' : 'h-16 w-full gap-1'}
                          `}
                        >
                          <span className={`font-bold ${style.text} ${viewMode === 'month' ? 'text-sm' : 'text-lg'}`}>
                            {coverage.count}/{coverage.total}
                          </span>
                          {viewMode === 'week' && (
                            <span className={`text-xs font-medium ${style.text}`}>
                              {coverage.percentage}% • {style.label}
                            </span>
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Footer / Legend */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-indigo-500"/>
                    Quick Tips
                </h3>
                <ul className="space-y-3 text-sm text-gray-600">
                    <li className="flex items-start gap-2">
                        <span className="bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded text-xs font-mono border">Click</span>
                        <span>Toggle between Office and Remote immediately.</span>
                    </li>
                     <li className="flex items-start gap-2">
                        <span className="bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded text-xs font-mono border">Right Click</span>
                        <span>Open menu for Vacation, Sick leave, or other statuses.</span>
                    </li>
                     <li className="flex items-start gap-2">
                        <span className="bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded text-xs font-mono border border-indigo-100">AI Auto-Schedule</span>
                        <span>Uses AI to generate a balanced rotation for the week.</span>
                    </li>
                </ul>
            </div>

            <div className="bg-gradient-to-br from-indigo-600 to-purple-700 p-6 rounded-2xl shadow-lg text-white">
                 <h3 className="font-semibold mb-2">Team Summary</h3>
                 <p className="text-indigo-100 text-sm mb-4">
                     {INITIAL_EMPLOYEES.length} Active Members • Week of {format(currentWeekStart, 'MMM d')}
                 </p>
                 <div className="flex items-center gap-2 text-sm bg-white/10 p-3 rounded-lg backdrop-blur-sm border border-white/10">
                    <Sparkles className="w-4 h-4 text-yellow-300" />
                    <span>Rotation Rule: 2 Remote Days / Week</span>
                 </div>
            </div>
        </div>

      </main>

      {/* Statistics Modal */}
      <StatisticsModal 
        isOpen={showStats}
        onClose={() => setShowStats(false)}
        schedules={schedules}
        currentDate={viewMode === 'week' ? currentWeekStart : currentMonth}
      />
    </div>
  );
};

export default App;