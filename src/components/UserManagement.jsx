import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import { Check, X, Shield, Clock, Plus, Edit, Key, Eye, EyeOff, Trash2, Users, Search } from 'lucide-react';

export default function UserManagement() {
    const { api, user: currentUser } = useAuth();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [selectedUserIds, setSelectedUserIds] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [roleFilter, setRoleFilter] = useState('All');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    const [formData, setFormData] = useState({
        username: '', email: '', password: '', role: 'Student', status: 'approved', fullName: '', mobileNumber: '', permissions: [], section: '', facultyId: ''
    });
    const [passwordData, setPasswordData] = useState({ password: '' });
    const [showPassword, setShowPassword] = useState(false);
    const [facultySearch, setFacultySearch] = useState('');

    const allRoles = ['Super Admin', 'Admin', 'Moderator', 'Editor', 'Department Head', 'Faculty', 'Student', 'CR/ACR'];
    const roles = currentUser?.role === 'Super Admin' ? allRoles : allRoles.filter(r => r !== 'Super Admin');
    const [batches, setBatches] = useState([]);
    const [faculties, setFaculties] = useState([]);

    const loadUsersAndBatches = async () => {
        try {
            const [usersRes, batchesRes, facultiesRes] = await Promise.all([
                api.get('/auth/users'),
                api.get('/batches'),
                api.get('/faculty')
            ]);
            setUsers(usersRes.data);
            setBatches(batchesRes.data);
            setFaculties(facultiesRes.data);
            setLoading(false);
        } catch (error) {
            toast.error('Failed to load data');
            setLoading(false);
        }
    };

    useEffect(() => {
        loadUsersAndBatches();
    }, []);

    const sortedFaculties = React.useMemo(() => {
        return [...faculties].sort((a, b) => a.name.localeCompare(b.name));
    }, [faculties]);

    const sortedBatches = React.useMemo(() => {
        return [...batches].sort((a, b) => {
            const getScore = (name) => {
                const yearMatch = name.match(/(\d+)/);
                const semMatch = name.match(/(\d+)(?:st|nd|rd|th) Sem/);
                const year = yearMatch ? parseInt(yearMatch[1]) : 0;
                const sem = semMatch ? parseInt(semMatch[1] || (name.includes('1st') ? 1 : name.includes('2nd') ? 2 : 0)) : 0;
                return year * 10 + sem;
            };
            const scoreA = getScore(a.name);
            const scoreB = getScore(b.name);
            if (scoreA !== scoreB) return scoreA - scoreB;
            return (a.section || '').localeCompare(b.section || '');
        });
    }, [batches]);

    const filteredFaculties = React.useMemo(() => {
        return sortedFaculties.filter(f => 
            f.name.toLowerCase().includes(facultySearch.toLowerCase()) || 
            f.initials.toLowerCase().includes(facultySearch.toLowerCase())
        );
    }, [sortedFaculties, facultySearch]);

    const updateStatus = async (userId, status, role = null) => {
        try {
            const updates = { status };
            if (role) updates.role = role;

            await api.put(`/auth/users/${userId}/status`, updates);
            toast.success(`User ${status} successfully`);
            loadUsersAndBatches();
        } catch (error) {
            toast.error('Failed to update user status');
        }
    };

    const handleCreateUser = async (e) => {
        e.preventDefault();
        try {
            await api.post('/auth/users', formData);
            toast.success('User created successfully');
            setIsCreateModalOpen(false);
            setFormData({ username: '', email: '', password: '', role: 'Student', status: 'approved', fullName: '', mobileNumber: '', permissions: [], section: '', facultyId: '' });
            loadUsersAndBatches();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to create user');
        }
    };

    const handleResolveNameChange = async (userId, action) => {
        try {
            await api.post(`/auth/users/${userId}/name-change-resolve`, { action });
            toast.success(`Name change ${action}d successfully`);
            loadUsersAndBatches();
        } catch (error) {
            toast.error(error.response?.data?.message || `Failed to ${action} name change`);
        }
    };

    const handleUpdateUser = async (e) => {
        e.preventDefault();
        try {
            await api.put(`/auth/users/${selectedUser.id}`, {
                username: formData.username,
                email: formData.email,
                role: formData.role,
                status: formData.status,
                fullName: formData.fullName,
                mobileNumber: formData.mobileNumber,
                permissions: formData.permissions,
                section: formData.section,
                facultyId: formData.facultyId
            });
            toast.success('User updated successfully');
            setIsEditModalOpen(false);
            setSelectedUser(null);
            loadUsersAndBatches();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to update user');
        }
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();
        try {
            await api.put(`/auth/users/${selectedUser.id}/password`, passwordData);
            toast.success('Password changed successfully');
            setIsPasswordModalOpen(false);
            setPasswordData({ password: '' });
            setSelectedUser(null);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to change password');
        }
    };

    const handleDeleteUser = async (userId, username) => {
        if (!window.confirm(`Are you sure you want to delete user "${username}"? This action cannot be undone.`)) return;
        try {
            await api.delete(`/auth/users/${userId}`);
            toast.success('User deleted successfully');
            loadUsersAndBatches();
            // Remove from selection if it was selected
            setSelectedUserIds(prev => prev.filter(id => id !== userId));
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to delete user');
        }
    };

    const handleBulkDelete = async () => {
        if (!window.confirm(`Are you sure you want to delete ${selectedUserIds.length} selected users? This action cannot be undone.`)) return;
        try {
            await api.post('/auth/users/bulk-delete', { ids: selectedUserIds });
            toast.success(`${selectedUserIds.length} users deleted successfully`);
            setSelectedUserIds([]);
            loadUsersAndBatches();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to delete users');
        }
    };

    const toggleUserSelection = (userId) => {
        setSelectedUserIds(prev =>
            prev.includes(userId)
                ? prev.filter(id => id !== userId)
                : [...prev, userId]
        );
    };

    const toggleSelectAll = (usersToSelect) => {
        if (selectedUserIds.length === usersToSelect.length) {
            setSelectedUserIds([]);
        } else {
            setSelectedUserIds(usersToSelect.map(u => u.id));
        }
    };

    const openEditModal = (user) => {
        setSelectedUser(user);
        setFacultySearch('');
        setFormData({ 
            username: user.username, 
            email: user.email, 
            role: user.role, 
            status: user.status, 
            fullName: user.fullName || '', 
            mobileNumber: user.mobileNumber || '', 
            permissions: user.permissions || [], 
            section: user.section || (batches.length > 0 ? batches[0].id.toString() : ''),
            facultyId: user.facultyId || ''
        });
        setIsEditModalOpen(true);
    };

    const openPasswordModal = (user) => {
        setSelectedUser(user);
        setPasswordData({ password: '' });
        setShowPassword(false);
        setIsPasswordModalOpen(true);
    };

    const approvedUsers = users.filter(u => {
        const matchesStatus = u.status !== 'pending';
        const matchesRole = roleFilter === 'All' || u.role === roleFilter;
        const matchesSearch = (
            u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (u.fullName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (u.email || '').toLowerCase().includes(searchQuery.toLowerCase())
        );
        return matchesStatus && matchesRole && matchesSearch;
    });

    // Pagination logic
    const totalPages = Math.ceil(approvedUsers.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedUsers = approvedUsers.slice(startIndex, startIndex + itemsPerPage);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, roleFilter, itemsPerPage]);

    if (loading) return <div>Loading users...</div>;

    const pendingUsers = users.filter(u => u.status === 'pending');
    const pendingNameChanges = users.filter(u => u.pendingFullName);

    return (
        <div className="space-y-8 p-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-bold mb-2 flex items-center gap-2 text-indigo-600">
                        <Shield className="h-8 w-8" /> User Approvals
                    </h2>
                    <p className="text-muted-foreground">Manage registration requests, users, and permissions.</p>
                </div>
                <button
                    onClick={() => {
                        setFacultySearch('');
                        setFormData({ username: '', email: '', password: '', role: 'Student', status: 'approved', fullName: '', mobileNumber: '', permissions: [], section: batches.length > 0 ? batches[0].id.toString() : '', facultyId: '' });
                        setIsCreateModalOpen(true);
                    }}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
                >
                    <Plus className="w-4 h-4" /> Create User
                </button>
            </div>

            {/* Pending Requests */}
            <div className="bg-card rounded-lg border shadow-sm p-4">
                <h3 className="text-xl font-semibold mb-4 flex items-center gap-2 border-b pb-2">
                    <Clock className="h-5 w-5 text-amber-500" /> Pending Approval ({pendingUsers.length})
                </h3>
                {pendingUsers.length === 0 ? (
                    <p className="text-muted-foreground p-4">No pending requests.</p>
                ) : (
                    <div className="divide-y border rounded-lg">
                        {pendingUsers.map(user => (
                            <div key={user.id} className="flex flex-col md:flex-row items-center justify-between p-4 bg-amber-50/50 dark:bg-amber-900/10">
                                <div className="mb-4 md:mb-0 space-y-1">
                                    <div className="font-bold text-lg">{user.username}</div>
                                    <div className="text-sm text-foreground font-medium">{user.fullName || 'N/A'} - {user.mobileNumber || 'N/A'}</div>
                                    <div className="text-sm text-muted-foreground">{user.email}</div>
                                    <div className="flex flex-wrap gap-2 mt-2">
                                        <span className="px-2 py-0.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 rounded text-xs font-bold uppercase tracking-wider">
                                            {user.role}
                                        </span>
                                        {user.role === 'Faculty' && user.facultyId && (
                                            <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded text-xs font-medium">
                                                Faculty: {faculties.find(f => f.id.toString() === user.facultyId.toString())?.name || 'Unknown'}
                                            </span>
                                        )}
                                        {['Student', 'CR/ACR'].includes(user.role) && user.section && (
                                            <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded text-xs font-medium">
                                                Section: {batches.find(b => b.id.toString() === user.section.toString())?.name || 'Unknown'}
                                            </span>
                                        )}
                                    </div>
                                    {currentUser?.role === 'Super Admin' && (
                                        <div className="text-xs mt-1 text-muted-foreground">
                                            Password: <span className="font-mono bg-muted px-1.5 py-0.5 rounded select-all text-foreground">{user.plainPassword || '***'}</span>
                                        </div>
                                    )}
                                </div>
                                <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
                                    <div className="flex flex-col text-sm w-full md:w-48">
                                        <span className="text-muted-foreground text-xs mb-1">Requested Role:</span>
                                        <select
                                            className="px-2 py-1 border rounded bg-background disabled:opacity-70 disabled:cursor-not-allowed"
                                            value={user.role}
                                            onChange={(e) => updateStatus(user.id, 'pending', e.target.value)}
                                            disabled={currentUser?.role !== 'Super Admin'}
                                        >
                                            {roles.map(r => <option key={r} value={r}>{r}</option>)}
                                        </select>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => updateStatus(user.id, 'approved')}
                                            className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded text-sm transition"
                                        >
                                            <Check className="h-4 w-4" /> Approve
                                        </button>
                                        <button
                                            onClick={() => updateStatus(user.id, 'rejected')}
                                            className="flex items-center gap-1 bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded text-sm transition"
                                        >
                                            <X className="h-4 w-4" /> Reject
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Pending Name Change Requests */}
            {pendingNameChanges.length > 0 && (
                <div className="bg-card rounded-lg border shadow-sm p-4 mt-8">
                    <h3 className="text-xl font-semibold mb-4 flex items-center gap-2 border-b pb-2">
                        <Edit className="h-5 w-5 text-pink-500" /> Pending Name Changes ({pendingNameChanges.length})
                    </h3>
                    <div className="divide-y border rounded-lg">
                        {pendingNameChanges.map(user => (
                            <div key={`name-change-${user.id}`} className="flex flex-col md:flex-row items-center justify-between p-4 bg-pink-50/50 dark:bg-pink-900/10">
                                <div className="mb-4 md:mb-0 space-y-1">
                                    <div className="font-bold text-lg">{user.username}</div>
                                    <div className="text-sm">
                                        <span className="text-muted-foreground mr-2">Current:</span>
                                        <span className="line-through text-red-400">{user.fullName || '(Not Set)'}</span>
                                    </div>
                                    <div className="text-sm font-medium">
                                        <span className="text-muted-foreground mr-2">Requested:</span>
                                        <span className="text-emerald-500">{user.pendingFullName}</span>
                                    </div>
                                </div>
                                <div className="flex gap-2 w-full md:w-auto mt-2 md:mt-0">
                                    <button
                                        onClick={() => handleResolveNameChange(user.id, 'approve')}
                                        className="flex-1 md:flex-none flex items-center justify-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded text-sm transition"
                                    >
                                        <Check className="h-4 w-4" /> Approve
                                    </button>
                                    <button
                                        onClick={() => handleResolveNameChange(user.id, 'reject')}
                                        className="flex-1 md:flex-none flex items-center justify-center gap-1 bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded text-sm transition"
                                    >
                                        <X className="h-4 w-4" /> Reject
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Active Users */}
            {/* Active Users Table Section */}
            <div className="bg-card rounded-lg border shadow-sm mt-8 overflow-hidden">
                <div className="sticky top-[0px] md:top-[0px] z-30 bg-background/95 backdrop-blur-md px-4 py-3 border-b flex flex-col md:flex-row justify-between items-center gap-4 shadow-sm md:h-20">
                    <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
                        <h3 className="text-xl font-semibold whitespace-nowrap text-foreground">Active Users</h3>

                        {/* Search Input */}
                        <div className="relative flex-grow md:flex-grow-0 md:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                            <input
                                type="text"
                                placeholder="Search users/email..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9 pr-4 py-2 w-full text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all placeholder:text-muted-foreground"
                            />
                        </div>

                        {/* Role Filter */}
                        <div className="relative flex-grow md:flex-grow-0 md:w-48">
                            <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                            <select
                                value={roleFilter}
                                onChange={(e) => setRoleFilter(e.target.value)}
                                className="pl-9 pr-4 py-2 w-full text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 appearance-none cursor-pointer font-medium"
                            >
                                <option value="All">All Roles</option>
                                {allRoles.map(role => (
                                    <option key={role} value={role}>{role}</option>
                                ))}
                            </select>
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 w-full md:w-auto justify-end">
                        {selectedUserIds.length > 0 && (
                            <div className="flex items-center gap-3 animate-in fade-in zoom-in duration-200">
                                <span className="text-sm font-semibold text-indigo-600 bg-indigo-50 dark:bg-indigo-950/30 px-3 py-1 rounded-full border border-indigo-100 dark:border-indigo-900/50">
                                    {selectedUserIds.length} Selected
                                </span>
                                <button
                                    onClick={handleBulkDelete}
                                    className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-1.5 rounded-lg text-sm font-bold transition-all shadow-md hover:scale-105 active:scale-95"
                                >
                                    <Trash2 className="w-4 h-4" /> Delete
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Summary & Pagination footer */}
                <div className="px-6 py-4 border-t border-border flex flex-col sm:flex-row items-center justify-between bg-muted/20 gap-4">
                    <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
                        <div className="text-sm text-muted-foreground whitespace-nowrap">
                            Showing <span className="font-medium text-foreground">{approvedUsers.length > 0 ? startIndex + 1 : 0}</span> to <span className="font-medium text-foreground">{Math.min(startIndex + itemsPerPage, approvedUsers.length)}</span> of <span className="font-medium text-foreground">{approvedUsers.length}</span> users
                        </div>

                        <div className="flex items-center gap-2 bg-background border border-border rounded-lg px-3 py-1.5 shadow-sm">
                            <span className="text-xs text-muted-foreground whitespace-nowrap">Per page:</span>
                            <select
                                className="bg-transparent text-sm focus:outline-none cursor-pointer font-medium"
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
                                                className={`w-8 h-8 rounded-md text-sm transition-all focus:ring-2 focus:ring-indigo-500 ${currentPage === pageNum
                                                    ? 'bg-indigo-600 text-white font-bold shadow-sm'
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
                                        return <span key={pageNum} className="px-1 text-muted-foreground">...</span>;
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

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-muted text-muted-foreground text-[11px] uppercase tracking-wider font-bold">
                            <tr className="h-12">
                                <th className="px-4 py-2 border-b w-10 sticky top-0 z-10 bg-muted">
                                    <input
                                        type="checkbox"
                                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-600 h-4 w-4 transition-all"
                                        checked={approvedUsers.length > 0 && selectedUserIds.length === approvedUsers.filter(u => u.role !== 'Super Admin').length}
                                        onChange={() => toggleSelectAll(approvedUsers.filter(u => u.role !== 'Super Admin'))}
                                    />
                                </th>
                                <th className="px-4 py-2 border-b sticky top-0 z-10 bg-muted whitespace-nowrap">Username / Name</th>
                                <th className="px-4 py-2 border-b sticky top-0 z-10 bg-muted whitespace-nowrap">Contact</th>
                                <th className="px-4 py-2 border-b sticky top-0 z-10 bg-muted whitespace-nowrap">Status</th>
                                <th className="px-4 py-2 border-b sticky top-0 z-10 bg-muted whitespace-nowrap">Role</th>
                                {currentUser?.role === 'Super Admin' && (
                                    <th className="px-4 py-2 border-b sticky top-0 z-10 bg-muted whitespace-nowrap">Password</th>
                                )}
                                <th className="px-4 py-2 border-b sticky top-0 z-10 bg-muted text-right whitespace-nowrap">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {paginatedUsers.map(user => (
                                <tr key={user.id} className={`hover:bg-muted/30 transition-colors ${selectedUserIds.includes(user.id) ? 'bg-indigo-50/50 dark:bg-indigo-900/10' : ''}`}>
                                    <td className="px-4 py-3">
                                        {user.role !== 'Super Admin' && (
                                            <input
                                                type="checkbox"
                                                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-600 h-4 w-4 transition-all"
                                                checked={selectedUserIds.includes(user.id)}
                                                onChange={() => toggleUserSelection(user.id)}
                                            />
                                        )}
                                    </td>
                                    <td className="px-4 py-3 font-medium">
                                        <div>{user.username}</div>
                                        <div className="text-xs text-muted-foreground mt-0.5">{user.fullName}</div>
                                        {['Student', 'CR/ACR'].includes(user.role) && user.section && (
                                            <div className="text-xs text-indigo-500 mt-0.5">Section: {batches.find(b => b.id.toString() === user.section)?.name || 'Unknown'}</div>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-muted-foreground">
                                        <div>{user.email}</div>
                                        <div className="text-xs mt-0.5">{user.mobileNumber}</div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`px-2 py-1 rounded text-xs font-bold ${user.status === 'approved' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                                            {user.status.toUpperCase()}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 font-medium text-indigo-600 dark:text-indigo-400">
                                        {user.role}
                                    </td>
                                    {currentUser?.role === 'Super Admin' && (
                                        <td className="px-4 py-3">
                                            <span className="font-mono bg-muted px-2 py-1 rounded text-xs select-all">
                                                {user.plainPassword || '***'}
                                            </span>
                                        </td>
                                    )}
                                    <td className="px-4 py-3 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button
                                                onClick={() => openEditModal(user)}
                                                className="p-1.5 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded transition-colors"
                                                title="Edit User"
                                            >
                                                <Edit className="w-4 h-4" />
                                            </button>
                                            {currentUser?.role === 'Super Admin' && (
                                                <button
                                                    onClick={() => openPasswordModal(user)}
                                                    className="p-1.5 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/30 rounded transition-colors"
                                                    title="Change Password"
                                                >
                                                    <Key className="w-4 h-4" />
                                                </button>
                                            )}
                                            {user.role !== 'Super Admin' && (
                                                <button
                                                    onClick={() => handleDeleteUser(user.id, user.username)}
                                                    className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition-colors"
                                                    title="Delete User"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Summary & Pagination footer */}
                <div className="px-6 py-4 border-t border-border flex flex-col sm:flex-row items-center justify-between bg-muted/20 gap-4">
                    <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
                        <div className="text-sm text-muted-foreground whitespace-nowrap">
                            Showing <span className="font-medium text-foreground">{approvedUsers.length > 0 ? startIndex + 1 : 0}</span> to <span className="font-medium text-foreground">{Math.min(startIndex + itemsPerPage, approvedUsers.length)}</span> of <span className="font-medium text-foreground">{approvedUsers.length}</span> users
                        </div>

                        <div className="flex items-center gap-2 bg-background border border-border rounded-lg px-3 py-1.5 shadow-sm">
                            <span className="text-xs text-muted-foreground whitespace-nowrap">Per page:</span>
                            <select
                                className="bg-transparent text-sm focus:outline-none cursor-pointer font-medium"
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
                                                className={`w-8 h-8 rounded-md text-sm transition-all focus:ring-2 focus:ring-indigo-500 ${currentPage === pageNum
                                                    ? 'bg-indigo-600 text-white font-bold shadow-sm'
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
                                        return <span key={pageNum} className="px-1 text-muted-foreground">...</span>;
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
            </div>

            {/* Create User Modal */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-in fade-in">
                    <div className="bg-card w-full max-w-md rounded-xl shadow-xl overflow-hidden animate-in slide-in-from-bottom-4">
                        <div className="px-6 py-4 border-b flex justify-between items-center bg-muted/30">
                            <h3 className="text-lg font-semibold">Create New User</h3>
                            <button onClick={() => setIsCreateModalOpen(false)} className="text-muted-foreground hover:text-foreground">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleCreateUser}>
                            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Username</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full px-3 py-2 border rounded-lg bg-background"
                                        value={formData.username}
                                        onChange={e => setFormData({ ...formData, username: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Email <span className="text-xs text-muted-foreground font-normal">(Optional)</span></label>
                                    <input
                                        type="email"
                                        className="w-full px-3 py-2 border rounded-lg bg-background"
                                        value={formData.email}
                                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Full Name <span className="text-xs text-muted-foreground font-normal">(Optional)</span></label>
                                    <input
                                        type="text"
                                        className="w-full px-3 py-2 border rounded-lg bg-background"
                                        value={formData.fullName}
                                        onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Mobile Number (WhatsApp) <span className="text-xs text-muted-foreground font-normal">(Optional)</span></label>
                                    <input
                                        type="tel"
                                        className="w-full px-3 py-2 border rounded-lg bg-background"
                                        value={formData.mobileNumber}
                                        onChange={e => setFormData({ ...formData, mobileNumber: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Password</label>
                                    <input
                                        type="password"
                                        required
                                        minLength={6}
                                        className="w-full px-3 py-2 border rounded-lg bg-background"
                                        value={formData.password}
                                        onChange={e => setFormData({ ...formData, password: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">
                                        Role {currentUser?.role !== 'Super Admin' && <span className="text-[10px] text-muted-foreground">(Super Admin only)</span>}
                                    </label>
                                    <select
                                        className="w-full px-3 py-2 border rounded-lg bg-background disabled:opacity-70 disabled:cursor-not-allowed"
                                        value={formData.role}
                                        onChange={e => setFormData({ ...formData, role: e.target.value })}
                                        disabled={currentUser?.role !== 'Super Admin'}
                                    >
                                        {roles.map(r => <option key={r} value={r}>{r}</option>)}
                                    </select>
                                </div>
                                {['Student', 'CR/ACR'].includes(formData.role) && (
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Section / Batch</label>
                                        <select
                                            className="w-full px-3 py-2 border rounded-lg bg-background"
                                            value={formData.section}
                                            onChange={e => setFormData({ ...formData, section: e.target.value })}
                                            required
                                        >
                                            {batches.length === 0 && <option value="" disabled>No sections available</option>}
                                            {sortedBatches.map(b => <option key={b.id} value={b.id.toString()}>{b.name} - Section {b.section}</option>)}
                                        </select>
                                    </div>
                                )}
                                {formData.role === 'Faculty' && (
                                    <div className="space-y-2">
                                        <label className="block text-sm font-medium mb-1">Faculty Profile</label>
                                        <div className="relative">
                                            <div className="flex gap-2 mb-2">
                                                <input
                                                    type="text"
                                                    placeholder="Search faculty..."
                                                    className="flex-grow px-3 py-1.5 text-xs border rounded bg-muted/30 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                                    value={facultySearch}
                                                    onChange={e => setFacultySearch(e.target.value)}
                                                />
                                            </div>
                                            <select
                                                className="w-full px-3 py-2 border rounded-lg bg-background"
                                                value={formData.facultyId}
                                                onChange={e => setFormData({ ...formData, facultyId: e.target.value })}
                                            >
                                                <option value="">None / Not Specified</option>
                                                {filteredFaculties.map(f => <option key={f.id} value={f.id.toString()}>{f.name} ({f.initials})</option>)}
                                            </select>
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className="p-6 border-t flex justify-end gap-3 bg-muted/20">
                                <button type="button" onClick={() => setIsCreateModalOpen(false)} className="px-4 py-2 border rounded-lg hover:bg-muted text-sm font-medium">Cancel</button>
                                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium transition-colors">Create User</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit User Modal */}
            {isEditModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-in fade-in">
                    <div className="bg-card w-full max-w-md rounded-xl shadow-xl overflow-hidden animate-in slide-in-from-bottom-4">
                        <div className="px-6 py-4 border-b flex justify-between items-center bg-muted/30">
                            <h3 className="text-lg font-semibold">Edit User: {selectedUser?.username}</h3>
                            <button onClick={() => setIsEditModalOpen(false)} className="text-muted-foreground hover:text-foreground">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleUpdateUser}>
                            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Username</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full px-3 py-2 border rounded-lg bg-background"
                                        value={formData.username}
                                        onChange={e => setFormData({ ...formData, username: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Email <span className="text-xs text-muted-foreground font-normal">(Optional)</span></label>
                                    <input
                                        type="email"
                                        className="w-full px-3 py-2 border rounded-lg bg-background"
                                        value={formData.email}
                                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Full Name <span className="text-xs text-muted-foreground font-normal">(Optional)</span></label>
                                    <input
                                        type="text"
                                        className="w-full px-3 py-2 border rounded-lg bg-background"
                                        value={formData.fullName}
                                        onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Mobile Number (WhatsApp) <span className="text-xs text-muted-foreground font-normal">(Optional)</span></label>
                                    <input
                                        type="tel"
                                        className="w-full px-3 py-2 border rounded-lg bg-background"
                                        value={formData.mobileNumber}
                                        onChange={e => setFormData({ ...formData, mobileNumber: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Status</label>
                                    <select
                                        className="w-full px-3 py-2 border rounded-lg bg-background"
                                        value={formData.status}
                                        onChange={e => setFormData({ ...formData, status: e.target.value })}
                                    >
                                        <option value="approved">Approved</option>
                                        <option value="pending">Pending</option>
                                        <option value="rejected">Rejected</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">
                                        Role {currentUser?.role !== 'Super Admin' && <span className="text-[10px] text-muted-foreground">(Super Admin only)</span>}
                                    </label>
                                    <select
                                        className="w-full px-3 py-2 border rounded-lg bg-background disabled:opacity-70 disabled:cursor-not-allowed"
                                        value={formData.role}
                                        onChange={e => setFormData({ ...formData, role: e.target.value })}
                                        disabled={selectedUser?.role === 'Super Admin' || currentUser?.role !== 'Super Admin'}
                                    >
                                        {roles.map(r => <option key={r} value={r}>{r}</option>)}
                                    </select>
                                    {selectedUser?.role === 'Super Admin' ? (
                                        <p className="text-xs text-amber-500 mt-1">Super Admin role cannot be changed directly here.</p>
                                    ) : currentUser?.role !== 'Super Admin' ? (
                                        <p className="text-xs text-muted-foreground mt-1 text-red-400">Only Super Admins can modify user roles.</p>
                                    ) : null}
                                </div>

                                {['Student', 'CR/ACR'].includes(formData.role) && (
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Section / Batch</label>
                                        <select
                                            className="w-full px-3 py-2 border rounded-lg bg-background"
                                            value={formData.section}
                                            onChange={e => setFormData({ ...formData, section: e.target.value })}
                                            required
                                        >
                                            {batches.length === 0 && <option value="" disabled>No sections available</option>}
                                            {sortedBatches.map(b => <option key={b.id} value={b.id.toString()}>{b.name} - Section {b.section}</option>)}
                                        </select>
                                    </div>
                                )}
                                {formData.role === 'Faculty' && (
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Faculty Profile</label>
                                        <select
                                            className="w-full px-3 py-2 border rounded-lg bg-background"
                                            value={formData.facultyId}
                                            onChange={e => setFormData({ ...formData, facultyId: e.target.value })}
                                        >
                                            <option value="">None / Not Specified</option>
                                            {faculties.map(f => <option key={f.id} value={f.id.toString()}>{f.name} ({f.initials})</option>)}
                                        </select>
                                    </div>
                                )}

                                {/* Permissions Section */}
                                {selectedUser?.role !== 'Super Admin' && selectedUser?.role !== 'Admin' && (
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Permissions</label>
                                        <div className="space-y-2 mt-2 bg-muted/30 p-3 rounded-lg border">
                                            {[
                                                { id: 'edit_routine', label: 'Edit Routine (Day)', desc: '(Can manage classes in day view)' },
                                                { id: 'edit_week_routine', label: 'Edit Routine (Week)', desc: '(Can manage classes & backups in week view)' },
                                                { id: 'manage_faculty', label: 'Manage Faculty', desc: '(Can add, edit, or delete faculty)' },
                                                { id: 'manage_courses', label: 'Manage Courses', desc: '(Can add, edit, or delete courses)' },
                                                { id: 'manage_rooms', label: 'Manage Rooms', desc: '(Can add, edit, or delete rooms)' },
                                                { id: 'manage_batches', label: 'Manage Batches', desc: '(Can add, edit, or delete batches)' },
                                                { id: 'assign_permissions', label: 'Assign Permissions', desc: '(Can manage user roles and permissions)' },
                                                { id: 'view_activity_logs', label: 'View Activity Logs', desc: '(Can view the system activity log)' },
                                            ].map(perm => (
                                                <label key={perm.id} className="flex items-center gap-2 cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                                                        checked={formData.permissions.includes(perm.id)}
                                                        onChange={(e) => {
                                                            const checked = e.target.checked;
                                                            setFormData(prev => ({
                                                                ...prev,
                                                                permissions: checked
                                                                    ? [...prev.permissions, perm.id]
                                                                    : prev.permissions.filter(p => p !== perm.id)
                                                            }));
                                                        }}
                                                    />
                                                    <span className="text-sm select-none">{perm.label} <span className="text-xs text-muted-foreground ml-1">{perm.desc}</span></span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className="p-6 border-t flex justify-end gap-3 bg-muted/20">
                                <button type="button" onClick={() => setIsEditModalOpen(false)} className="px-4 py-2 border rounded-lg hover:bg-muted text-sm font-medium">Cancel</button>
                                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium transition-colors">Save Changes</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Change Password Modal */}
            {isPasswordModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-in fade-in">
                    <div className="bg-card w-full max-w-sm rounded-xl shadow-xl overflow-hidden animate-in slide-in-from-bottom-4">
                        <div className="px-6 py-4 border-b flex justify-between items-center bg-amber-500/10 dark:bg-amber-500/5">
                            <h3 className="text-lg font-semibold flex items-center gap-2">
                                <Key className="w-5 h-5 text-amber-500" /> Change Password
                            </h3>
                            <button onClick={() => setIsPasswordModalOpen(false)} className="text-muted-foreground hover:text-foreground">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleChangePassword} className="p-6 space-y-4">
                            <div className="text-sm text-muted-foreground mb-4">
                                Enter a new password for <span className="font-semibold text-foreground">{selectedUser?.username}</span>.
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">New Password</label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        required
                                        minLength={6}
                                        className="w-full px-3 py-2 border rounded-lg bg-background focus:ring-amber-500 focus:border-amber-500 pr-10"
                                        value={passwordData.password}
                                        onChange={e => setPasswordData({ password: e.target.value })}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                    >
                                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                            </div>
                            <div className="pt-4 flex justify-end gap-3">
                                <button type="button" onClick={() => setIsPasswordModalOpen(false)} className="px-4 py-2 border rounded-lg hover:bg-muted">Cancel</button>
                                <button type="submit" className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600">Update Password</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
