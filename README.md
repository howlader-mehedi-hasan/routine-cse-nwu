# NWU Smart Routine Management System

A modern, full-stack web application designed for North Western University (NWU) to manage and display academic class routines. This system provides a professional interface for students, faculty, and administrators, featuring robust routine management, customizable PDF exports, and secure cloud backups.

## ✨ Key Features

-   **🗓️ Comprehensive Routine Management**:
    -   **Weekly View**: A high-level overview of the entire department's schedule.
    -   **Daily View**: Individual batch/section routines for day-to-day use.
    -   **Interactive Editing**: Admins can add, update, or delete classes directly from the week view.
-   **📂 Advanced PDF Exports**:
    -   Professional-grade routine exports with custom university headers, departmental info, and semester details.
    -   Supports digital signatures and custom footer text.
    -   **Theme Persistence**: Exported PDFs always maintain a professional light theme, regardless of the user's interface settings.
-   **📞 Faculty Directory**:
    -   Search and filter faculty members by name, initials, or type (Permanent/Guest).
    -   **One-Click Contact**: Integrated Phone and WhatsApp contact buttons for immediate communication.
-   **🔒 Secure Administration**:
    -   Manage Faculty, courses, rooms, and batches through a dedicated Admin Panel.
    -   **Audit Logs**: Comprehensive tracking of all administrative actions for transparency.
-   **☁️ Backup & Restore**:
    -   **Local Backup**: Export routine data as JSON files for local storage.
    -   **Cloud Backup**: Seamless integration with Supabase for secure, off-site storage and easy restoration.
-   **🌗 Modern Professional UI**:
    -   Fully responsive design built with React 19 and Tailwind CSS 4.
    -   Dynamic Dark/Light mode support with smooth transitions.

## 🛠️ Tech Stack

-   **Frontend**: React 19, Vite, Tailwind CSS 4, Framer Motion, Lucide React, Radix UI.
-   **Backend**: Node.js, Express 5.
-   **Database & Storage**: Supabase (Postgres & Storage Buckets).
-   **Authentication**: JWT-based secure login and role-based access control.
-   **Utilities**: jsPDF (with AutoTable) for client-side document generation.

## 📂 Project Structure

```
routine-cse-nwu/
├── src/                    # React Frontend Source
│   ├── components/         # UI Components (Admin, Routine, Backups, etc.)
│   ├── services/           # Backend API integration (Axios)
│   ├── utils/              # PDF Generator and helper functions
│   └── ...
├── controllers/            # Express Request Handlers
├── routes/                 # API Endpoint Definitions
├── repositories/           # Supabase Database Access Layer
├── middleware/             # Auth and Logging Middlewares
├── public/                 # Static Assets
└── package.json            # Project Dependencies & Scripts
```

## 🚀 Installation & Setup

### Prerequisites
-   **Node.js** (v18+ recommended)
-   **Supabase Account** (for database and cloud storage)

### 1. Clone the Repository
```bash
git clone <repository-url>
cd routine-cse-nwu
```

### 2. Configure Environment Variables
Create a `.env` file in the root directory and add your credentials:
```env
# Server Configuration
PORT=5000
JWT_SECRET=your_jwt_secret

# Supabase Configuration
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_anon_key

# Frontend Configuration
VITE_API_URL=http://localhost:5000/api
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Start the Application
The application uses `concurrently` to run both the frontend and backend in a single terminal.
```bash
npm run dev
```
-   **Frontend**: Available at `http://localhost:5173`
-   **Backend API**: Available at `http://localhost:5000/api`

## 📊 Feature Management
-   **Audit Logs**: Accessible to Super Admins to monitor system changes.
-   **Settings**: Global application and PDF layout configurations can be managed in the Settings modal.

## 🤝 Contributing
Contributions are welcome! If you find a bug or have a feature request, please open an issue or submit a pull request.
