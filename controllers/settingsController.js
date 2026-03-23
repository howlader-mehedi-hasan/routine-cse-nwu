import dbRepository from '../repositories/dbRepository.js';
import { logActivity } from './auditLogController.js';

export const getSettings = async (req, res) => {
    try {
        const { key } = req.query;
        const settings = await dbRepository.getSettings(key || 'app_settings');
        res.json({ success: true, data: settings });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

export const updateSettings = async (req, res) => {
    try {
        const { key, ...updates } = req.body;
        // If 'key' was provided in the body, use it. Otherwise default to 'app_settings'
        // Note: For 'app_settings', 'updates' will be the whole body if 'key' is missing.
        // If 'key' is present, 'updates' will be the rest of the fields.
        
        const settingsKey = key || 'app_settings';
        const dataToUpdate = key ? updates : req.body;

        const settings = await dbRepository.updateSettings(dataToUpdate, settingsKey);
        
        await logActivity(req.user.id, req.user.username, 'Update Settings', `Updated settings for key: ${settingsKey}`);

        res.json({ success: true, data: settings });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
