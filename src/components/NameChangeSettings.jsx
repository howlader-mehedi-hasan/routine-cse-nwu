import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import { Type } from 'lucide-react';

export default function NameChangeSettings() {
    const { user, api } = useAuth();
    const [nameChangeData, setNameChangeData] = useState({ requestedName: user?.fullName || '' });

    const handleRequestNameChange = async (e) => {
        e.preventDefault();
        try {
            await api.post(`/auth/users/${user.id}/name-change`, nameChangeData);
            toast.success('Name change requested successfully! Sent to admin for approval.');
            setTimeout(() => window.location.reload(), 1500);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to request name change');
        }
    };

    if (!user) return null;

    return (
        <div className="space-y-8 p-6 max-w-2xl mx-auto">
            <div>
                <h2 className="text-3xl font-bold mb-2 flex items-center gap-2">
                    <Type className="text-pink-600 h-8 w-8" /> Request Name Change
                </h2>
                <p className="text-muted-foreground">Request to update your official full name on record.</p>
            </div>

            <div className="bg-card rounded-lg border shadow-sm overflow-hidden">
                <form onSubmit={handleRequestNameChange} className="p-6 space-y-4 text-left">
                    {user.pendingFullName && (
                        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 mb-4">
                            <p className="text-amber-800 dark:text-amber-400 font-medium">
                                You have a pending name change request waiting for approval: <span className="font-bold">"{user.pendingFullName}"</span>
                            </p>
                        </div>
                    )}
                    
                    <div>
                        <label className="block text-sm font-medium mb-1">Current Name on Record</label>
                        <div className="px-3 py-2 border bg-muted rounded-lg text-muted-foreground">
                            {user.fullName || '(Not Set)'}
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Requested New Name</label>
                        <input
                            type="text"
                            required
                            className="w-full px-3 py-2 border rounded-lg bg-background focus:ring-pink-500 focus:border-pink-500"
                            value={nameChangeData.requestedName}
                            onChange={e => setNameChangeData({ requestedName: e.target.value })}
                            placeholder="Enter new full name"
                            disabled={!!user.pendingFullName}
                        />
                    </div>
                    <div className="pt-4 flex gap-3">
                        <button 
                            type="submit" 
                            disabled={!!user.pendingFullName}
                            className="w-full sm:w-auto px-6 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Submit Request
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
