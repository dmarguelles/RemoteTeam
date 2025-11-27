import React from 'react';
import { CalendarDays, Sparkles } from 'lucide-react';

export const Header: React.FC = () => {
  return (
    <div className="bg-white border-b border-gray-200 sticky top-0 z-40 bg-white/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-2 rounded-lg">
              <CalendarDays className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 tracking-tight">AI Team</h1>
              <p className="text-xs text-gray-500 font-medium">Remote Work Rotation Management</p>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-3 text-sm text-gray-500">
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
              <span className="w-2 h-2 rounded-full bg-blue-600"></span>
              Office
            </span>
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-purple-50 text-purple-700 border border-purple-100">
              <span className="w-2 h-2 rounded-full bg-purple-600"></span>
              Remote
            </span>
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-orange-50 text-orange-700 border border-orange-100">
              <span className="w-2 h-2 rounded-full bg-orange-500"></span>
              Vacation
            </span>
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-50 text-red-700 border border-red-100">
              <span className="w-2 h-2 rounded-full bg-red-500"></span>
              Sick
            </span>
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              Event
            </span>
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cyan-50 text-cyan-700 border border-cyan-100">
              <span className="w-2 h-2 rounded-full bg-cyan-500"></span>
              Meeting
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
