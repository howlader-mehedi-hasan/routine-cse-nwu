import React, { useState, useEffect } from 'react';
import { getStudents, migrateSemesters } from '../services/api';
import { ArrowRight, GraduationCap, AlertTriangle, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

const upgradeMapping = {
    "1st Year 1st Sem": "1st Year 2nd Sem",
    "1st Year 2nd Sem": "2nd Year 1st Sem",
    "2nd Year 1st Sem": "2nd Year 2nd Sem",
    "2nd Year 2nd Sem": "3rd Year 1st Sem",
    "3rd Year 1st Sem": "3rd Year 2nd Sem",
    "3rd Year 2nd Sem": "4th Year 1st Sem",
    "4th Year 1st Sem": "4th Year 2nd Sem",
    "4th Year 2nd Sem": "Ex-Student"
};

const downgradeMapping = {
    "1st Year 2nd Sem": "1st Year 1st Sem",
    "2nd Year 1st Sem": "1st Year 2nd Sem",
    "2nd Year 2nd Sem": "2nd Year 1st Sem",
    "3rd Year 1st Sem": "2nd Year 2nd Sem",
    "3rd Year 2nd Sem": "3rd Year 1st Sem",
    "4th Year 1st Sem": "3rd Year 2nd Sem",
    "4th Year 2nd Sem": "4th Year 1st Sem",
    "Ex-Student": "4th Year 2nd Sem"
};

const SemesterMigration = () => {
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [previewMode, setPreviewMode] = useState(null); // null, 'upgrade', 'downgrade'

    useEffect(() => {
        fetchStudents();
    }, []);

    const fetchStudents = async () => {
        try {
            setLoading(true);
            const response = await getStudents();
            setStudents(response.data || []);
        } catch (error) {
            console.error("Error fetching students:", error);
            toast.error("Failed to load students.");
        } finally {
            setLoading(false);
        }
    };

    const handleMigration = async (action) => {
        if (!window.confirm(`Are you sure you want to perform a semester ${action} for ALL students? This action will modify their current semester.`)) {
            return;
        }

        setProcessing(true);
        const loadingToast = toast.loading(`Performing semester ${action}...`);
        
        try {
            const res = await migrateSemesters(action);
            toast.success(res.data?.message || `Semester ${action} completed successfully`, { id: loadingToast });
            setPreviewMode(null);
            await fetchStudents();
        } catch (error) {
            console.error(`Migration error (${action}):`, error);
            toast.error(error.response?.data?.message || `Failed to perform ${action}`, { id: loadingToast });
        } finally {
            setProcessing(false);
        }
    };

    const getPreviewBatch = (batch, action) => {
        if (!batch) return null;
        if (action === 'upgrade') return upgradeMapping[batch];
        if (action === 'downgrade') return downgradeMapping[batch];
        return null;
    };

    if (loading) {
        return <div className="text-center py-12 text-muted-foreground animate-pulse">Loading students data...</div>;
    }

    return (
        <div className="w-full space-y-8 animate-in fade-in duration-500 max-w-6xl mx-auto py-2">
            <div>
                <h2 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
                    <GraduationCap className="h-8 w-8 text-indigo-500" />
                    Semester Migration
                </h2>
                <p className="text-muted-foreground mt-2 max-w-3xl">
                    Bulk migrate all students to their next or previous semester. Use the buttons below to preview the changes before applying them to the database.
                </p>
            </div>

            <div className="bg-card rounded-2xl border border-border shadow-sm p-6 lg:p-8 space-y-6">
                <div className="flex flex-col sm:flex-row gap-4 items-center justify-between p-4 bg-muted/40 rounded-xl border border-indigo-100 dark:border-indigo-900/40">
                    <div className="flex items-center gap-3">
                        <AlertTriangle className="h-5 w-5 text-amber-500" />
                        <p className="text-sm font-medium text-foreground">
                            Ensure you have taken a database backup prior to performing bulk migrations.
                        </p>
                    </div>
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                        <button
                            onClick={() => setPreviewMode(previewMode === 'downgrade' ? null : 'downgrade')}
                            className={`flex flex-1 sm:flex-none items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                                previewMode === 'downgrade' 
                                ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400 ring-2 ring-amber-500'
                                : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                            }`}
                        >
                            <ArrowDownCircle className="h-4 w-4" /> Preview Downgrade
                        </button>
                        <button
                            onClick={() => setPreviewMode(previewMode === 'upgrade' ? null : 'upgrade')}
                            className={`flex flex-1 sm:flex-none items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                                previewMode === 'upgrade' 
                                ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-400 ring-2 ring-indigo-500'
                                : 'bg-primary text-primary-foreground hover:bg-primary/90'
                            }`}
                        >
                            <ArrowUpCircle className="h-4 w-4" /> Preview Upgrade
                        </button>
                    </div>
                </div>

                <AnimatePresence>
                    {previewMode && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="bg-background rounded-xl border border-dashed border-border overflow-hidden"
                        >
                            <div className="p-4 border-b border-border bg-muted/20 flex items-center justify-between">
                                <h3 className="font-semibold text-foreground flex items-center gap-2">
                                    <span className="relative flex h-3 w-3">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-500"></span>
                                    </span>
                                    Previewing {previewMode === 'upgrade' ? 'Upgrade' : 'Downgrade'} Changes
                                </h3>
                                <button
                                    onClick={() => handleMigration(previewMode)}
                                    disabled={processing}
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-lg text-sm font-bold shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Confirm & Execute {previewMode === 'upgrade' ? 'Upgrade' : 'Downgrade'}
                                </button>
                            </div>
                            <div className="max-h-[500px] overflow-y-auto w-full">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-muted text-muted-foreground sticky top-0 z-10 text-xs uppercase tracking-wider">
                                        <tr>
                                            <th className="px-6 py-4 font-semibold">Student Name / ID</th>
                                            <th className="px-6 py-4 font-semibold">Section</th>
                                            <th className="px-6 py-4 font-semibold">Current Semester</th>
                                            <th className="px-6 py-4 font-semibold">New Semester</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {students.map((student) => {
                                            const nextBatch = getPreviewBatch(student.batch, previewMode);
                                            const hasChange = nextBatch && nextBatch !== student.batch;
                                            
                                            return (
                                                <tr key={student.id} className="hover:bg-muted/30 transition-colors">
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="font-medium text-foreground">{student.name}</div>
                                                        <div className="text-xs text-muted-foreground">{student.student_id}</div>
                                                    </td>
                                                    <td className="px-6 py-4 font-medium">
                                                        <span className="px-2 py-1 bg-muted rounded-md text-xs">{student.section || 'N/A'}</span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="inline-flex items-center text-muted-foreground">
                                                            {student.batch || 'Unassigned'}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        {hasChange ? (
                                                            <div className="flex items-center gap-2 font-medium text-indigo-600 dark:text-indigo-400">
                                                                <ArrowRight className="h-4 w-4 text-muted-foreground opacity-50" />
                                                                {nextBatch}
                                                            </div>
                                                        ) : (
                                                            <div className="text-muted-foreground opacity-50 text-xs italic">
                                                                No transition
                                                            </div>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {!previewMode && (
                    <div className="text-center py-12 px-6 border-2 border-dashed border-border rounded-xl bg-muted/10">
                        <ArrowUpCircle className="h-10 w-10 text-muted-foreground opacity-30 mx-auto mb-3" />
                        <h3 className="text-sm font-semibold text-foreground">No Preview Selected</h3>
                        <p className="text-xs text-muted-foreground mt-1 mb-4">Click "Preview Upgrade" or "Preview Downgrade" to simulate the changes before finalizing.</p>
                        <p className="text-xs text-muted-foreground">Total records to process: <strong>{students.length} students</strong></p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SemesterMigration;
