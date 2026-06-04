# Aegis Academy - School Management ERP

A complete, modern, and fully responsive **School Management System Dashboard** web application designed to govern institutional academic operations, from student enrollment to daily rolls registries, examination schedules, and automated evaluation grading slips.

## 🚀 Tech Stack

- **Frontend:** React 19 + Tailwind CSS 4 (utilizing Inter & JetBrains Mono typography pairings)
- **Backend:** Node.js + Express.js (supporting role validation middleware)
- **Authentication:** Standard secure JWT (JSON Web Tokens) Authentication
- **Database Layer:** File-based collection engine matching MongoDB's collection-document architecture (highly performant and immediately persistent in sandboxes)
- **PDF Exporters:** Built-in `jsPDF` custom document compilation
- **Data Visualizer:** `recharts` responsive SVG analytics

---

## 🎨 Architectural Overview

The application is structured for complete separation of concerns and type-safety:

```
├── data/                    # JSON database collections (autoseeded on first launch)
├── server/
│   └── db.ts                # Database engine & seed files
├── src/
│   ├── components/
│   │   ├── Header.tsx       # Live dual clock & theme manager
│   │   ├── Sidebar.tsx      # Role-based sidebar navigation
│   │   └── ToastContainer.tsx # Sliding visual notifications
│   ├── context/
│   │   └── AppContext.tsx   # Centralized theme & authentication state
│   ├── lib/
│   │   ├── api.ts           # Axios-like token request proxy
│   │   └── pdfExporter.ts   # jsPDF document layout generator
│   ├── pages/
│   │   ├── Login.tsx        # Responsive access portal
│   │   ├── AdminDashboard.tsx   # Institutional grid controls
│   │   ├── TeacherDashboard.tsx # Teacher operational rolls
│   │   ├── StudentDashboard.tsx # Grades checks & report slips
│   │   └── ParentDashboard.tsx  # Student metrics & progress commentaries
│   ├── App.tsx              # Main layout router
│   └── main.tsx             # React DOM renderer
├── server.ts                # Full-stack express development entry point
├── package.json             # Build script orchestrators
└── tsconfig.json            # Strict type settings
```

---

## 🔐 Credentials & Access Roles

During database initialization, the backend autoseeds a rich set of demographical accounts for convenient validation:

| Identity Key | Username | Password | Linked Reference ID | Role Description |
| :--- | :--- | :--- | :--- | :--- |
| **Administrator** | `admin` | `admin123` | `ADM101` | Core executive clearance |
| **Teacher** | `teacher` | `teacher123` | `TCH101` (David Miller) | Classroom instruct rolls |
| **Student** | `student` | `student123` | `STU001` (Alex Mercer) | Grades files checks |
| **Parent** | `parent` | `parent123` | `STU001` (Alex Mercer) | Student progress commentaries |

---

## 🛠️ Local Development Setup

To run this application locally, ensure you have **Node.js 18+** installed. Follow these steps:

1. **Clone & Extract** the source folder onto your local disk.
2. **Install dependencies** using npm:
   ```bash
   npm install
   ```
3. **Configure environment secrets** (Optional): Create a `.env` file in the root directory (using `.env.example` as a template).
   ```bash
   JWT_SECRET="school-management-system-super-secret-key"
   ```
4. **Boot up the server** in development mode:
   ```bash
   npm run dev
   ```
   The application will spin up instantly at `http://localhost:3000`, routing both the React assets and the Express API server dynamically!

---

## ⚙️ Compilation & Production Builds

To compile the application for safe, lightweight production containers:

1. **Build and bundle assets:**
   ```bash
   npm run build
   ```
   This generates compiled frontend output assets inside `/dist/index.html` and compiles the Node backend into a single self-contained CommonJS file `dist/server.cjs` via `esbuild`.

2. **Launch the production container:**
   ```bash
   npm run start
   ```
