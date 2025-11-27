import React from 'react';
import { WorkStatus } from '../types';
import { STATUS_CONFIG } from '../constants';

interface Props {
  currentStatus: WorkStatus;
  onSelect: (status: WorkStatus) => void;
  onClose: () => void;
}

export const StatusSelector: React.FC<Props> = ({ currentStatus, onSelect, onClose }) => {
  return (
    <div className="absolute z-50 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none animate-in fade-in zoom-in duration-200">
      <div className="py-1" role="menu" aria-orientation="vertical">
        {(Object.keys(STATUS_CONFIG) as WorkStatus[]).map((status) => {
          const config = STATUS_CONFIG[status];
          const Icon = config.icon;
          const isSelected = currentStatus === status;

          return (
            <button
              key={status}
              onClick={() => {
                onSelect(status);
                onClose();
              }}
              className={`
                group flex items-center w-full px-4 py-2 text-sm
                ${isSelected ? 'bg-indigo-50 text-indigo-700' : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'}
              `}
              role="menuitem"
            >
              <Icon className={`mr-3 h-4 w-4 ${config.color}`} aria-hidden="true" />
              {config.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};
