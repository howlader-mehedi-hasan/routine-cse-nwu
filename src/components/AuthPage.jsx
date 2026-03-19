import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { getSettings, getFaculty } from '../services/api';
import axios from 'axios';

export default function AuthPage() {
    const [isLogin, setIsLogin] = useState(true);
    const [formData, setFormData] = useState({ 
        username: '', 
        email: '', 
        password: '', 
        role: 'Student',
        fullName: '',
        mobileNumber: '',
        section: '',
        facultyId: ''
    });
    const { login, register, api } = useAuth();
    const navigate = useNavigate();

    const allRoles = ['Super Admin', 'Admin', 'Moderator', 'Editor', 'Department Head', 'Faculty', 'Student', 'CR/ACR'];
    const [allowedRoles, setAllowedRoles] = useState(['Student', 'Faculty', 'CR/ACR']);
    const [batches, setBatches] = useState([]);
    const [faculties, setFaculties] = useState([]);

    useEffect(() => {
        const fetchRolesAndBatches = async () => {
            try {
                // Fetch Settings (Roles)
                const res = await getSettings();
                const settingsRoles = res.data?.data?.general?.registration_roles;
                if (settingsRoles && Array.isArray(settingsRoles) && settingsRoles.length > 0) {
                    setAllowedRoles(settingsRoles);
                    if (!settingsRoles.includes(formData.role)) {
                        setFormData(prev => ({ ...prev, role: settingsRoles[0] }));
                    }
                }
            } catch (err) {
                console.error("Failed to load registration settings", err);
            }

            try {
                // Determine base URL since we aren't logged in yet, we can't fully rely on the protected api wrapper
                const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
                const batchRes = await axios.get(`${baseURL}/batches`);
                if (batchRes.data && Array.isArray(batchRes.data)) {
                    setBatches(batchRes.data);
                    if (batchRes.data.length > 0 && !formData.section) {
                       setFormData(prev => ({ ...prev, section: batchRes.data[0].id.toString() }));
                    }
                }

                const facultyRes = await axios.get(`${baseURL}/faculty`);
                if (facultyRes.data && Array.isArray(facultyRes.data)) {
                    setFaculties(facultyRes.data);
                    if (facultyRes.data.length > 0 && !formData.facultyId) {
                       setFormData(prev => ({ ...prev, facultyId: facultyRes.data[0].id.toString() }));
                    }
                }
            } catch (err) {
                 console.error("Failed to load sections/batches/faculties", err);
            }
        };
        fetchRolesAndBatches();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (isLogin) {
                await login(formData.username, formData.password);
                toast.success('Logged in successfully');
                navigate('/');
            } else {
                const res = await register(formData);
                if (res.status === 'pending') {
                    toast.success('Registration successful! Please wait for a Super Admin to approve your account.');
                    setIsLogin(true); // Switch back to login
                } else {
                    toast.success('Registered successfully!');
                    navigate('/');
                }
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Authentication failed');
        }
    };

    return (
        <div className="flex justify-center items-center min-h-[80vh] bg-background">
            <div className="w-full max-w-md p-8 space-y-8 bg-card rounded-xl border shadow-lg">
                <div className="text-center">
                    <h2 className="text-3xl font-bold">{isLogin ? 'Sign In' : 'Register'}</h2>
                    <p className="mt-2 text-sm text-muted-foreground">
                        {isLogin ? 'Welcome back to NWU Routine' : 'Create an account to manage resources'}
                    </p>
                </div>

                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    <div className="space-y-4">
                        <div>
                            <label className="text-sm font-medium">Username</label>
                            <input
                                type="text"
                                required
                                className="w-full px-3 py-2 border rounded-md"
                                value={formData.username}
                                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                            />
                        </div>

                        {!isLogin && (
                            <>
                                <div>
                                    <label className="text-sm font-medium">Full Name</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full px-3 py-2 border rounded-md"
                                        value={formData.fullName}
                                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium">Mobile Number (WhatsApp)</label>
                                    <input
                                        type="tel"
                                        required
                                        className="w-full px-3 py-2 border rounded-md"
                                        value={formData.mobileNumber}
                                        onChange={(e) => setFormData({ ...formData, mobileNumber: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium">Email Address</label>
                                    <input
                                        type="email"
                                        required
                                        className="w-full px-3 py-2 border rounded-md"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium">Requested Account Type</label>
                                    <select
                                        className="w-full px-3 py-2 border rounded-md bg-transparent"
                                        value={formData.role}
                                        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                    >
                                        {allowedRoles.map(r => <option key={r} value={r}>{r}</option>)}
                                    </select>
                                </div>
                                {formData.role === 'Faculty' && (
                                    <div>
                                        <label className="text-sm font-medium">Select Faculty Profile</label>
                                        <select
                                            className="w-full px-3 py-2 border rounded-md bg-transparent"
                                            value={formData.facultyId}
                                            onChange={(e) => setFormData({ ...formData, facultyId: e.target.value })}
                                            required
                                        >
                                            <option value="">None / Not Specified</option>
                                            {faculties.length === 0 && <option value="" disabled>No faculties available</option>}
                                            {faculties.map(f => <option key={f.id} value={f.id.toString()}>{f.name} ({f.initials})</option>)}
                                        </select>
                                    </div>
                                )}
                                {['Student', 'CR/ACR'].includes(formData.role) && (
                                    <div>
                                        <label className="text-sm font-medium">Section / Batch</label>
                                        <select
                                            className="w-full px-3 py-2 border rounded-md bg-transparent"
                                            value={formData.section}
                                            onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                                            required
                                        >
                                            <option value="">None / Not Specified</option>
                                            {batches.length === 0 && <option value="" disabled>No sections available</option>}
                                            {batches.map(b => <option key={b.id} value={b.id.toString()}>{b.name} (Section {b.section})</option>)}
                                        </select>
                                    </div>
                                )}
                            </>
                        )}

                        <div>
                            <label className="text-sm font-medium">Password</label>
                            <input
                                type="password"
                                required
                                className="w-full px-3 py-2 border rounded-md"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="w-full py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-md shadow-sm transition-colors"
                    >
                        {isLogin ? 'Sign In' : 'Request Account'}
                    </button>

                    <div className="text-center">
                        <button
                            type="button"
                            className="text-sm text-indigo-600 hover:text-indigo-500"
                            onClick={() => setIsLogin(!isLogin)}
                        >
                            {isLogin ? "Don't have an account? Register" : 'Already have an account? Sign In'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
