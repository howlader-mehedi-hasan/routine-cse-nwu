import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import { UserCircle } from 'lucide-react';
import { getFaculty, getBatches } from '../services/api';

export default function ProfileSettings() {
    const { user, api } = useAuth();
    const [profileData, setProfileData] = useState({ username: '', email: '', mobileNumber: '', facultyId: '', section: '' });
    const [metadata, setMetadata] = useState({ faculty: [], batches: [] });

    useEffect(() => {
        if (user) {
            setProfileData({
                username: user.username,
                email: user.email,
                mobileNumber: user.mobileNumber || '',
                facultyId: user.facultyId || '',
                section: user.section || ''
            });
        }
    }, [user]);

    useEffect(() => {
        const fetchMeta = async () => {
            try {
                const [fRes, bRes] = await Promise.all([getFaculty(), getBatches()]);
                setMetadata({ faculty: fRes.data, batches: bRes.data });
            } catch (err) {
                console.error("Failed to load metadata", err);
            }
        };
        fetchMeta();
    }, []);

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        try {
            await api.put(`/auth/users/${user.id}`, profileData);
            toast.success('Profile updated successfully! Refreshing to apply changes...');
            setTimeout(() => window.location.reload(), 1500);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to update profile');
        }
    };

    if (!user) return null;

    return (
        <div className="space-y-8 p-6 max-w-2xl mx-auto">
            <div>
                <h2 className="text-3xl font-bold mb-2 flex items-center gap-2">
                    <UserCircle className="text-blue-600 h-8 w-8" /> Edit Profile
                </h2>
                <p className="text-muted-foreground">Update your personal account information.</p>
            </div>

            <div className="bg-card rounded-lg border shadow-sm overflow-hidden">
                <form onSubmit={handleUpdateProfile} className="p-6 space-y-4 text-left">
                    <div>
                        <label className="block text-sm font-medium mb-1">Username</label>
                        <input
                            type="text"
                            required
                            className="w-full px-3 py-2 border rounded-lg bg-background focus:ring-blue-500 focus:border-blue-500"
                            value={profileData.username}
                            onChange={e => setProfileData({ ...profileData, username: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Email</label>
                        <input
                            type="email"
                            required
                            className="w-full px-3 py-2 border rounded-lg bg-background focus:ring-blue-500 focus:border-blue-500"
                            value={profileData.email}
                            onChange={e => setProfileData({ ...profileData, email: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Mobile Number (WhatsApp) <span className="text-xs text-muted-foreground font-normal">(Optional)</span></label>
                        <input
                            type="tel"
                            className="w-full px-3 py-2 border rounded-lg bg-background focus:ring-blue-500 focus:border-blue-500"
                            value={profileData.mobileNumber}
                            onChange={e => setProfileData({ ...profileData, mobileNumber: e.target.value })}
                        />
                    </div>
                    {user.role === 'Faculty' && (
                        <div>
                            <label className="block text-sm font-medium mb-1">Faculty Profile</label>
                            <select
                                className="w-full px-3 py-2 border rounded-lg bg-background focus:ring-blue-500 focus:border-blue-500"
                                value={profileData.facultyId}
                                onChange={e => setProfileData({ ...profileData, facultyId: e.target.value })}
                            >
                                <option value="">None / Not Specified</option>
                                {metadata.faculty.map(f => (
                                    <option key={f.id} value={f.id.toString()}>{f.name} ({f.initials})</option>
                                ))}
                            </select>
                        </div>
                    )}
                    {['Student', 'CR/ACR'].includes(user.role) && (
                        <div>
                            <label className="block text-sm font-medium mb-1">Section / Batch</label>
                            <select
                                className="w-full px-3 py-2 border rounded-lg bg-background focus:ring-blue-500 focus:border-blue-500"
                                value={profileData.section}
                                onChange={e => setProfileData({ ...profileData, section: e.target.value })}
                            >
                                <option value="">None / Not Specified</option>
                                {metadata.batches.map(b => (
                                    <option key={b.id} value={b.id.toString()}>{b.name} - Section {b.section}</option>
                                ))}
                            </select>
                        </div>
                    )}
                    <div className="pt-4">
                        <button type="submit" className="w-full sm:w-auto px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                            Save Changes
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
