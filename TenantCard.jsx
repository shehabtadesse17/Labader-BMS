// src/components/TenantCard.jsx
import React from 'react';

const TenantCard = ({ tenant, onTogglePaid, onDelete }) => {
  const { id, name, unitInfo, phoneNumber, telegramUsername, memberSince, monthlyRent, dueDay, paidStatus } = tenant || {}; // Add default empty object for safety

  const cardClasses = `
    bg-white p-4 rounded-lg shadow-md mb-4
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

  // Ensure monthlyRent is a number before calling toLocaleString
  const displayMonthlyRent = !isNaN(Number(monthlyRent)) ? Number(monthlyRent).toLocaleString('en-ET') : 'N/A';

  return (
    <div className={cardClasses}>
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-lg font-bold text-gray-800">{name}</h3>
        

        <button
          onClick={() => onDelete(id)}
          className="px-2 py-1 rounded bg-red-500 text-white hover:bg-red-600 transition font-bold text-[10px] uppercase shadow-sm"
        >
          Delete
        </button>
      </div>
      <p className="text-gray-600 text-sm mb-1">
        <span className="font-medium">Unit:</span> {unitInfo}
      </p>
      <p className="text-gray-600 text-sm mb-1">
        <span className="font-medium">Member Since:</span> {formattedMemberSince}
      </p>
      <p className="text-gray-800 text-base font-semibold mt-auto">
        {displayMonthlyRent} ETB
      </p>
      
      <div className="flex flex-wrap gap-2 mt-4 pt-2 border-t border-gray-200"> {/* Added border-t for separation */}
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
            href={`https://t.me/${telegramUsername.toString().replace('@', '')}`}
            className="flex-1 min-w-[60px] py-2 px-2 rounded bg-sky-500 text-white hover:bg-sky-600 transition font-bold text-xs text-center"
          >
            Chat
          </a>
        )}

        {telegramUsername && (
          <a
            href={`https://t.me/${telegramUsername.toString().replace('@', '')}?text=${encodeURIComponent(
              `Dear ${name}, just a friendly reminder that the rent for ${unitInfo} is now due. Total: ${displayMonthlyRent} ETB. Regards, Management.`
            )}`} // Use Telegram theme colors for remind
            className="flex-1 min-w-[60px] py-2 px-2 rounded bg-amber-500 text-white hover:bg-amber-600 transition font-bold text-xs text-center" // Amber for remind
          >
            Remind
          </a>
        )}
      </div>
    </div>
  );
};

export default TenantCard;