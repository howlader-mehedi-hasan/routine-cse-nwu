import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Calendar, Database, Settings, GraduationCap, Moon, Sun, Users, Menu, X, LogOut, Shield, CalendarClock, BoxIcon, RouteIcon, RouterIcon, BotIcon, Icon } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useTheme } from "../ui/ThemeProvider";
import { Button } from "../ui/Button";
import { useAuth } from '../../contexts/AuthContext';
import { useWindowSize } from '../../hooks/useWindowSize';

const Navbar = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState(false);
    const { user, logout, hasPermission, hasAnyPermission } = useAuth();
    const { width } = useWindowSize();

    const handleLogout = () => {
        logout();
        navigate('/auth');
    };

    // Base items for everyone
    let menuItems = [
        { path: '/', label: 'Routine View', icon: <BoxIcon size={18} /> },
        { path: '/week-routine', label: 'Week View', icon: <CalendarClock size={18} /> },
        { path: '/faculty', label: 'Faculty', icon: <Users size={18} /> },
    ];

    let settingItems = [];

    // Home dashboard for all registered users
    if (user) {
        settingItems.push({ path: '/dashboard', label: 'Dashboard', icon: <Shield size={18} /> });
    }

    // Admin panel only for specific roles
    if (user && hasAnyPermission(['manage_faculty', 'manage_courses', 'manage_rooms', 'manage_batches'])) {
        settingItems.push({ path: '/admin', label: 'Admin Panel', icon: <Database size={18} /> });
    }

    // User management only for Super Admin or those with permission
    if (user && hasPermission('assign_permissions')) {
        settingItems.push({ path: '/users', label: 'Users', icon: <Shield size={18} /> });
    }

    return (
        <nav className="border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-50 transition-colors duration-300">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex h-16 items-center justify-between">
                    {/* Logo Section */}
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary rounded-lg shadow-sm shadow-primary/20">
                            <GraduationCap size={24} className="text-primary-foreground" />
                        </div>
                        <div className="hidden md:block">
                            <h1 className="text-lg font-bold text-foreground leading-none">
                                Smart Routine
                            </h1>
                            <p className="text-[10px] text-muted-foreground font-medium tracking-wider uppercase mt-0.5">Management System</p>
                        </div>
                    </div>

                    {/* Navigation Links - Desktop & Wide Mobile */}
                    <div className={cn(
                        "items-center space-x-1",
                        width >= 350 ? "flex" : "hidden"
                    )}>
                        {menuItems.map((item) => {
                            const isActive = location.pathname === item.path;
                            return (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    className={cn(
                                        "flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200",
                                        isActive
                                            ? 'bg-primary/10 text-primary dark:bg-primary/20'
                                            : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                                    )}
                                >
                                    {item.icon}
                                    {width >= 600 && <span>{item.label}</span>}
                                </Link>
                            );
                        })}
                    </div>

                    {/* Right Side Actions */}
                    <div className="flex items-center space-x-2">
                        {user && (
                            <div className="hidden md:flex items-center space-x-1 text-xs text-muted-foreground mr-2 bg-muted px-2 py-1 rounded border border-border/50">
                                <span className="font-bold text-indigo-500">{user.fullName || user.username}</span>
                            </div>
                        )}
                        {width >= 350 && <div className="h-6 w-px bg-border mx-2"></div>}

                        {settingItems.length > 0 && (
                            <Link to="/settings" className={width >= 350 ? "block" : "hidden"}>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className={cn(
                                        "h-9 w-9 text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-all duration-200",
                                        location.pathname.startsWith('/settings') && "bg-accent text-accent-foreground"
                                    )}
                                >
                                    <Settings size={20} className="transition-transform" />
                                    <span className="sr-only">Settings</span>
                                </Button>
                            </Link>
                        )}

                        <ThemeToggle />

                        {user ? (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleLogout}
                                className={cn(
                                    "items-center gap-2 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30",
                                    width >= 350 ? "flex" : "hidden"
                                )}
                            >
                                <LogOut size={16} /> Logout
                            </Button>
                        ) : (
                            <Button
                                asChild
                                variant="default"
                                size="sm"
                                className={cn(
                                    "items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white",
                                    width >= 350 ? "flex" : "hidden"
                                )}
                            >
                                <Link to="/auth">Sign In</Link>
                            </Button>
                        )}

                        {/* Mobile Menu Button - Tiny Mobile Only */}
                        <div className={width < 350 ? "block" : "hidden"}>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setIsOpen(!isOpen)}
                                className="h-9 w-9 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                            >
                                {isOpen ? <X size={20} /> : <Menu size={20} />}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile Menu */}
            {isOpen && (
                <div className="md:hidden border-t border-border bg-background animate-in slide-in-from-top-2 duration-300">
                    <div className="py-2 px-4 space-y-1">
                        {menuItems.map((item) => {
                            const isActive = location.pathname === item.path;
                            return (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    onClick={() => setIsOpen(false)}
                                    className={cn(
                                        "flex items-center space-x-3 px-3 py-3 rounded-md text-sm font-medium transition-colors",
                                        isActive
                                            ? 'bg-primary/10 text-primary dark:bg-primary/20'
                                            : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                                    )}
                                >
                                    {item.icon}
                                    <span>{item.label}</span>
                                </Link>
                            );
                        })}

                        {settingItems.length > 0 && (
                            <div className="pt-2 pb-1 border-t border-border/50 mt-2">
                                <Link
                                    to="/settings"
                                    onClick={() => setIsOpen(false)}
                                    className={cn(
                                        "flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                                        location.pathname.startsWith('/settings')
                                            ? 'bg-primary/10 text-primary dark:bg-primary/20'
                                            : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                                    )}
                                >
                                    <Settings size={18} />
                                    <span>Settings</span>
                                </Link>
                            </div>
                        )}

                        {user ? (
                            <div className="border-t border-border/50 pt-2 mt-2">
                                <div className="flex items-center justify-between px-3 py-2 text-sm">
                                    <span className="font-bold text-indigo-500">{user.fullName || user.username}</span>
                                    <Button variant="ghost" size="sm" onClick={handleLogout} className="text-red-500 flex items-center gap-2">
                                        <LogOut size={16} /> Logout
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className="border-t border-border/50 pt-2 mt-2 text-center">
                                <Button asChild variant="default" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white">
                                    <Link to="/auth" onClick={() => setIsOpen(false)}>Sign In</Link>
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </nav>
    );
};

function ThemeToggle() {
    const { setTheme, theme } = useTheme()

    return (
        <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "light" ? "dark" : "light")}
            className="h-9 w-9 text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-all duration-200"
        >
            <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
        </Button>
    )
}

export default Navbar;
