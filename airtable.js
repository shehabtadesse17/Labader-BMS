// Re-purposing airtable.js to use Google Sheets to avoid changing all imports

let GOOGLE_SCRIPT_URL = import.meta.env.VITE_GOOGLE_SCRIPT_URL || "";

// Robustly ensure the URL ends with /exec
const normalizeUrl = (url) => {
  if (!url) return url;
  const cleanUrl = url.trim();
  if (cleanUrl.endsWith('/exec') || cleanUrl.endsWith('/exec/')) return cleanUrl;
  return cleanUrl.endsWith('/') ? `${cleanUrl}exec` : `${cleanUrl}/exec`;
};

GOOGLE_SCRIPT_URL = normalizeUrl(GOOGLE_SCRIPT_URL);

if (!GOOGLE_SCRIPT_URL) {
  console.error("CRITICAL: VITE_GOOGLE_SCRIPT_URL is undefined. Check your .env file and ensure the variable starts with VITE_.");
}

export const fetchTenants = async () => {
  console.log("Fetch Initiated. URL:", GOOGLE_SCRIPT_URL || "MISSING_URL");
  try {
    if (!GOOGLE_SCRIPT_URL) {
      throw new Error("Cannot fetch: VITE_GOOGLE_SCRIPT_URL is missing.");
    }

    const response = await fetch(GOOGLE_SCRIPT_URL, { redirect: 'follow' });
    if (!response.ok) {
      throw new Error(`Server error: ${response.status}`);
    }

    const text = await response.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      console.error("Received non-JSON response:", text);
      throw new Error("The server did not return valid JSON. Check your Google Script deployment.");
    }

    if (!Array.isArray(data)) {
      throw new Error(`Expected an array of tenants, but received: ${JSON.stringify(data)}. Check your Google Script output.`);
    }
    return data;
  } catch (error) {
    console.error("Fetch failed:", error);
    throw error; // Rethrow so App.jsx can catch it and update the UI
  }
};

// Function to create a new tenant
export const createTenant = async (tenantData) => {
  console.log("Attempting to CREATE tenant. URL:", GOOGLE_SCRIPT_URL || "MISSING_URL");
  try {
    const response = await fetch(GOOGLE_SCRIPT_URL, {
      method: 'POST',
      mode: 'cors',
      redirect: 'follow',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify({ action: 'CREATE', data: tenantData }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Server responded with ${response.status}: ${errorText || response.statusText}`);
    }
    
    const text = await response.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      throw new Error(`Invalid JSON response from server during creation: ${text}`);
    }
    
    if (data.status === 'error') {
      throw new Error(data.message || "Unknown error from server during creation.");
    }

    // Assuming the script returns the created tenant data including its ID
    return { id: data.id, ...tenantData }; 
  } catch (error) {
    console.error("Create Tenant Failed:", error);
    throw new Error(error.message || "Unknown error during creation");
  }
};

// Function to update an existing tenant
export const updateTenant = async (id, fields) => {
  try {
    const response = await fetch(GOOGLE_SCRIPT_URL, {
      method: 'POST',
      mode: 'cors',
      redirect: 'follow',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify({ action: 'UPDATE', id, data: fields }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Server responded with ${response.status}: ${errorText || response.statusText}`);
    }

    const text = await response.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      throw new Error(`Invalid JSON response from server during update: ${text}`);
    }

    if (data.status === 'error') {
      throw new Error(data.message || "Unknown error from server during update.");
    }
    return { id, ...fields }; // Return updated fields
  } catch (error) {
    console.error("Update Tenant Failed:", error);
    throw new Error(error.message || "Failed to update tenant");
  }
};

// Function to delete a tenant
export const deleteTenant = async (id) => {
  try {
    const response = await fetch(GOOGLE_SCRIPT_URL, {
      method: 'POST',
      mode: 'cors',
      redirect: 'follow',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify({ action: 'DELETE', id }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Server responded with ${response.status}: ${errorText || response.statusText}`);
    }

    const text = await response.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      throw new Error(`Invalid JSON response from server during deletion: ${text}`);
    }
    if (data.status === 'error') {
      throw new Error(data.message || "Unknown error from server during deletion.");
    }

    return true;
  } catch (error) {
    console.error("Delete Tenant Failed:", error);
    throw new Error(error.message || "Failed to delete tenant");
  }
};