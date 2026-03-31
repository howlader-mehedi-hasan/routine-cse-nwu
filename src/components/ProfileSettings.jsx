import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import { UserCircle, GraduationCap, User, Briefcase } from 'lucide-react';
import { getFaculty, getBatches } from '../services/api';

export default function ProfileSettings() {
    const { user, api } = useAuth();
    const [profileData, setProfileData] = useState({ 
        username: '', 
        email: '', 
        mobileNumber: '', 
        fullName: '', 
        facultyId: null, 
        section: '', 
        role: '' 
    });
    const [metadata, setMetadata] = useState({ faculty: [], batches: [] });

    useEffect(() => {
        if (user) {
            setProfileData({
                username: user.username,
                email: user.email,
                mobileNumber: user.mobileNumber || '',
                fullName: user.fullName || '',
                facultyId: user.facultyId || null,
                section: user.section || '',
                role: user.role || ''
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

    const sortedFaculties = React.useMemo(() => {
        return [...metadata.faculty].sort((a, b) => a.name.localeCompare(b.name));
    }, [metadata.faculty]);

    const sortedBatches = React.useMemo(() => {
        return [...metadata.batches].sort((a, b) => {
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
    }, [metadata.batches]);

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

    const ThreeWayToggle = ({ value, onChange }) => {
        const positions = ['Student', 'Moderator', 'Faculty'];
        const activeIndex = positions.indexOf(value) === -1 ? 1 : positions.indexOf(value);
        
        return (
            <div className="flex flex-col gap-3 mb-8">
                <label className="block text-sm font-semibold tracking-wide uppercase text-indigo-500/80 mb-1">Account Type</label>
                <div className="relative bg-muted/40 p-1 rounded-2xl flex items-center w-full shadow-inner border border-muted-foreground/10 h-14 overflow-hidden group">
                    <div 
                        className="absolute top-1 bottom-1 bg-white dark:bg-indigo-600 rounded-xl shadow-lg transition-all duration-500 cubic-bezier(0.34, 1.56, 0.64, 1)"
                        style={{ 
                            left: `calc(${(activeIndex * 100) / 3}% + 4px)`, 
                            width: 'calc(33.33% - 8px)',
                        }}
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-xl" />
                    </div>
                    {positions.map((label, idx) => (
                        <button
                            key={label}
                            type="button"
                            onClick={() => onChange(label)}
                            className={`relative z-10 flex-1 flex flex-col items-center justify-center gap-0.5 text-center transition-all duration-300 ${
                                activeIndex === idx 
                                    ? 'text-indigo-900 dark:text-white scale-105' 
                                    : 'text-muted-foreground hover:text-foreground opacity-60 hover:opacity-100 hover:scale-105'
                            }`}
                        >
                            {label === 'Student' && <GraduationCap className="w-4 h-4" />}
                            {label === 'Moderator' && <User className="w-4 h-4" />}
                            {label === 'Faculty' && <Briefcase className="w-4 h-4" />}
                            <span className="text-[10px] font-bold uppercase tracking-widest leading-none mt-1">
                                {label === 'Moderator' ? 'None' : label}
                            </span>
                        </button>
                    ))}
                </div>
            </div>
        );
    };

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
                        <label className="block text-sm font-medium mb-1">Full Name</label>
                        <input
                            type="text"
                            required
                            className="w-full px-3 py-2 border rounded-lg bg-background focus:ring-blue-500 focus:border-blue-500"
                            value={profileData.fullName}
                            onChange={e => setProfileData({ ...profileData, fullName: e.target.value })}
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
                    <ThreeWayToggle 
                        value={profileData.role === 'CR/ACR' ? 'Student' : profileData.role} 
                        onChange={role => {
                            setProfileData({ 
                                ...profileData, 
                                role,
                                // Correctly clear IDs when switching
                                facultyId: role === 'Faculty' ? profileData.facultyId : null,
                                section: role === 'Student' ? profileData.section : ''
                            });
                        }} 
                    />

                    {profileData.role === 'Faculty' && (
                        <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                            <label className="block text-sm font-medium mb-1">Faculty Profile</label>
                            <select
                                className="w-full px-3 py-2 border rounded-lg bg-background focus:ring-blue-500 focus:border-blue-500"
                                value={profileData.facultyId || ''}
                                onChange={e => setProfileData({ ...profileData, facultyId: e.target.value || null })}
                            >
                                <option value="">None / Not Specified</option>
                                {sortedFaculties.map(f => (
                                    <option key={f.id} value={f.id.toString()}>{f.name} ({f.initials})</option>
                                ))}
                            </select>
                        </div>
                    )}
                    {['Student', 'CR/ACR'].includes(profileData.role) && (
                        <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                            <label className="block text-sm font-medium mb-1">Section / Batch</label>
                            <select
                                className="w-full px-3 py-2 border rounded-lg bg-background focus:ring-blue-500 focus:border-blue-500"
                                value={profileData.section || ''}
                                onChange={e => setProfileData({ ...profileData, section: e.target.value })}
                            >
                                <option value="">None / Not Specified</option>
                                {sortedBatches.map(b => (
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
