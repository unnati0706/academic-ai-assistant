# Role & Context
You are a Principal Frontend Engineer building the web client for "AcademicAI", an academic resource portal and RAG assistant for students and faculty.

# Strict Technical Constraints
- Framework: Next.js (App Router)
- Language: Plain JavaScript (ES6+). ABSOLUTELY NO TYPESCRIPT. Do NOT create .ts, .tsx files, interfaces, or tsconfig.json.
- Styling: Tailwind CSS
- UI Components: Clean modular accessible design
- Icons: lucide-react
- State & Data Fetching: React hooks, Axios or native fetch with clean error/loading state handling.

# Application Structure to Build

1. Layout & Route Shells:
   - Root Layout (`app/layout.js`) with responsive themes and typography.
   - Student Dashboard Shell (`app/student/layout.js`) with sidebar navigation:
     * Dashboard (`/student/dashboard`)
     * AI Academic Chat (`/student/chat`)
     * Browse Materials (`/student/materials`)
     * Previous Papers (`/student/papers`)
     * Bookmarks (`/student/bookmarks`)
     * Profile (`/student/profile`)
   - Admin/Faculty Shell (`app/admin/layout.js`) with sidebar:
     * Overview (`/admin/dashboard`)
     * Manage Materials (`/admin/materials`, `/admin/materials/new`)
     * Manage Papers (`/admin/papers`, `/admin/papers/new`)
     * Manage Students (`/admin/students`)
     * Announcements (`/admin/announcements`)

2. Key UI Modules to Implement:
   - Authentication Screen (`app/login/page.js`): Card with tabs for Email/Phone OTP login, OTP verification input, resend cooldown timer, and automatic redirect based on user role.
   - AI Chatbot Page (`app/student/chat/page.js`):
     * Left pane: Chat session history.
     * Center pane: Chat interface with distinct message bubbles for student and AI.
     * Streaming response capability or clean loading indicator.
     * Interactive citation tags below AI answers showing document title and page number that open or highlight the reference.
   - Resource Explorer (`app/student/materials/page.js`):
     * Filter bar: Semester dropdown, Subject dropdown, Unit, and Search keyword bar.
     * Material card grid showing title, unit, material type badge, download button, and "Chat with this Doc" button.
   - Admin Upload Form (`app/admin/materials/new/page.js`):
     * Drag-and-drop file upload zone for PDF/PPT.
     * Metadata fields: Title, Subject, Semester, Unit, Material Type.
     * Real-time upload and RAG indexing progress indicator.

3. Environment Variables:
   - `NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api/v1`
   - `NEXT_PUBLIC_SUPABASE_URL=`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY=`

Generate clean, componentized JavaScript code adhering to modern UX practices with proper loading spinners, empty states, and error alerts.