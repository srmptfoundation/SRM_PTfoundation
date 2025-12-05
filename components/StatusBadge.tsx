import React from 'react';
import { RequestStatus } from '../types';

export const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  let colorClass = 'bg-gray-100 text-gray-800';

  switch (status) {
    case RequestStatus.APPROVED:
      colorClass = 'bg-green-100 text-green-800 border border-green-200';
      break;
    case RequestStatus.REJECTED:
      colorClass = 'bg-red-100 text-red-800 border border-red-200';
      break;
    case RequestStatus.PENDING:
      colorClass = 'bg-yellow-100 text-yellow-800 border border-yellow-200';
      break;
  }

  return (
    <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${colorClass}`}>
      {status}
    </span>
  );
};