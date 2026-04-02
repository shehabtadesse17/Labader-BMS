// src/App.jsx
import React, { useEffect, useState } from 'react';
import TenantCard from './TenantCard';
import AddTenantForm from './AddTenantForm';
import { fetchTenants, updateTenant, deleteTenant } from './airtable';

function App() {
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Derived Stats calculated from actual data
  const totalRevenue = Array.isArray(tenants)
    ? tenants.reduce((sum, t) => sum + (t && !isNaN(Number(t.monthlyRent)) ? Number(t.monthlyRent) : 0), 0)
    : 0;
    
  const totalUnpaid = Array.isArray(tenants)
    ? tenants.reduce((sum, t) => sum + (t && !t.paidStatus && !isNaN(Number(t.monthlyRent)) ? Number(t.monthlyRent) : 0), 0)
    : 0;

  const occupancyRate = Array.isArray(tenants) ? Math.min(Math.round((tenants.length / 20) * 100), 100) : 0;
  
  const overdueCount = Array.isArray(tenants) ? tenants.filter(t => {
    if (!t || typeof t.dueDay === 'undefined' || isNaN(Number(t.dueDay))) {
      console.warn("Tenant data missing or invalid dueDay:", t);
      return false;
    }
    const currentDate = new Date();
    const currentDayOfMonth = currentDate.getDate();
    return currentDayOfMonth > t.dueDay && !t.paidStatus;
  }).length : 0;

  // Filter tenants based on search term
  const filteredTenants = Array.isArray(tenants) ? tenants.filter(t => {
    if (!t || !t.name || !t.unitInfo) return false; // Ensure name and unitInfo exist for filtering
    const search = searchTerm.toLowerCase();
    // Ensure properties are strings before calling toLowerCase
    const nameMatch = String(t.name).toLowerCase().includes(search);
    const unitMatch = String(t.unitInfo).toLowerCase().includes(search);
    return nameMatch || unitMatch;
  }) : [];

  const loadData = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const data = await fetchTenants();
      setTenants(data);
      if (isManual && window.Telegram?.WebApp?.HapticFeedback) {
        window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
      }
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

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

    loadData();

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

  const handleDeleteTenant = async (id) => {
    const tg = window.Telegram?.WebApp;
    // Use Telegram's native confirmation dialog if available, otherwise fallback to browser confirm
    const confirmDelete = tg?.showConfirm 
      ? await new Promise(resolve => tg.showConfirm("Are you sure you want to delete this tenant?", resolve))
      : window.confirm("Are you sure you want to delete this tenant?");

    if (!confirmDelete) return;

    try {
      await deleteTenant(id);
      // Remove from local state immediately for a fast UI feel
      setTenants(prev => prev.filter(t => t.id !== id));
      
      if (tg?.HapticFeedback) {
        tg.HapticFeedback.notificationOccurred('success');
      }
    } catch (error) {
      alert("Failed to delete: " + error.message);
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

  return ( // Main container for the app
    <div className="min-h-screen bg-gray-100 p-4 font-sans" style={{ backgroundColor: 'var(--tg-theme-bg-color)' }}>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900" style={{ color: 'var(--tg-theme-text-color)' }}>
          Labader BMS
        </h1>
        <button 
          onClick={() => loadData(true)}
          disabled={refreshing}
          className={`p-2 rounded-full transition-all ${refreshing ? 'opacity-50' : 'active:scale-90'}`}
          title="Refresh Data"
        >
          <svg 
            className={`w-6 h-6 ${refreshing ? 'animate-spin' : ''}`} 
            style={{ color: 'var(--tg-theme-button-color, #2563eb)' }}
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>

      {showForm && <AddTenantForm onTenantAdded={handleTenantAdded} />}

      {/* Dashboard Summary Stats Placeholder */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold text-gray-700">Total Potential Revenue</h2>
          <p className="text-2xl font-bold text-green-600">ETB {totalRevenue.toLocaleString()}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold text-gray-700">Total Unpaid</h2>
          <p className="text-2xl font-bold text-orange-600">ETB {totalUnpaid.toLocaleString()}</p>
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

      {filteredTenants.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTenants.map(tenant => ( // Ensure tenant.id is unique and stable
            <TenantCard key={tenant.id || Math.random()} tenant={tenant} onTogglePaid={handleTogglePaid} onDelete={handleDeleteTenant} />
          ))}
        </div>
      ) : (
        <div className="text-center p-8 bg-white rounded-xl shadow-sm text-gray-500">
          No tenants found matching your criteria.
        </div>
      )}
    </div>
  );
}

export default App;