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
                await dbRepository.updateSettings(data);
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
