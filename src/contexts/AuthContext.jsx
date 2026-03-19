import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('token') || null);
    const [loading, setLoading] = useState(true);

    const api = axios.create({
        baseURL: import.meta.env.VITE_API_URL || '/api',
    });

    api.interceptors.request.use((config) => {
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    });

    useEffect(() => {
        const fetchUser = async () => {
            if (!token) {
                setLoading(false);
                return;
            }
            try {
                setLoading(true);
                const res = await api.get('/auth/me');
                setUser(res.data);
            } catch (err) {
                console.error("Token invalid or expired", err);
                logout();
            } finally {
                setLoading(false);
            }
        };

        fetchUser();
    }, [token]);

    const login = async (username, password) => {
        const res = await api.post('/auth/login', { username, password });
        setToken(res.data.token);
        setUser(res.data.user);
        localStorage.setItem('token', res.data.token);
        return res.data;
    };

    const register = async (userData) => {
        const res = await api.post('/auth/register', userData);
        if (res.data.token) {
            setToken(res.data.token);
            setUser(res.data.user);
            localStorage.setItem('token', res.data.token);
        }
        return res.data;
    };

    const logout = () => {
        setToken(null);
        setUser(null);
        localStorage.removeItem('token');
    };

    const hasPermission = (permissionName) => {
        if (!user) return false;
        if (user.role === 'Super Admin' || user.role === 'Admin') return true;
        return Array.isArray(user.permissions) && user.permissions.includes(permissionName);
    };

    const hasAnyPermission = (permissionsArray) => {
        if (!user) return false;
        if (user.role === 'Super Admin' || user.role === 'Admin') return true;
        if (!Array.isArray(user.permissions)) return false;
        return permissionsArray.some(p => user.permissions.includes(p));
    };

    return (
        <AuthContext.Provider value={{ user, token, loading, login, register, logout, api, hasPermission, hasAnyPermission }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
