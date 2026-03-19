import React, { useState, useEffect } from 'react';
import { getAuditLogs } from '../services/api';
import { History, Search, Filter, Calendar, User, Activity, Edit2, X, Check, Trash2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import { Button } from './ui/Button';
import axios from 'axios';

const ActivityLogs = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [typeFilter, setTypeFilter] = useState('All');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const { user, token } = useAuth();
    const isSuperAdmin = user?.role === 'Super Admin';

    // Selection state
    const [selectedLogs, setSelectedLogs] = useState([]);

    // Editing states
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingLog, setEditingLog] = useState(null);
    const [editForm, setEditForm] = useState({
        timestamp: '',
        fullName: '',
        activityType: '',
        details: ''
    });

    useEffect(() => {
        fetchLogs();
    }, []);

    const fetchLogs = async () => {
        try {
            setLoading(true);
            const response = await getAuditLogs();
            setLogs(response.data);
            setLoading(false);
        } catch (error) {
            console.error("Error fetching logs:", error);
            setLoading(false);
        }
    };

    const handleEditClick = (log) => {
        setEditingLog(log);
        setEditForm({
            timestamp: log.timestamp,
            fullName: log.fullName,
            activityType: log.activityType,
            details: log.details
        });
        setIsEditModalOpen(true);
    };

    const handleUpdateLog = async (e) => {
        e.preventDefault();
        try {
            const baseURL = import.meta.env.VITE_API_URL || '/api';
            await axios.put(`${baseURL}/audit/${editingLog.id}`, editForm, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success("Log entry updated successfully");
            setIsEditModalOpen(false);
            fetchLogs();
        } catch (error) {
            console.error("Error updating log:", error);
            toast.error(error.response?.data?.message || "Failed to update log entry");
        }
    };

    const toggleSelectAll = () => {
        if (selectedLogs.length === filteredLogs.length) {
            setSelectedLogs([]);
        } else {
            setSelectedLogs(filteredLogs.map(log => log.id));
        }
    };

    const toggleSelectLog = (id) => {
        setSelectedLogs(prev =>
            prev.includes(id) ? prev.filter(logId => logId !== id) : [...prev, id]
        );
    };

    const handleDeleteSelected = async () => {
        if (!window.confirm(`Are you sure you want to delete ${selectedLogs.length} selected logs?`)) return;

        try {
            const baseURL = import.meta.env.VITE_API_URL || '/api';
            await axios.post(`${baseURL}/audit/delete-multiple`, { ids: selectedLogs }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success("Selected logs deleted successfully");
            setSelectedLogs([]);
            fetchLogs();
        } catch (error) {
            console.error("Error deleting logs:", error);
            toast.error(error.response?.data?.message || "Failed to delete selected logs");
        }
    };

    const activityTypes = ['All', ...new Set(logs.map(log => log.activityType))];

    const filteredLogs = logs.filter(log => {
        const matchesSearch =
            log.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            log.activityType?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            log.details?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesType = typeFilter === 'All' || log.activityType === typeFilter;

        return matchesSearch && matchesType;
    });

    // Pagination logic
    const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedLogs = filteredLogs.slice(startIndex, startIndex + itemsPerPage);

    // Reset to page 1 when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, typeFilter, itemsPerPage]);

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Sticky Header and Filters */}
            <div className="sticky top-[64px] z-20 bg-background/95 backdrop-blur-sm py-4 space-y-4 border-b">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Activity Logs</h1>
                        <p className="text-muted-foreground text-sm">Track all system activities and user actions.</p>
                    </div>
                    <div className="flex items-center gap-2 overflow-x-auto">
                        <button
                            onClick={fetchLogs}
                            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors whitespace-nowrap text-sm"
                        >
                            <Activity size={18} />
                            Refresh Logs
                        </button>
                        {isSuperAdmin && selectedLogs.length > 0 && (
                            <button
                                onClick={handleDeleteSelected}
                                className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors animate-in slide-in-from-right-4 whitespace-nowrap text-sm"
                            >
                                <Trash2 size={18} />
                                Delete ({selectedLogs.length})
                            </button>
                        )}
                    </div>
                </div>

                {/* Filters */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                        <input
                            type="text"
                            placeholder="Search logs..."
                            className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="relative">
                        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                        <select
                            className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 appearance-none text-sm"
                            value={typeFilter}
                            onChange={(e) => setTypeFilter(e.target.value)}
                        >
                            {activityTypes.map(type => (
                                <option key={type} value={type}>{type}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Summary & Pagination footer */}
            <div className="bg-card border border-border rounded-xl shadow-sm p-4 flex flex-col sm:flex-row items-center justify-between gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
                <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
                    <div className="text-sm text-muted-foreground whitespace-nowrap">
                        Showing <span className="font-medium text-foreground">{filteredLogs.length > 0 ? startIndex + 1 : 0}</span> to <span className="font-medium text-foreground">{Math.min(startIndex + itemsPerPage, filteredLogs.length)}</span> of <span className="font-medium text-foreground">{filteredLogs.length}</span> results
                    </div>

                    <div className="flex items-center gap-2 bg-background border border-border rounded-lg px-3 py-1.5 shadow-sm">
                        <span className="text-xs text-muted-foreground whitespace-nowrap font-medium">Per page:</span>
                        <select
                            className="bg-transparent text-sm focus:outline-none cursor-pointer font-semibold text-primary"
                            value={itemsPerPage}
                            onChange={(e) => setItemsPerPage(Number(e.target.value))}
                        >
                            {[10, 20, 50, 100].map(num => (
                                <option key={num} value={num}>{num}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {totalPages > 1 && (
                    <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto justify-center">
                        <button
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="px-3 py-1.5 rounded-md border border-border hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed text-sm transition-colors whitespace-nowrap shadow-sm"
                        >
                            Previous
                        </button>
                        <div className="flex items-center gap-1">
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => {
                                if (
                                    pageNum === 1 ||
                                    pageNum === totalPages ||
                                    (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                                ) {
                                    return (
                                        <button
                                            key={pageNum}
                                            onClick={() => setCurrentPage(pageNum)}
                                            className={`w-8 h-8 rounded-md text-sm transition-all focus:ring-2 focus:ring-primary/20 ${currentPage === pageNum
                                                ? 'bg-primary text-primary-foreground font-bold shadow-sm'
                                                : 'hover:bg-accent border border-transparent border-border/50'
                                                }`}
                                        >
                                            {pageNum}
                                        </button>
                                    );
                                } else if (
                                    pageNum === currentPage - 2 ||
                                    pageNum === currentPage + 2
                                ) {
                                    return <span key={pageNum} className="text-muted-foreground">...</span>;
                                }
                                return null;
                            })}
                        </div>
                        <button
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            className="px-3 py-1.5 rounded-md border border-border hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed text-sm transition-colors whitespace-nowrap shadow-sm"
                        >
                            Next
                        </button>
                    </div>
                )}
            </div>
            {/* Logs Table */}
            <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-muted/50 text-muted-foreground text-xs uppercase tracking-wider font-semibold border-b border-border">
                                {isSuperAdmin && (
                                    <th className="px-6 py-4 w-10">
                                        <input
                                            type="checkbox"
                                            className="rounded border-border"
                                            checked={filteredLogs.length > 0 && selectedLogs.length === filteredLogs.length}
                                            onChange={toggleSelectAll}
                                        />
                                    </th>
                                )}
                                <th className="px-6 py-4">Time</th>
                                <th className="px-6 py-4">User</th>
                                <th className="px-6 py-4">Activity</th>
                                <th className="px-6 py-4">Details</th>
                                {isSuperAdmin && <th className="px-6 py-4 text-right">Actions</th>}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {loading ? (
                                <tr>
                                    <td colSpan="4" className="px-6 py-12 text-center text-muted-foreground">
                                        <div className="flex flex-col items-center gap-2">
                                            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                                            Loading logs...
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredLogs.length === 0 ? (
                                <tr>
                                    <td colSpan="4" className="px-6 py-12 text-center text-muted-foreground">
                                        No activity logs found.
                                    </td>
                                </tr>
                            ) : (
                                paginatedLogs.map((log) => (
                                    <tr key={log.id} className={`hover:bg-accent/50 transition-colors ${selectedLogs.includes(log.id) ? 'bg-primary/5' : ''}`}>
                                        {isSuperAdmin && (
                                            <td className="px-6 py-4">
                                                <input
                                                    type="checkbox"
                                                    className="rounded border-border"
                                                    checked={selectedLogs.includes(log.id)}
                                                    onChange={() => toggleSelectLog(log.id)}
                                                />
                                            </td>
                                        )}
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <div className="flex items-center gap-2">
                                                <Calendar size={14} className="text-muted-foreground" />
                                                {new Date(log.timestamp).toLocaleString(undefined, {
                                                    year: 'numeric',
                                                    month: 'short',
                                                    day: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                    second: '2-digit'
                                                })}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            <div className="flex items-center gap-2">
                                                <User size={14} className="text-muted-foreground" />
                                                {log.fullName}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${log.activityType.includes('Delete') || log.activityType.includes('Clear')
                                                ? 'bg-red-500/10 text-red-500'
                                                : log.activityType.includes('Create') || log.activityType.includes('Add')
                                                    ? 'bg-green-500/10 text-green-500'
                                                    : log.activityType.includes('Update')
                                                        ? 'bg-blue-500/10 text-blue-500'
                                                        : 'bg-primary/10 text-primary'
                                                }`}>
                                                {log.activityType}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-muted-foreground max-w-md break-words">
                                            {log.details}
                                        </td>
                                        {isSuperAdmin && (
                                            <td className="px-6 py-4 text-right whitespace-nowrap">
                                                <button
                                                    onClick={() => handleEditClick(log)}
                                                    className="p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-md transition-colors"
                                                    title="Edit Log"
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                            </td>
                                        )}
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
                {/* Pagination Controls */}
                {(totalPages > 1 || filteredLogs.length > 0) && (
                    <div className="px-6 py-4 border-t border-border flex flex-col sm:flex-row items-center justify-between bg-muted/20 gap-4">
                        <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
                            <div className="text-sm text-muted-foreground whitespace-nowrap">
                                Showing <span className="font-medium text-foreground">{filteredLogs.length > 0 ? startIndex + 1 : 0}</span> to <span className="font-medium text-foreground">{Math.min(startIndex + itemsPerPage, filteredLogs.length)}</span> of <span className="font-medium text-foreground">{filteredLogs.length}</span> results
                            </div>

                            <div className="flex items-center gap-2 bg-background border border-border rounded-lg px-3 py-1.5 shadow-sm">
                                <span className="text-xs text-muted-foreground whitespace-nowrap font-medium">Per page:</span>
                                <select
                                    className="bg-transparent text-sm focus:outline-none cursor-pointer font-semibold text-primary"
                                    value={itemsPerPage}
                                    onChange={(e) => setItemsPerPage(Number(e.target.value))}
                                >
                                    {[10, 20, 50, 100].map(num => (
                                        <option key={num} value={num}>{num}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {totalPages > 1 && (
                            <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto justify-center">
                                <button
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                    className="px-3 py-1.5 rounded-md border border-border hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed text-sm transition-colors whitespace-nowrap"
                                >
                                    Previous
                                </button>
                                <div className="flex items-center gap-1">
                                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => {
                                        if (
                                            pageNum === 1 ||
                                            pageNum === totalPages ||
                                            (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                                        ) {
                                            return (
                                                <button
                                                    key={pageNum}
                                                    onClick={() => setCurrentPage(pageNum)}
                                                    className={`w-8 h-8 rounded-md text-sm transition-all focus:ring-2 focus:ring-primary/20 ${currentPage === pageNum
                                                        ? 'bg-primary text-primary-foreground font-bold shadow-sm'
                                                        : 'hover:bg-accent border border-transparent border-border/50'
                                                        }`}
                                                >
                                                    {pageNum}
                                                </button>
                                            );
                                        } else if (
                                            pageNum === currentPage - 2 ||
                                            pageNum === currentPage + 2
                                        ) {
                                            return <span key={pageNum} className="text-muted-foreground">...</span>;
                                        }
                                        return null;
                                    })}
                                </div>
                                <button
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages}
                                    className="px-3 py-1.5 rounded-md border border-border hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed text-sm transition-colors whitespace-nowrap"
                                >
                                    Next
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Edit Modal */}
            {isEditModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-card w-full max-w-md rounded-xl shadow-xl border border-border overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between p-4 border-b border-border bg-muted/30">
                            <h2 className="text-lg font-semibold flex items-center gap-2">
                                <Edit2 size={18} className="text-primary" />
                                Edit Log Entry
                            </h2>
                            <button onClick={() => setIsEditModalOpen(false)} className="text-muted-foreground hover:text-foreground">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleUpdateLog} className="p-4 space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1.5">Timestamp</label>
                                <input
                                    type="text"
                                    value={editForm.timestamp}
                                    onChange={(e) => setEditForm({ ...editForm, timestamp: e.target.value })}
                                    className="w-full p-2.5 rounded-lg border border-input bg-background text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                                />
                                <p className="text-[10px] text-muted-foreground mt-1">ISO Format (e.g., 2026-03-16T01:36:21.000Z)</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1.5">User Full Name</label>
                                <input
                                    type="text"
                                    value={editForm.fullName}
                                    onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                                    className="w-full p-2.5 rounded-lg border border-input bg-background text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1.5">Activity Type</label>
                                <input
                                    type="text"
                                    value={editForm.activityType}
                                    onChange={(e) => setEditForm({ ...editForm, activityType: e.target.value })}
                                    className="w-full p-2.5 rounded-lg border border-input bg-background text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1.5">Details</label>
                                <textarea
                                    value={editForm.details}
                                    onChange={(e) => setEditForm({ ...editForm, details: e.target.value })}
                                    rows={4}
                                    className="w-full p-2.5 rounded-lg border border-input bg-background text-sm focus:ring-2 focus:ring-primary/20 outline-none resize-none"
                                />
                            </div>

                            <div className="flex justify-end gap-3 pt-2">
                                <Button type="button" variant="ghost" onClick={() => setIsEditModalOpen(false)}>
                                    Cancel
                                </Button>
                                <Button type="submit" className="flex items-center gap-2">
                                    <Check size={16} />
                                    Save Changes
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ActivityLogs;
