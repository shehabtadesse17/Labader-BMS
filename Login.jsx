import React from 'react';

const Login = ({ onLogin, ownerId }) => {
  const isGuest = ownerId === 'GUEST_USER';

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6" style={{ backgroundColor: 'var(--tg-theme-bg-color, #f9fafb)' }}>
      <div className="w-full max-w-sm bg-white rounded-[2rem] shadow-xl p-8 text-center border border-gray-100" style={{ backgroundColor: 'var(--tg-theme-secondary-bg-color, #ffffff)' }}>
        <div className="mb-8">
          <div className="w-24 h-24 bg-blue-600 rounded-3xl mx-auto flex items-center justify-center text-white text-5xl shadow-2xl shadow-blue-200">
            🏢
          </div>
        </div>
        
        <h1 className="text-3xl font-black text-gray-900 mb-2" style={{ color: 'var(--tg-theme-text-color, #111827)' }}>
          Labader BMS
        </h1>
        <p className="text-gray-500 mb-10 leading-relaxed" style={{ color: 'var(--tg-theme-hint-color, #6b7280)' }}>
          Manage your property, track payments, and contact tenants all in one place.
        </p>
        
        <button
          onClick={onLogin}
          className="w-full bg-blue-600 text-white font-extrabold py-4 rounded-2xl hover:bg-blue-700 transition-all active:scale-95 shadow-lg shadow-blue-100 uppercase tracking-wider"
          style={{ backgroundColor: 'var(--tg-theme-button-color, #2563eb)', color: 'var(--tg-theme-button-text-color, #ffffff)' }}
        >
          Enter Dashboard
        </button>
        
        <div className="mt-8 pt-6 border-t border-gray-50">
          <p className={`text-xs font-bold px-3 py-1 rounded-full inline-block ${isGuest ? 'bg-amber-50 text-amber-600' : 'bg-green-50 text-green-600'}`}>
            {isGuest ? '⚠️ BROWSER MODE: GUEST SESSION' : `🔒 SECURE SESSION: ${ownerId}`}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;