import React, { useState, useEffect } from 'react';
import { getStudents, deleteStudent } from '../services/api';
import { Search, Phone, MessageCircle, User, Edit2, Trash2, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import EditContactModal from './modals/EditContactModal';

const StudentList = () => {
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    
    // Filters
    const [showStudent, setShowStudent] = useState(true);
    const [showCR, setShowCR] = useState(true);
    const [batchFilter, setBatchFilter] = useState('');
    const [sectionFilter, setSectionFilter] = useState('');
    const { user, hasPermission } = useAuth();
    const [editingStudent, setEditingStudent] = useState(null);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const isAdmin = user?.role === 'Admin' || user?.role === 'Super Admin';
    const isCR = user?.role === 'CR/ACR';

    useEffect(() => {
        fetchStudents();
    }, []);

    const fetchStudents = async () => {
        try {
            const response = await getStudents();
            setStudents(response.data || []);
        } catch (error) {
            console.error("Error fetching students:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (student) => {
        if (!window.confirm(`Are you sure you want to delete student "${student.name}"?`)) return;
        try {
            await deleteStudent(student.id);
            toast.success('Student deleted successfully');
            fetchStudents();
        } catch (error) {
            console.error("Delete error:", error);
            toast.error(error.response?.data?.message || 'Failed to delete student');
        }
    };

    const getUniqueBatches = () => {
        const batches = students.map(s => s.batch).filter(Boolean);
        return [...new Set(batches)].sort();
    };

    const getUniqueSections = () => {
        const sections = students.map(s => s.section).filter(Boolean);
        return [...new Set(sections)].sort();
    };

    const filteredStudents = students.filter(s => {
        // Role Filter
        if (s.account_type === 'Student' && !showStudent) return false;
        if (s.account_type === 'CR/ACR' && !showCR) return false;

        // Batch & Section Filters
        if (batchFilter && s.batch !== batchFilter) return false;
        if (sectionFilter && s.section !== sectionFilter) return false;

        // Text Search
        const searchLower = searchQuery.toLowerCase();
        return (
            (s.name && s.name.toLowerCase().includes(searchLower)) ||
            (s.student_id && s.student_id.toLowerCase().includes(searchLower)) ||
            (s.email && s.email.toLowerCase().includes(searchLower))
        );
    });

    const formatWhatsAppLink = (phone) => {
        if (!phone) return '#';
        const cleanNumber = phone.replace(/\D/g, '');
        return `https://wa.me/${cleanNumber}`;
    };

    return (
        <div className="w-full space-y-8 animate-in fade-in duration-500 py-4">
            {/* Search and Filters */}
            <div className="sticky top-[130px] z-20 bg-background/95 backdrop-blur-sm py-4 space-y-4 border-b">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight text-foreground">Student Contacts</h2>
                        <p className="text-muted-foreground mt-1 text-sm">Contact list of students and CR/ACRs.</p>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
                        <div className="relative w-full md:w-72">
                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                            <input
                                type="text"
                                placeholder="Search by name, ID, or email..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9 pr-4 py-2 w-full text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow"
                            />
                        </div>
                        {(isAdmin || isCR) && (
                            <button
                                onClick={() => setIsAddModalOpen(true)}
                                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-sm"
                            >
                                <Plus className="w-4 h-4" /> Add Student
                            </button>
                        )}
                    </div>
                </div>

                {/* Filters */}
                <div className="flex flex-wrap items-center gap-6">
                    <div className="flex gap-4">
                        <label className="flex items-center gap-2 text-sm font-medium cursor-pointer select-none">
                            <input
                                type="checkbox"
                                checked={showStudent}
                                onChange={(e) => setShowStudent(e.target.checked)}
                                className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                            />
                            Student
                        </label>
                        <label className="flex items-center gap-2 text-sm font-medium cursor-pointer select-none">
                            <input
                                type="checkbox"
                                checked={showCR}
                                onChange={(e) => setShowCR(e.target.checked)}
                                className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                            />
                            CR/ACR
                        </label>
                    </div>

                    <div className="flex gap-4 items-center">
                        <select
                            className="text-sm bg-background border border-border rounded-md px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            value={batchFilter}
                            onChange={(e) => setBatchFilter(e.target.value)}
                        >
                            <option value="">All Batches</option>
                            {getUniqueBatches().map(b => <option key={b} value={b}>{b}</option>)}
                        </select>

                        <select
                            className="text-sm bg-background border border-border rounded-md px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            value={sectionFilter}
                            onChange={(e) => setSectionFilter(e.target.value)}
                        >
                            <option value="">All Sections</option>
                            {getUniqueSections().map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="text-center py-12 text-muted-foreground">Loading student directory...</div>
            ) : filteredStudents.length === 0 ? (
                <div className="text-center py-12 bg-muted/30 rounded-xl border border-dashed border-border text-muted-foreground">
                    No students found matching your criteria.
                </div>
            ) : (
                <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    <AnimatePresence>
                        {filteredStudents.map((item) => (
                            <motion.div
                                key={item.id}
                                layout
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="bg-card rounded-xl border border-border shadow-sm overflow-hidden hover:shadow-md transition-shadow group flex flex-col"
                            >
                                <div className="p-6 flex-1">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex gap-3">
                                            <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-full">
                                                <User className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                                            </div>
                                            {(isAdmin || (isCR && user.section === item.section)) && (
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => setEditingStudent(item)}
                                                        className="p-2 h-fit bg-muted hover:bg-indigo-100 dark:hover:bg-indigo-900/40 text-muted-foreground hover:text-indigo-600 transition-colors rounded-lg"
                                                        title="Edit Student"
                                                    >
                                                        <Edit2 className="w-4 h-4" />
                                                    </button>
                                                    {isAdmin && (
                                                        <button
                                                            onClick={() => handleDelete(item)}
                                                            className="p-2 h-fit bg-muted hover:bg-red-100 dark:hover:bg-red-900/40 text-muted-foreground hover:text-red-600 transition-colors rounded-lg"
                                                            title="Delete Student"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                        <span className="text-xs font-medium px-2 py-1 rounded bg-muted text-muted-foreground">
                                            {item.account_type}
                                        </span>
                                    </div>

                                    <h3 className="font-bold text-lg text-foreground mb-1">{item.name || 'Unknown Name'}</h3>
                                    <p className="text-indigo-600 dark:text-indigo-400 font-medium text-sm mb-2">ID: {item.student_id}</p>
                                    
                                    <div className="flex gap-2">
                                        {item.batch && <p className="text-xs px-2 py-1 bg-muted rounded-md text-foreground">{item.batch}</p>}
                                        {item.section && <p className="text-xs px-2 py-1 bg-muted rounded-md text-foreground">Sec: {item.section}</p>}
                                    </div>
                                    
                                    <p className="text-xs text-muted-foreground truncate mt-3" title={item.email}>{item.email || 'No email provided'}</p>
                                </div>

                                <div className="p-4 bg-muted/30 border-t border-border mt-auto grid grid-cols-2 gap-3">
                                    <a
                                        href={item.phone ? `tel:${item.phone}` : '#'}
                                        className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${item.phone
                                            ? "bg-green-600 hover:bg-green-700 text-white shadow-sm"
                                            : "bg-muted text-muted-foreground cursor-not-allowed opacity-50"
                                            }`}
                                        onClick={e => !item.phone && e.preventDefault()}
                                        title={item.phone ? "Call Student" : "Phone number not available"}
                                    >
                                        <Phone className="w-4 h-4" />
                                        <span>Call</span>
                                    </a>

                                    <a
                                        href={item.phone ? formatWhatsAppLink(item.phone) : '#'}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${item.phone
                                            ? "bg-[#25D366] hover:bg-[#20bd5a] text-white shadow-sm"
                                            : "bg-muted text-muted-foreground cursor-not-allowed opacity-50"
                                            }`}
                                        onClick={e => !item.phone && e.preventDefault()}
                                        title={item.phone ? "WhatsApp Message" : "Phone number not available"}
                                    >
                                        <MessageCircle className="w-4 h-4" />
                                        <span>WhatsApp</span>
                                    </a>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}

            <EditContactModal 
                isOpen={!!editingStudent} 
                onClose={() => setEditingStudent(null)} 
                data={editingStudent} 
                type="student" 
                onUpdate={fetchStudents} 
            />

            <EditContactModal 
                isOpen={isAddModalOpen} 
                onClose={() => setIsAddModalOpen(false)} 
                data={null} 
                type="student" 
                onUpdate={fetchStudents} 
            />
        </div>
    );
};

export default StudentList;
