const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

/**
 * Generic API fetch wrapper with Authorization header injection.
 */
export async function apiFetch(endpoint, options = {}) {
  const token = typeof window !== "undefined" ? localStorage.getItem("academic_ai_token") : null;
  
  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers,
  };

  try {
    const res = await fetch(`${API_BASE_URL}${endpoint}`, config);
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.detail || `Request failed with status ${res.status}`);
    }
    return await res.json();
  } catch (err) {
    console.warn(`API call failed for ${endpoint}:`, err.message);
    throw err;
  }
}

// API Endpoints
export const api = {
  // Auth
  verifyOtp: (email, token) => apiFetch("/auth/verify-otp", { method: "POST", body: JSON.stringify({ email, token }) }),
  getMe: () => apiFetch("/auth/me"),

  // Materials & Subjects
  getMaterials: (params = {}) => {
    const query = new URLSearchParams();
    if (params.semester) query.append("semester", params.semester);
    if (params.subject_id) query.append("subject_id", params.subject_id);
    if (params.unit) query.append("unit", params.unit);
    if (params.material_type) query.append("material_type", params.material_type);
    if (params.search) query.append("search", params.search);
    const queryString = query.toString() ? `?${query.toString()}` : "";
    return apiFetch(`/materials${queryString}`);
  },

  // Question Papers
  getPapers: (params = {}) => {
    const query = new URLSearchParams();
    if (params.semester) query.append("semester", params.semester);
    if (params.subject_id) query.append("subject_id", params.subject_id);
    if (params.exam_type) query.append("exam_type", params.exam_type);
    if (params.year) query.append("year", params.year);
    if (params.search) query.append("search", params.search);
    const queryString = query.toString() ? `?${query.toString()}` : "";
    return apiFetch(`/papers${queryString}`);
  },

  // Announcements
  getAnnouncements: () => apiFetch("/announcements"),

  // RAG Chat
  askQuestion: (question, session_id = null) => 
    apiFetch("/chat", {
      method: "POST",
      body: JSON.stringify({ question, session_id }),
    }),
  
  getChatSessions: () => apiFetch("/chat/sessions"),
  getChatSessionDetails: (sessionId) => apiFetch(`/chat/sessions/${sessionId}`),
};
