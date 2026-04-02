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
  console.error("CRITICAL: Google Script URL is missing! Ensure VITE_GOOGLE_SCRIPT_URL is defined in your .env file and starts with VITE_");
}

export const fetchTenants = async () => {
  console.log("Attempting to fetch from:", GOOGLE_SCRIPT_URL || "UNDEFINED_URL");
  try {
    if (!GOOGLE_SCRIPT_URL) {
      return []; // Return empty so the app doesn't crash, but log the error above
    }

    const response = await fetch(GOOGLE_SCRIPT_URL, { redirect: 'follow' });
    if (!response.ok) {
      throw new Error(`Server error: ${response.status}`);
    }

    const text = await response.text();
    try {
      return JSON.parse(text);
    } catch (e) {
      console.error("Received non-JSON response:", text);
      throw new Error("The server did not return valid JSON. Check your Google Script deployment.");
    }
  } catch (error) {
    console.error("Error fetching tenants:", error);
    return [];
  }
};

export const createTenant = async (tenantData) => {
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
      throw new Error(`Google Sheets API error: ${response.statusText}`);
    }
    
    const text = await response.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      throw new Error("The server did not return valid JSON. Check your Google Script deployment.");
    }
    
    return { id: data.id, ...tenantData };
  } catch (error) {
    throw new Error(error.message || "Unknown error during creation");
  }
};

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
      throw new Error(`Google Sheets API error: ${response.statusText}`);
    }

    const text = await response.text();
    try {
      return JSON.parse(text);
    } catch (e) {
      return { id, ...fields }; // Fallback if script returns simple success
    }
  } catch (error) {
    throw new Error(error.message || "Failed to update tenant");
  }
};