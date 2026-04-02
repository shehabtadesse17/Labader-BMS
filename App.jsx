// src/App.jsx
import React, { useEffect, useState } from 'react';
import TenantCard from './TenantCard';
import AddTenantForm from './AddTenantForm';
import Login from './Login';
import { fetchTenants, updateTenant, deleteTenant, fetchSettings, updateSettings } from './airtable';

// --- Start ErrorBoundary Component ---
// A simple Error Boundary to catch rendering errors and prevent blank screens
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error: error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Uncaught error in App component:", error, errorInfo);
    this.setState({ errorInfo: errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return <div className="p-4 text-center text-red-500 bg-white rounded-lg shadow-md m-4">
        <h2 className="text-xl font-bold mb-2">Something went wrong.</h2>
        <p className="text-sm">Please try refreshing the page.</p>
        {this.state.error && <details className="mt-4 text-left text-xs text-gray-700">
          <summary>Error Details</summary>
          <pre className="whitespace-pre-wrap break-all">{this.state.error.toString()}</pre>
          <pre className="whitespace-pre-wrap break-all">{this.state.errorInfo?.componentStack}</pre>
        </details>}
      </div>;
    }
    return this.props.children;
  }
}
// --- End ErrorBoundary Component ---

function App() {
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [ownerId, setOwnerId] = useState('GUEST_USER'); // Fallback for browser testing
  const [buildingName, setBuildingName] = useState('Labader BMS');
  const [email, setEmail] = useState('');
  const [isEditingName, setIsEditingName] = useState(false);
  const [view, setView] = useState('dashboard');

  // Derived Stats calculated from actual data
  const totalRevenue = Array.isArray(tenants)
    ? tenants.reduce((sum, t) => sum + (t && !isNaN(Number(t.monthlyRent)) ? Number(t.monthlyRent) : 0), 0)
    : 0;
    
  const totalUnpaid = Array.isArray(tenants)
    ? tenants.reduce((sum, t) => sum + (t && !t.paidStatus && !isNaN(Number(t.monthlyRent)) ? Number(t.monthlyRent) : 0), 0)
    : 0;

  const occupancyRate = Array.isArray(tenants) ? Math.min(Math.round((tenants.length / 20) * 100), 100) : 0;
  
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
      // Load tenants and settings in parallel
      const [tenantData, settings] = await Promise.all([
        fetchTenants(ownerId),
        fetchSettings(ownerId)
      ]);
      setTenants(tenantData);
      if (settings?.buildingName) setBuildingName(settings.buildingName);
      if (settings?.email) setEmail(settings.email);
      
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
    if (window.Telegram?.WebApp) { // Use optional chaining for safer access
      const tg = window.Telegram.WebApp;
      
      if (tg.initDataUnsafe?.user?.id) {
        console.log("Logged in as Telegram User:", tg.initDataUnsafe.user.id);
        setOwnerId(tg.initDataUnsafe.user.id.toString());
      }

      tg.ready();
      tg.expand(); // Expand the Mini App to full height

      // Apply Telegram theme colors to CSS variables
      const applyTheme = () => {
        const themeParams = tg.themeParams;
        if (themeParams) { // Check for themeParams to ensure they are loaded
          document.documentElement.style.setProperty('--tg-theme-bg-color', themeParams.bg_color || '#ffffff'); // Fallback color
          document.documentElement.style.setProperty('--tg-theme-text-color', themeParams.text_color || '#000000'); // Fallback color
          // You can add more theme parameters here if needed, e.g., tg.themeParams.hint_color
        }
      }
      applyTheme(); // Apply theme on initial load
      tg.onEvent('themeChanged', applyTheme); // Listen for theme changes
      cleanupThemeListener = () => tg.offEvent('themeChanged', applyTheme);
    }
    return cleanupThemeListener;
  }, []);

  // Re-fetch data whenever ownerId is set
  useEffect(() => {
    loadData();
  }, [ownerId]);

  // Use Telegram Native Main Button for a professional look
  useEffect(() => {
    if (window.Telegram?.WebApp) { // Use optional chaining for safer access
      const tg = window.Telegram.WebApp;
      
      tg.MainButton.setParams({
        text: showForm ? 'BACK TO LIST' : 'ADD NEW TENANT',
        color: showForm ? '#6b7280' : '#2563eb', // Gray for back, Blue for add
        is_visible: true // Always visible
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
      await deleteTenant(id, ownerId);
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
      await updateTenant(id, { paidStatus: !currentStatus }, ownerId);
    } catch (error) {
      // Roll back if it fails
      setTenants(prev => prev.map(t => t.id === id ? { ...t, paidStatus: currentStatus } : t));
      alert("Failed to update payment status. Please try again.");
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    // Optionally reset other state if needed
  };

  const handleUpdateBuildingName = async (newName) => {
    const oldName = buildingName;
    setBuildingName(newName);
    setIsEditingName(false);
    try {
      await updateSettings(ownerId, { buildingName: newName, email });
    } catch (err) {
      setBuildingName(oldName);
      alert("Failed to save building name.");
    }
  };

  if (error) return <div className="p-4 text-center text-red-500">Error: {error.message}</div>;
  if (loading) return <div className="p-4 text-center text-gray-600">Loading tenants...</div>;

  if (!isLoggedIn) {
    return <Login onLogin={() => setIsLoggedIn(true)} ownerId={ownerId} />;
  }

  if (view === 'profile') {
    return (
      <div className="min-h-screen bg-gray-100 p-4 font-sans" style={{ backgroundColor: 'var(--tg-theme-bg-color)' }}>
        <div className="max-w-md mx-auto bg-white rounded-xl shadow-md p-6 mt-10" style={{ backgroundColor: 'var(--tg-theme-secondary-bg-color, #ffffff)' }}>
          <h2 className="text-2xl font-bold mb-6" style={{ color: 'var(--tg-theme-text-color)' }}>Owner Profile</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--tg-theme-hint-color)' }}>Building Name</label>
              <input
                type="text"
                className="w-full p-2 border rounded"
                value={buildingName}
                onChange={(e) => setBuildingName(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--tg-theme-hint-color)' }}>Contact Email</label>
              <input
                type="email"
                className="w-full p-2 border rounded"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="flex gap-2 pt-4">
              <button
                onClick={async () => {
                  try {
                    await updateSettings(ownerId, { buildingName, email });
                    setView('dashboard');
                  } catch (err) {
                    alert("Failed to save profile settings.");
                  }
                }}
                className="flex-1 bg-blue-600 text-white py-2 rounded font-bold"
              >
                Save Changes
              </button>
              <button onClick={() => setView('dashboard')} className="flex-1 bg-gray-200 py-2 rounded font-bold">Cancel</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (ownerId === 'GUEST_USER' && window.Telegram?.WebApp?.initDataUnsafe?.user) {
    return <div className="p-4 text-center">Identifying building owner...</div>;
  }

  return ( // Main container for the app
    <ErrorBoundary>
    <div className="min-h-screen bg-gray-100 p-4 font-sans" style={{ backgroundColor: 'var(--tg-theme-bg-color)' }}>
      <div className="flex justify-between items-center mb-6 gap-2">
        <div className="flex-1">
          {isEditingName ? (
            <input
              autoFocus
              className="text-2xl font-bold bg-transparent border-b-2 border-blue-500 focus:outline-none w-full"
              style={{ color: 'var(--tg-theme-text-color)' }}
              defaultValue={buildingName}
              onBlur={(e) => handleUpdateBuildingName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleUpdateBuildingName(e.target.value)}
            />
          ) : (
            <h1 
              onClick={() => setIsEditingName(true)}
              className="text-2xl font-bold text-gray-900 cursor-pointer hover:opacity-80 transition-opacity flex items-center gap-2" 
              style={{ color: 'var(--tg-theme-text-color)' }}
            >
              {buildingName}
              <span className="text-xs opacity-30">✏️</span>
            </h1>
          )}
        </div>
        
        <button 
          onClick={() => setView('profile')}
          className="p-2 rounded-full hover:bg-blue-50 text-blue-500 transition-colors"
          title="Profile"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </button>

        <button 
          onClick={handleLogout}
          className="p-2 rounded-full hover:bg-red-50 text-red-500 transition-colors"
          title="Logout"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
        </button>

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

      {showForm && <AddTenantForm onTenantAdded={handleTenantAdded} ownerId={ownerId} />}

      {/* Dashboard Summary Stats Placeholder */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-6">
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
    </ErrorBoundary>
  );
}

export default App;