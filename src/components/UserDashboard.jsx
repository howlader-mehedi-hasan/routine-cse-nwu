import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import { Shield, BookOpen, Database, Users } from 'lucide-react';

export default function UserDashboard() {
    const { user, hasPermission } = useAuth();

    if (!user) {
        return <div>Loading...</div>; // Rendered via protected route anyway
    }

    const isAdmin = ['Super Admin', 'Admin'].includes(user.role);
    const canManageUsers = hasPermission('assign_permissions');

    return (
        <div className="space-y-8 max-w-5xl mx-auto p-4 md:p-8">
            {/* Header Section */}
            <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
                <div className="bg-gradient-to-r from-indigo-500/20 to-purple-500/20 p-8 border-b border-border">
                    <h2 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
                        <Shield className="h-8 w-8 text-indigo-500" />
                        Welcome back, {user.fullName || user.username}!
                    </h2>
                    <p className="text-muted-foreground mt-2 max-w-2xl">
                        This is your personal dashboard. Manage your account, access quick links, and view your system permissions below.
                    </p>
                </div>

                {/* Status Strip */}
                <div className="bg-muted/30 px-8 py-4 flex flex-wrap gap-6 items-center">
                    <div className="flex flex-col">
                        <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1">Account Status</span>
                        <div className="flex items-center gap-2">
                            <span className="relative flex h-3 w-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                            </span>
                            <span className="font-semibold text-emerald-600 dark:text-emerald-400">Active</span>
                        </div>
                    </div>
                    <div className="h-10 w-px bg-border hidden sm:block"></div>
                    <div className="flex flex-col">
                        <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1">Access Level</span>
                        <span className="font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-100 dark:bg-indigo-900/30 px-2 py-0.5 rounded-md self-start">
                            {user.role}
                        </span>
                    </div>
                    <div className="h-10 w-px bg-border hidden sm:block"></div>
                    <div className="flex flex-col">
                        <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1">Registered Email</span>
                        <span className="text-foreground">{user.email}</span>
                    </div>
                </div>
            </div>

            {/* Quick Links Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

                {/* Everyone gets this card */}
                <Link to="/" className="group block focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-xl">
                    <div className="bg-card hover:bg-muted/50 transition-colors border border-border rounded-xl p-6 h-full flex flex-col items-start gap-4 shadow-sm hover:shadow-md">
                        <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 rounded-lg group-hover:scale-110 transition-transform">
                            <BookOpen className="h-6 w-6" />
                        </div>
                        <div className="space-y-1">
                            <h3 className="font-bold text-lg">View Class Routine</h3>
                            <p className="text-sm text-muted-foreground">Access the master schedule, search by faculty, or view section timings.</p>
                        </div>
                    </div>
                </Link>

                {/* Only Admins/Super Admins get this card */}
                {isAdmin && (
                    <Link to="/admin" className="group block focus:outline-none focus:ring-2 focus:ring-amber-500 rounded-xl">
                        <div className="bg-amber-50/30 dark:bg-amber-950/20 hover:bg-amber-50 dark:hover:bg-amber-900/40 transition-colors border border-amber-200 dark:border-amber-800 rounded-xl p-6 h-full flex flex-col items-start gap-4 shadow-sm hover:shadow-md relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-amber-400/20 to-orange-500/20 rounded-bl-full -z-10 blur-xl"></div>
                            <div className="p-3 bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400 rounded-lg group-hover:scale-110 transition-transform shadow-inner shadow-amber-500/20">
                                <Database className="h-6 w-6" />
                            </div>
                            <div className="space-y-1">
                                <h3 className="font-bold text-lg text-amber-900 dark:text-amber-100">Database Management</h3>
                                <p className="text-sm text-amber-700 dark:text-amber-400/80">Authorized access to modify Faculty, Courses, Rooms, and Batches.</p>
                            </div>
                        </div>
                    </Link>
                )}

                {/* Only users with permission get this card */}
                {canManageUsers && (
                    <Link to="/users" className="group block focus:outline-none focus:ring-2 focus:ring-emerald-500 rounded-xl">
                        <div className="bg-emerald-50/30 dark:bg-emerald-950/20 hover:bg-emerald-50 dark:hover:bg-emerald-900/40 transition-colors border border-emerald-200 dark:border-emerald-800 rounded-xl p-6 h-full flex flex-col items-start gap-4 shadow-sm hover:shadow-md relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-emerald-400/20 to-teal-500/20 rounded-bl-full -z-10 blur-xl"></div>
                            <div className="p-3 bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 rounded-lg group-hover:scale-110 transition-transform shadow-inner shadow-emerald-500/20">
                                <Users className="h-6 w-6" />
                            </div>
                            <div className="space-y-1">
                                <h3 className="font-bold text-lg text-emerald-900 dark:text-emerald-100">User Approvals</h3>
                                <p className="text-sm text-emerald-700 dark:text-emerald-400/80">Approve new registration requests and manager user role assignments.</p>
                            </div>
                        </div>
                    </Link>
                )}

            </div>
        </div>
    );
}
