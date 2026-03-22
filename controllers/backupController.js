import dbRepository from '../repositories/dbRepository.js';
import { logActivity } from './auditLogController.js';

export const exportSystemBackup = async (req, res) => {
    try {
        const collections = ['faculty', 'rooms', 'courses', 'batches', 'routine_schedule', 'settings'];
        const backupData = {
            version: "1.0",
            timestamp: new Date().toISOString(),
            data: {}
        };

        for (const collection of collections) {
            if (collection === 'settings') {
                backupData.data[collection] = await dbRepository.getSettings();
            } else {
                backupData.data[collection] = await dbRepository.getAll(collection);
            }
        }

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `system_backup_${timestamp}.json`;

        res.setHeader('Content-disposition', `attachment; filename=${filename}`);
        res.setHeader('Content-type', 'application/json');
        res.status(200).send(JSON.stringify(backupData, null, 2));

        await logActivity(req.user.id, req.user.fullName || req.user.username, 'System Backup', 'Exported a full system backup.');

    } catch (error) {
        console.error("Error exporting system backup:", error.message);
        res.status(500).json({ message: 'Failed to export system backup', error: error.message });
    }
};

export const importSystemBackup = async (req, res) => {
    try {
        const backupData = req.body;

        if (!backupData || !backupData.data || backupData.version !== "1.0") {
            return res.status(400).json({ message: 'Invalid backup format. Expected version 1.0.' });
        }

        const collections = ['faculty', 'rooms', 'courses', 'batches', 'routine_schedule', 'settings'];
        
        // Basic validation: ensure all required collections exist in backup
        const missingCollections = collections.filter(c => backupData.data[c] === undefined);
        if (missingCollections.length > 0) {
            return res.status(400).json({ message: `Missing collections in backup: ${missingCollections.join(', ')}` });
        }

        // 1. Clear existing data (Destructive step)
        // Note: we clear in an order that respects potential dependencies (though Supabase might handle it differently)
        // Clearing settings is special as it's an upsert usually
        for (const collection of collections) {
            if (collection !== 'settings') {
                await dbRepository.clearCollection(collection);
            }
        }

        // 2. Restore data
        for (const collection of collections) {
            const data = backupData.data[collection];
            if (collection === 'settings') {
                let settingsData = data;
                // Backwards compatibility for legacy backups where settings was an array of rows
                if (Array.isArray(data)) {
                    const appSettingsRow = data.find(row => row.key === 'app_settings');
                    settingsData = appSettingsRow ? appSettingsRow.value : {};
                }
                await dbRepository.updateSettings(settingsData);
            } else if (Array.isArray(data) && data.length > 0) {
                await dbRepository.bulkCreate(collection, data);
            }
        }

        await logActivity(req.user.id, req.user.fullName || req.user.username, 'System Restore', 'Performed a full system restore from backup.');

        res.json({ message: 'System restored successfully from backup.' });

    } catch (error) {
        console.error("Error importing system backup:", error.message);
        res.status(500).json({ message: 'Failed to restore system backup', error: error.message });
    }
};

// --- Cloud Backup Endpoints ---

export const performCloudBackup = async (userId, username, label = 'Cloud Backup') => {
    const collections = ['faculty', 'rooms', 'courses', 'batches', 'routine_schedule', 'settings'];
    const backupData = {
        version: "1.0",
        timestamp: new Date().toISOString(),
        data: {}
    };

    for (const collection of collections) {
        if (collection === 'settings') {
            backupData.data[collection] = await dbRepository.getSettings();
        } else {
            backupData.data[collection] = await dbRepository.getAll(collection);
        }
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `system_backup_${timestamp}.json`;
    const fileContent = JSON.stringify(backupData, null, 2);

    await dbRepository.uploadToCloud(filename, fileContent);
    await logActivity(userId, username, label, `Created cloud backup: ${filename}`);
    
    return filename;
};

export const createCloudBackup = async (req, res) => {
    try {
        const filename = await performCloudBackup(req.user.id, req.user.fullName || req.user.username);
        res.status(201).json({ message: 'Cloud backup created successfully', filename });
    } catch (error) {
        console.error("Error creating cloud backup:", error.message);
        res.status(500).json({ message: 'Failed to create cloud backup', error: error.message });
    }
};

export const getCloudBackups = async (req, res) => {
    try {
        const { type } = req.query; // 'system', 'schedule_settings', 'pdf_settings', 'routine'
        let prefix = '';
        if (type === 'system') prefix = 'system_backup_';
        else if (type === 'schedule_settings') prefix = 'schedule_settings_backup_';
        else if (type === 'pdf_settings') prefix = 'pdf_settings_backup_';
        else if (type === 'routine') prefix = 'routine_backup_';
        
        const files = await dbRepository.listCloudBackups(prefix);
        res.status(200).json({ data: files });
    } catch (error) {
        console.error("Error fetching cloud backups:", error.message);
        res.status(500).json({ message: 'Failed to fetch cloud backups', error: error.message });
    }
};

export const saveCloudBackup = async (req, res) => {
    try {
        const { filename, data } = req.body;
        if (!filename || !data) {
            return res.status(400).json({ message: 'Filename and data are required' });
        }
        
        const fileContent = JSON.stringify(data, null, 2);
        await dbRepository.uploadToCloud(filename, fileContent);
        await logActivity(req.user.id, req.user.fullName || req.user.username, 'Cloud Backup', `Created generic cloud backup: ${filename}`);
        
        res.status(201).json({ message: 'Cloud backup saved successfully', filename });
    } catch (error) {
        console.error("Error saving cloud backup:", error.message);
        res.status(500).json({ message: 'Failed to save cloud backup', error: error.message });
    }
};

export const getCloudBackupData = async (req, res) => {
    try {
        const { filename } = req.query;
        if (!filename) {
            return res.status(400).json({ message: 'Filename is required' });
        }
        
        const blob = await dbRepository.downloadFromCloud(filename);
        const text = await blob.text();
        const backupData = JSON.parse(text);
        
        res.status(200).json({ data: backupData });
    } catch (error) {
        console.error("Error fetching cloud backup data:", error.message);
        res.status(500).json({ message: 'Failed to fetch cloud backup data', error: error.message });
    }
};

export const restoreCloudBackup = async (req, res) => {
    try {
        const { filename } = req.body;
        if (!filename) {
            return res.status(400).json({ message: 'Filename is required' });
        }

        const blob = await dbRepository.downloadFromCloud(filename);
        const text = await blob.text();
        const backupData = JSON.parse(text);

        if (!backupData || !backupData.data || backupData.version !== "1.0") {
            return res.status(400).json({ message: 'Invalid or corrupt backup file from cloud.' });
        }

        const collections = ['faculty', 'rooms', 'courses', 'batches', 'routine_schedule', 'settings'];
        
        const missingCollections = collections.filter(c => backupData.data[c] === undefined);
        if (missingCollections.length > 0) {
            return res.status(400).json({ message: `Missing collections in backup: ${missingCollections.join(', ')}` });
        }

        for (const collection of collections) {
            if (collection !== 'settings') {
                await dbRepository.clearCollection(collection);
            }
        }

        for (const collection of collections) {
            const data = backupData.data[collection];
            if (collection === 'settings') {
                let settingsData = data;
                // Backwards compatibility for legacy backups where settings was an array of rows
                if (Array.isArray(data)) {
                    const appSettingsRow = data.find(row => row.key === 'app_settings');
                    settingsData = appSettingsRow ? appSettingsRow.value : {};
                }
                await dbRepository.updateSettings(settingsData);
            } else if (Array.isArray(data) && data.length > 0) {
                await dbRepository.bulkCreate(collection, data);
            }
        }

        await logActivity(req.user.id, req.user.fullName || req.user.username, 'Cloud Restore', `Restored system from cloud backup: ${filename}`);

        res.json({ message: 'System restored successfully from cloud backup.' });

    } catch (error) {
        console.error("Error restoring from cloud backup:", error.message);
        res.status(500).json({ message: 'Failed to restore from cloud backup', error: error.message });
    }
};

export const deleteCloudBackup = async (req, res) => {
    try {
        const { filename } = req.params;
        await dbRepository.deleteFromCloud(filename);
        await logActivity(req.user.id, req.user.fullName || req.user.username, 'Delete Cloud Backup', `Deleted cloud backup: ${filename}`);
        res.status(200).json({ message: 'Cloud backup deleted successfully' });
    } catch (error) {
        console.error("Error deleting cloud backup:", error.message);
        res.status(500).json({ message: 'Failed to delete cloud backup', error: error.message });
    }
};
