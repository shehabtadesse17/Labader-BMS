// src/App.jsx
import React, { useEffect, useState } from 'react';
import TenantCard from './TenantCard';
import AddTenantForm from './AddTenantForm';
import { fetchTenants, updateTenant } from './airtable';

function App() {
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Derived Stats calculated from actual data
  const totalRevenue = Array.isArray(tenants) ? tenants.reduce((sum, t) => sum + (Number(t.monthlyRent) || 0), 0) : 0;
  const occupancyRate = Array.isArray(tenants) ? Math.min(Math.round((tenants.length / 20) * 100), 100) : 0;
  const overdueCount = Array.isArray(tenants) ? tenants.filter(t => {
    const currentDate = new Date();
    const currentDayOfMonth = currentDate.getDate();
    return currentDayOfMonth > t.dueDay && !t.paidStatus;
  }).length : 0;

  // Filter tenants based on search term
  const filteredTenants = tenants.filter(t => 
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    t.unitInfo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    // Initialize Telegram Web App
    let cleanupThemeListener = () => {};
    if (window.Telegram && window.Telegram.WebApp) {
      const tg = window.Telegram.WebApp;
      
      tg.ready();
      tg.expand(); // Expand the Mini App to full height

      // Apply Telegram theme colors to CSS variables
      const applyTheme = () => {
        const themeParams = tg.themeParams;
        if (themeParams && themeParams.bg_color) { // Check for bg_color to ensure themeParams are loaded
          document.documentElement.style.setProperty('--tg-theme-bg-color', themeParams.bg_color);
          document.documentElement.style.setProperty('--tg-theme-text-color', themeParams.text_color);
          // You can add more theme parameters here if needed, e.g., tg.themeParams.hint_color
        }
      }
      applyTheme(); // Apply theme on initial load
      tg.onEvent('themeChanged', applyTheme); // Listen for theme changes
      cleanupThemeListener = () => tg.offEvent('themeChanged', applyTheme);
    }

    // Fetch tenants from Airtable
    const getTenants = async () => {
      try {
        const data = await fetchTenants();
        setTenants(data);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    getTenants();

    return cleanupThemeListener;
  }, []);

  // Use Telegram Native Main Button for a professional look
  useEffect(() => {
    if (window.Telegram && window.Telegram.WebApp) {
      const tg = window.Telegram.WebApp;
      
      tg.MainButton.setParams({
        text: showForm ? 'BACK TO LIST' : 'ADD NEW TENANT',
        color: showForm ? '#6b7280' : '#2563eb', // Gray for back, Blue for add
        is_visible: true
      });

      const toggleForm = () => setShowForm(prev => !prev);
      tg.onEvent('mainButtonClicked', toggleForm);
      
      return () => tg.offEvent('mainButtonClicked', toggleForm);
    }
  }, [showForm]);

  const handleTenantAdded = (newTenant) => {
    setTenants([newTenant, ...tenants]);
    setShowForm(false);
    // Trigger success haptic
    if (window.Telegram?.WebApp?.HapticFeedback) {
      window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
    }
  };

  const handleTogglePaid = async (id, currentStatus) => {
    // Optimistically update UI immediately
    setTenants(prev => prev.map(t => t.id === id ? { ...t, paidStatus: !currentStatus } : t));
    
    // Trigger light impact haptic
    if (window.Telegram?.WebApp?.HapticFeedback) {
      window.Telegram.WebApp.HapticFeedback.impactOccurred('medium');
    }

    try {
      await updateTenant(id, { paidStatus: !currentStatus });
    } catch (error) {
      // Roll back if it fails
      setTenants(prev => prev.map(t => t.id === id ? { ...t, paidStatus: currentStatus } : t));
      alert("Failed to update payment status. Please try again.");
    }
  };

  if (error) return <div className="p-4 text-center text-red-500">Error: {error.message}</div>;
  if (loading) return <div className="p-4 text-center text-gray-600">Loading tenants...</div>;

  return (
    <div className="min-h-screen bg-gray-100 p-4 font-sans" style={{ backgroundColor: 'var(--tg-theme-bg-color)' }}>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900" style={{ color: 'var(--tg-theme-text-color)' }}>Labader BMS Dashboard</h1>
      </div>

      {showForm && <AddTenantForm onTenantAdded={handleTenantAdded} />}

      {/* Dashboard Summary Stats Placeholder */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold text-gray-700">Total Potential Revenue</h2>
          <p className="text-2xl font-bold text-green-600">ETB {totalRevenue.toLocaleString()}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold text-gray-700">Occupancy Rate</h2>
          <p className="text-2xl font-bold text-blue-600">{occupancyRate}%</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold text-gray-700">Overdue Payments</h2>
          <p className="text-2xl font-bold text-red-600">{overdueCount}</p>
        </div>
      </div>

      <div className="mb-6">
        <input
          type="text"
          placeholder="Search name or unit..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full p-3 rounded-xl border-none shadow-sm focus:ring-2 focus:ring-blue-500"
          style={{ 
            backgroundColor: 'var(--tg-theme-secondary-bg-color, #ffffff)', 
            color: 'var(--tg-theme-text-color, #000000)' 
          }}
        />
      </div>

      <h2 className="text-xl font-bold mb-4 text-gray-900" style={{ color: 'var(--tg-theme-text-color)' }}>
        {searchTerm ? `Search Results (${filteredTenants.length})` : 'Tenant List'}
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTenants.map(tenant => (
          <TenantCard key={tenant.id} tenant={tenant} onTogglePaid={handleTogglePaid} />
        ))}
      </div>
    </div>
  );
}

export default App;