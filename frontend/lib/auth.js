/**
 * Auth state storage and management utilities.
 */

export const AUTH_TOKEN_KEY = "academic_ai_token";
export const AUTH_USER_KEY = "academic_ai_user";

export function getStoredToken() {
  if (typeof window === "undefined") return null;
  return (
    localStorage.getItem(AUTH_TOKEN_KEY) ||
    localStorage.getItem("token") ||
    localStorage.getItem("access_token")
  );
}

export function getStoredUser() {
  if (typeof window === "undefined") return null;
  const userStr =
    localStorage.getItem(AUTH_USER_KEY) || localStorage.getItem("user");
  if (!userStr) return null;
  try {
    return JSON.parse(userStr);
  } catch {
    return null;
  }
}

export function setSession(token, user) {
  if (typeof window === "undefined") return;
  localStorage.setItem(AUTH_TOKEN_KEY, token);
  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
  localStorage.setItem("token", token);
  localStorage.setItem("access_token", token);
  localStorage.setItem("user", JSON.stringify(user));
}

export function clearSession() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(AUTH_USER_KEY);
  localStorage.removeItem("token");
  localStorage.removeItem("access_token");
  localStorage.removeItem("user");
}

export const MOCK_STUDENT_USER = {
  id: "00000000-0000-0000-0000-000000000001",
  email: "alex.student@academic.edu",
  phone: "+1-555-0199",
  role: "student",
  name: "Alex Johnson",
  roll_number: "2024-CS-042",
  semester: 5,
  branch: "Computer Science & Engineering",
  created_at: new Date().toISOString(),
};

export const MOCK_FACULTY_USER = {
  id: "00000000-0000-0000-0000-000000000002",
  email: "dr.smith@academic.edu",
  phone: "+1-555-0100",
  role: "faculty_admin",
  name: "Dr. Robert Smith",
  department: "Computer Science",
  created_at: new Date().toISOString(),
};
