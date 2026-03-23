import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || '/api',
});

// Add a request interceptor to attach the token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

export const getFaculty = () => api.get('/faculty');
export const getCourses = () => api.get('/courses');
export const getRooms = () => api.get('/rooms');
export const getBatches = () => api.get('/batches');
export const getRoutine = () => api.get('/routine');

export const createFaculty = (data) => api.post('/faculty', data);
export const updateFaculty = (id, data) => api.put(`/faculty/${id}`, data);
export const deleteFaculty = (id) => api.delete(`/faculty/${id}`);

export const createCourse = (data) => api.post('/courses', data);
export const updateCourse = (id, data) => api.put(`/courses/${id}`, data);
export const deleteCourse = (id) => api.delete(`/courses/${id}`);

export const createRoom = (data) => api.post('/rooms', data);
export const updateRoom = (id, data) => api.put(`/rooms/${id}`, data);
export const deleteRoom = (id) => api.delete(`/rooms/${id}`);

export const createBatch = (data) => api.post('/batches', data);
export const updateBatch = (id, data) => api.put(`/batches/${id}`, data);
export const deleteBatch = (id) => api.delete(`/batches/${id}`);

export const addRoutineEntry = (data) => api.post('/routine/add', data);
export const updateRoutineEntry = (id, data) => api.put(`/routine/${id}`, data);
export const deleteRoutineEntry = (id) => api.delete(`/routine/${id}`);
export const clearRoutine = () => api.delete('/routine/clear');
export const exportRoutine = () => api.get('/routine/export', { responseType: 'blob' });
export const importRoutine = (data) => api.post('/routine/import', data);

export const exportSystemBackup = () => api.get('/backup/export', { responseType: 'blob' });
export const importSystemBackup = (data) => api.post('/backup/import', data);

// Cloud Backup APIs
export const getCloudBackups = (type = '') => api.get(`/backup/cloud${type ? `?type=${type}` : ''}`);
export const saveCloudBackup = (filename, data) => api.post('/backup/cloud/save', { filename, data });
export const getCloudBackupData = (filename) => api.get(`/backup/cloud/data?filename=${filename}`);
export const createCloudBackup = () => api.post('/backup/cloud');
export const restoreCloudBackup = (filename) => api.post('/backup/cloud/restore', { filename });
export const renameCloudBackup = (oldFilename, newFilename) => api.patch('/backup/cloud/rename', { oldFilename, newFilename });
export const deleteCloudBackup = (filename) => api.delete(`/backup/cloud/${filename}`);

export const getSettings = (key = '') => api.get(`/settings${key ? `?key=${key}` : ''}`);
export const updateSettings = (data, key = '') => {
    const payload = key ? { ...data, key } : data;
    return api.put('/settings', payload);
};

export const getAuditLogs = () => api.get('/audit-logs');
export const updateAuditLog = (id, data) => api.put(`/audit-logs/${id}`, data);
export const deleteMultipleAuditLogs = (ids) => api.post('/audit-logs/delete-multiple', { ids });

export default api;
