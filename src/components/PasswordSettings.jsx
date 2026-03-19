import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import { Key, Eye, EyeOff } from 'lucide-react';

export default function PasswordSettings() {
    const { user, api } = useAuth();
    const [passwordData, setPasswordData] = useState({ password: '' });
    const [showPassword, setShowPassword] = useState(false);

    const handleChangePassword = async (e) => {
        e.preventDefault();
        try {
            await api.put(`/auth/users/${user.id}/password`, passwordData);
            toast.success('Password changed successfully');
            setPasswordData({ password: '' });
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to change password');
        }
    };

    if (!user) return null;

    return (
        <div className="space-y-8 p-6 max-w-2xl mx-auto">
            <div>
                <h2 className="text-3xl font-bold mb-2 flex items-center gap-2">
                    <Key className="text-slate-600 h-8 w-8" /> Change Password
                </h2>
                <p className="text-muted-foreground">Ensure your account is protected with a strong password.</p>
            </div>

            <div className="bg-card rounded-lg border shadow-sm overflow-hidden">
                <form onSubmit={handleChangePassword} className="p-6 space-y-4 text-left">
                    <div>
                        <label className="block text-sm font-medium mb-1">New Password</label>
                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                required
                                minLength={6}
                                className="w-full px-3 py-2 border rounded-lg bg-background focus:ring-slate-500 focus:border-slate-500 pr-10"
                                value={passwordData.password}
                                onChange={e => setPasswordData({ password: e.target.value })}
                                placeholder="Enter at least 6 characters"
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
                    <div className="pt-4">
                        <button type="submit" className="w-full sm:w-auto px-6 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition">
                            Update Password
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
