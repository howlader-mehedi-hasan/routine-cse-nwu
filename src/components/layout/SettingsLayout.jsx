import React from 'react';
import { Link, useLocation, Navigate } from 'react-router-dom';
import { Database, Settings, Shield, ChevronRight, UserCog, Users, UserCircle, Key, Type, History } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useAuth } from '../../contexts/AuthContext';

const SettingsLayout = ({ children }) => {
    const location = useLocation();
    const { user, hasAnyPermission, hasPermission } = useAuth();

    if (!user) {
        return <Navigate to="/auth" replace />;
    }

    let settingItems = [];

    // Home dashboard for all registered users
    if (user) {
        settingItems.push({ path: '/dashboard', label: 'Dashboard', icon: <Shield size={18} /> });
    }

    // Admin panel only for specific roles
    if (user && hasAnyPermission(['manage_faculty', 'manage_courses', 'manage_rooms', 'manage_batches'])) {
        settingItems.push({ path: '/admin', label: 'Database (Admin)', icon: <Database size={18} /> });
    }

    // Settings for public registration configuration
    if (user && (user.role === 'Super Admin' || user.role === 'Admin')) {
        settingItems.push({ path: '/registration-settings', label: 'Registration Settings', icon: <UserCog size={18} /> });
        settingItems.push({ path: '/semester-migration', label: 'Semester Migration', icon: <ChevronRight size={18} /> });
    }

    // User management only for Super Admin or those with permission
    if (user && hasPermission('assign_permissions')) {
        settingItems.push({ path: '/users', label: 'User Approvals', icon: <Users size={18} /> });
    }

    // Personal user settings (available to everyone)
    if (user) {
        settingItems.push({ path: '/profile', label: 'Edit Profile', icon: <UserCircle size={18} /> });
        settingItems.push({ path: '/password', label: 'Change Password', icon: <Key size={18} /> });
        settingItems.push({ path: '/name-change', label: 'Request Name Change', icon: <Type size={18} /> });
    }

    // Activity Log
    if (user && (user.role === 'Super Admin' || hasPermission('view_activity_logs'))) {
        settingItems.push({ path: '/activity-log', label: 'Activity Log', icon: <History size={18} /> });
    }

    // If on /settings, redirect to the first available page
    if (location.pathname === '/settings') {
        if (settingItems.length > 0) {
            return <Navigate to={settingItems[0].path} replace />;
        }
        return <Navigate to="/" replace />;
    }

    return (
        <div className="flex flex-col md:flex-row gap-6">
            {/* Sidebar */}
            <aside className="w-full md:w-64 flex-shrink-0">
                <div className="bg-card border border-border rounded-xl shadow-sm p-4 sticky top-24">
                    <div className="flex items-center gap-2 mb-4 px-2">
                        <Settings className="w-5 h-5 text-primary" />
                        <h2 className="text-lg font-semibold tracking-tight">Settings</h2>
                    </div>

                    <nav className="space-y-1">
                        {settingItems.map((item) => {
                            const isActive = location.pathname.startsWith(item.path);
                            return (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    className={cn(
                                        "flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                                        isActive
                                            ? 'bg-primary/10 text-primary dark:bg-primary/20 shadow-sm'
                                            : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                                    )}
                                >
                                    <div className="flex items-center gap-3">
                                        {item.icon}
                                        <span>{item.label}</span>
                                    </div>
                                    {isActive && <ChevronRight size={16} className="opacity-50" />}
                                </Link>
                            );
                        })}
                    </nav>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 min-w-0">
                <div className="min-h-[calc(100vh-12rem)]">
                    {children}
                </div>
            </main>
        </div>
    );
};

export default SettingsLayout;
