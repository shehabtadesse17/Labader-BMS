// src/components/TenantCard.jsx
import React from 'react';

const TenantCard = ({ tenant, onTogglePaid }) => {
  const { id, name, unitInfo, memberSince, monthlyRent, dueDay, paidStatus } = tenant;

  // Rent Logic: Check if current date > Due Day AND paid_status is false
  const currentDate = new Date();
  const currentDayOfMonth = currentDate.getDate();
  const isOverdue = currentDayOfMonth > dueDay && !paidStatus;

  const cardClasses = `
    bg-white p-4 rounded-lg shadow-md mb-4
    ${isOverdue ? 'border-l-4 border-red-500' : 'border-l-4 border-transparent'}
    flex flex-col
  `;

  // Format date for display (e.g., "Jan 15, 2023")
  const formattedMemberSince = new Date(memberSince).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  return (
    <div className={cardClasses}>
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-lg font-bold text-gray-800">{name}</h3>
        {isOverdue && (
          <span className="bg-red-500 text-white text-xs font-semibold px-2 py-1 rounded-full">
            Overdue
          </span>
        )}
      </div>
      <p className="text-gray-600 text-sm mb-1">
        <span className="font-medium">Unit:</span> {unitInfo}
      </p>
      <p className="text-gray-600 text-sm mb-1">
        <span className="font-medium">Member Since:</span> {formattedMemberSince}
      </p>
      <p className="text-gray-800 text-base font-semibold mt-auto">
        {monthlyRent.toLocaleString('en-ET')} ETB
      </p>
      <button
        onClick={() => onTogglePaid(id, paidStatus)}
        className={`mt-4 py-2 px-4 rounded font-bold text-sm transition ${
          paidStatus
            ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            : 'bg-green-600 text-white hover:bg-green-700'
        }`}
      >
        {paidStatus ? 'Mark as Unpaid' : 'Mark as Paid'}
      </button>
    </div>
  );
};

export default TenantCard;