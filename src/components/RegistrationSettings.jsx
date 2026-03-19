import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import { Settings } from 'lucide-react';
import { getSettings, updateSettings } from '../services/api';

export default function RegistrationSettings() {
    const { user: currentUser } = useAuth();
    const [settings, setSettings] = useState(null);
    const [loading, setLoading] = useState(true);

    const allRoles = ['Super Admin', 'Admin', 'Moderator', 'Editor', 'Department Head', 'Faculty', 'Student', 'CR/ACR'];

    useEffect(() => {
        const loadSettings = async () => {
            try {
                const res = await getSettings();
                setSettings(res.data?.data || null);
            } catch (err) {
                toast.error('Failed to load settings');
            } finally {
                setLoading(false);
            }
        };
        loadSettings();
    }, []);

    if (loading) return <div className="p-6 text-muted-foreground">Loading settings...</div>;

    if (currentUser?.role !== 'Super Admin' && currentUser?.role !== 'Admin') {
        return <div className="p-6 text-red-500">You do not have permission to view this page.</div>;
    }

    return (
        <div className="space-y-8 p-6">
            <div>
                <h2 className="text-3xl font-bold mb-2 flex items-center gap-2">
                    <Settings className="text-indigo-600 h-8 w-8" /> Registration Settings
                </h2>
                <p className="text-muted-foreground">Configure global system defaults and permissions.</p>
            </div>

            <div className="bg-card rounded-lg border shadow-sm p-4">
                <h3 className="text-xl font-semibold mb-2 border-b pb-2">Allowed Public Registration Roles</h3>
                <p className="text-sm text-muted-foreground mb-4">
                    Select which account types users can natively request when registering themselves from the public page.
                    Users will only be able to pick from the roles you select below.
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
                    {allRoles.filter(r => r !== 'Super Admin').map(role => {
                        const currentRoles = settings?.general?.registration_roles || ['Student', 'Faculty', 'CR/ACR'];
                        const isChecked = currentRoles.includes(role);
                        return (
                            <label key={role} className="flex items-center gap-2 cursor-pointer p-2 border rounded-lg hover:bg-muted/50 transition">
                                <input
                                    type="checkbox"
                                    className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                                    checked={isChecked}
                                    onChange={async (e) => {
                                        try {
                                            const checked = e.target.checked;
                                            const newRoles = checked
                                                ? [...currentRoles, role]
                                                : currentRoles.filter(r => r !== role);

                                            const newSettings = {
                                                ...settings,
                                                general: {
                                                    ...(settings?.general || {}),
                                                    registration_roles: newRoles
                                                }
                                            };
                                            setSettings(newSettings);
                                            await updateSettings(newSettings);
                                            toast.success('Registration settings updated');
                                        } catch (err) {
                                            toast.error('Failed to update settings');
                                            // Revert local state on failure
                                            setSettings(settings);
                                        }
                                    }}
                                />
                                <span className="text-sm font-medium">{role}</span>
                            </label>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
