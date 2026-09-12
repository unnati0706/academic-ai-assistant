const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

/**
 * Generic API fetch wrapper with Authorization header injection.
 */
export async function apiFetch(endpoint, options = {}) {
  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("token") ||
        localStorage.getItem("access_token") ||
        localStorage.getItem("academic_ai_token")
      : null;

  const headers = { ...options.headers };

  // Do not set Content-Type if body is FormData
  if (!(options.body instanceof FormData) && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  if (token && !headers["Authorization"]) {
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
      let detailMsg = errorData.detail || errorData.message || errorData.error;
      if (Array.isArray(detailMsg)) {
        detailMsg = detailMsg
          .map((d) =>
            typeof d === "object" && d.msg
              ? `${d.loc ? d.loc.slice(1).join(".") + ": " : ""}${d.msg}`
              : typeof d === "object"
              ? JSON.stringify(d)
              : String(d)
          )
          .join(", ");
      } else if (typeof detailMsg === "object" && detailMsg !== null) {
        detailMsg = JSON.stringify(detailMsg);
      }
      throw new Error(detailMsg || `Request failed with status ${res.status}`);
    }
    if (res.status === 204) return null;
    return await res.json();
  } catch (err) {
    const rawMsg =
      err?.response?.data?.detail ||
      err?.detail ||
      err?.message ||
      (typeof err === "object" ? JSON.stringify(err) : String(err));
    const errorMsg =
      rawMsg === "Failed to fetch" || err.name === "TypeError"
        ? `Unable to connect to backend server at ${API_BASE_URL}. Please ensure backend is running.`
        : typeof rawMsg === "object"
        ? JSON.stringify(rawMsg)
        : String(rawMsg);
    console.warn(`API call failed for ${endpoint}:`, errorMsg);
    throw new Error(errorMsg);
  }
}

// API Endpoints
export const api = {
  // Auth
  login: (email, password, role = "student") =>
    apiFetch("/auth/login", { method: "POST", body: JSON.stringify({ email, password, role }) }),

  signup: (email, password, role = "student", name = "", department = null, semester = null) =>
    apiFetch("/auth/signup", { method: "POST", body: JSON.stringify({ email, password, role, name, department, semester }) }),

  verifyOtp: (email, token, role = "student") =>
    apiFetch("/auth/verify-otp", { method: "POST", body: JSON.stringify({ email, token, role }) }),
  getMe: () => apiFetch("/auth/me"),

  // Materials & Subjects
  getMaterials: (params = {}) => {
    const query = new URLSearchParams();
    if (params.semester) query.append("semester", params.semester);
    if (params.subject_id) query.append("subject_id", params.subject_id);
    if (params.unit) query.append("unit", params.unit);
    if (params.material_type) query.append("material_type", params.material_type);
    if (params.search) query.append("search", params.search);
    if (params.uploaded_by) query.append("uploaded_by", params.uploaded_by);
    const queryString = query.toString() ? `?${query.toString()}` : "";
    return apiFetch(`/materials${queryString}`);
  },

  getFacultyMaterials: (facultyId) => apiFetch(`/materials/faculty/${facultyId}`),

  uploadMaterial: (formData) =>
    apiFetch("/materials/upload", {
      method: "POST",
      body: formData,
    }),

  archiveMaterial: (materialId) =>
    apiFetch(`/materials/${materialId}/archive`, {
      method: "PATCH",
    }),

  deleteMaterial: (materialId) =>
    apiFetch(`/materials/${materialId}`, {
      method: "DELETE",
    }),

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

  uploadChatFile: (formData) =>
    apiFetch("/chat/upload", {
      method: "POST",
      body: formData,
      // Note: response includes document_metadata field for Document Intelligence Panel
    }),

  getChatSessions: () => apiFetch("/chat/sessions"),
  getChatSessionDetails: (sessionId) => apiFetch(`/chat/sessions/${sessionId}`),
};
