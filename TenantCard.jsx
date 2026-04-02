// src/components/TenantCard.jsx
import React from 'react';

const TenantCard = ({ tenant, onTogglePaid }) => {
  const { id, name, unitInfo, phoneNumber, telegramUsername, memberSince, monthlyRent, dueDay, paidStatus } = tenant;

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
  const dateObj = memberSince ? new Date(memberSince) : null;
  const formattedMemberSince = (dateObj && !isNaN(dateObj)) 
    ? dateObj.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : 'N/A';

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
      
      <div className="flex flex-wrap gap-2 mt-4">
        <button
          onClick={() => onTogglePaid(id, paidStatus)}
          className={`flex-1 min-w-[80px] py-2 px-2 rounded font-bold text-xs transition ${
            paidStatus
              ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              : 'bg-green-600 text-white hover:bg-green-700'
          }`}
        >
          {paidStatus ? 'Unpaid' : 'Paid'}
        </button>
        
        {phoneNumber && (
          <a
            href={`tel:${phoneNumber}`}
            className="flex-1 min-w-[60px] py-2 px-2 rounded bg-blue-50 text-blue-600 hover:bg-blue-100 transition font-bold text-xs text-center border border-blue-200"
          >
            Call
          </a>
        )}

        {telegramUsername && (
          <a
            href={`https://t.me/${telegramUsername.replace('@', '')}`}
            className="flex-1 min-w-[60px] py-2 px-2 rounded bg-sky-500 text-white hover:bg-sky-600 transition font-bold text-xs text-center"
          >
            Chat
          </a>
        )}

        {telegramUsername && (
          <a
            href={`https://t.me/${telegramUsername.replace('@', '')}?text=${encodeURIComponent(
              `Dear ${name}, just a friendly reminder that the rent for ${unitInfo} is now due. Total: ${monthlyRent.toLocaleString('en-ET')} ETB. Regards, Management.`
            )}`}
            className="flex-1 min-w-[60px] py-2 px-2 rounded bg-amber-500 text-white hover:bg-amber-600 transition font-bold text-xs text-center"
          >
            Remind
          </a>
        )}
      </div>
    </div>
  );
};

export default TenantCard;