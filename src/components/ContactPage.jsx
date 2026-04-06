import React, { useState } from 'react';
import FacultyList from './FacultyList';
import StudentList from './StudentList';
import { Users, GraduationCap } from 'lucide-react';

const ContactPage = () => {
    const [activeTab, setActiveTab] = useState('faculty');

    return (
        <div className="w-full flex-1 flex flex-col">
            {/* Minimal static tab bar at top */}
            <div className="w-full border-b bg-background sticky top-0 z-30 pt-4 px-6 md:px-12">
                <div className="flex gap-8">
                    <button
                        onClick={() => setActiveTab('faculty')}
                        className={`flex items-center gap-2 pb-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                            activeTab === 'faculty' 
                            ? 'border-indigo-600 text-indigo-600' 
                            : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                        }`}
                    >
                        <Users className="w-4 h-4" />
                        Faculty Directory
                    </button>
                    <button
                        onClick={() => setActiveTab('student')}
                        className={`flex items-center gap-2 pb-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                            activeTab === 'student' 
                            ? 'border-indigo-600 text-indigo-600' 
                            : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                        }`}
                    >
                        <GraduationCap className="w-4 h-4" />
                        Student Directory
                    </button>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 max-w-7xl mx-auto w-full px-4 md:px-6">
                {activeTab === 'faculty' && <FacultyList />}
                {activeTab === 'student' && <StudentList />}
            </div>
        </div>
    );
};

export default ContactPage;
