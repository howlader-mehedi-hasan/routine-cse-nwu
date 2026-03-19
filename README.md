# Smart Routine Management System

An AI-powered web application designed to automate and streamline the creation of university class schedules. This system uses constraint satisfaction algorithms to generate conflict-free routines and provides a modern interface for students, faculty, and administrators.

## 🚀 Key Features

*   **Automated Scheduling (AI Core)**: Uses Python and Google OR-Tools to generate optimize schedules based on teacher availability, room capacity, and course requirements.
*   **Interactive Routine Views**:
    *   **Routine View**: A comprehensive calendar view of the schedule.
    *   **Week View**: A weekly overview for quick planning.
*   **Public Faculty Directory**:
    *   View all faculty members with search and filter options (Permanent, Guest, Adjunct).
    *   **Direct Contact**: One-click buttons for Phone Calls and WhatsApp messages.
*   **Admin Panel**:
    *   Manage Faculty, Courses, Rooms, and Batches.
    *   Add/Edit/Delete records with ease.
    *   Search and filter functionality.
*   **Smart Filtering**: Filter schedules by Floor, Room, Faculty, or Batch.

## 🛠️ Tech Stack

*   **Frontend**: React.js, Tailwind CSS, Vite, Lucide React (Icons), Framer Motion (Animations).
*   **Backend**: Node.js, Express.js.
*   **AI Engine**: Python, Google OR-Tools.
*   **Database**: JSON-based storage (Development phase), ready for Supabase migration.

## 📦 Installation & Setup

### Prerequisites
*   Node.js (v18+ recommended)
*   Python (v3.8+)

### 1. Clone the Repository
```bash
git clone <repository-url>
cd SmartRoutine
```

### 2. Backend (Server) Setup
Navigate to the server directory and install dependencies:
```bash
cd server
npm install
```

Start the server (runs on port 5000 by default):
```bash
npm run dev
```

### 3. Frontend (Client) Setup
Open a new terminal, navigate to the client directory:
```bash
cd client
npm install
```

Start the React development server:
```bash
npm run dev
```
The application will be available at `http://localhost:5173`.

### 4. AI Engine (Python) Setup
Ensure you have a virtual environment set up:
```bash
# Create virtual environment (if not exists)
python -m venv .venv

# Activate virtual environment
# Mac/Linux:
source .venv/bin/activate
# Windows:
.venv\Scripts\activate

# Install dependencies (if requirements.txt exists)
pip install -r requirements.txt
```

## 📂 Project Structure

```
SmartRoutine/
├── client/                 # React Frontend
│   ├── src/
│   │   ├── components/     # UI Components (AdminPanel, FacultyList, etc.)
│   │   ├── services/       # API integration
│   │   └── ...
│   └── ...
├── server/                 # Node.js Backend
│   ├── controllers/        # Request handlers
│   ├── repositories/       # Data access layer
│   ├── routes/             # API routes
│   └── data/               # JSON database file
└── ...
```

## 🤝 Contributing
Contributions are welcome! Please feel free to submit a Pull Request.
