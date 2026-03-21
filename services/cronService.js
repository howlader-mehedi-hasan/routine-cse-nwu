import cron from 'node-cron';
import dbRepository from '../repositories/dbRepository.js';
import { performCloudBackup } from '../controllers/backupController.js';
import { logActivity } from '../controllers/auditLogController.js';

let activeCronJob = null;

export const autoRestoreLatestBackup = async () => {
    try {
        console.log('[System] Checking for cloud wake-up auto-restore...');
        const files = await dbRepository.listCloudBackups();
        if (!files || files.length === 0) {
            console.log('[System] No cloud backups found for auto-restore.');
            return;
        }

        // Files are sorted by created_at desc, so index 0 is the latest
        const latestFile = files[0];
        console.log(`[System] Latest backup found: ${latestFile.name}. Restoring...`);

        const blob = await dbRepository.downloadFromCloud(latestFile.name);
        const text = await blob.text();
        const backupData = JSON.parse(text);

        if (!backupData || !backupData.data || backupData.version !== "1.0") {
            throw new Error('Invalid or corrupt backup file from cloud.');
        }

        const collections = ['faculty', 'rooms', 'courses', 'batches', 'routine_schedule', 'settings'];
        for (const collection of collections) {
            if (collection !== 'settings') {
                await dbRepository.clearCollection(collection);
            }
        }

        for (const collection of collections) {
            const data = backupData.data[collection];
            if (collection === 'settings') {
                await dbRepository.updateSettings(data);
            } else if (Array.isArray(data) && data.length > 0) {
                await dbRepository.bulkCreate(collection, data);
            }
        }

        await logActivity('system', 'SYSTEM', 'Cloud Wake-Up', `Auto-restored system from latest cloud backup: ${latestFile.name}`);
        console.log('[System] Cloud wake-up auto-restore completed successfully.');

    } catch (error) {
        console.error('[System] Error during cloud wake-up auto-restore:', error);
    }
};

export const initCronJobs = async () => {
    try {
        const settings = await dbRepository.getSettings();
        
        // Handle Auto-Restore on Startup
        if (settings?.auto_restore_on_startup) {
            await autoRestoreLatestBackup();
        }

        // Handle Scheduled Backups
        const schedule = settings?.backup_schedule || { enabled: false, time: '02:00' };
        
        if (activeCronJob) {
            activeCronJob.stop();
        }

        if (schedule.enabled) {
            // Parse time (e.g., '14:30')
            const [hours, minutes] = schedule.time.split(':');
            const cronExpression = `${minutes} ${hours} * * *`;
            
            console.log(`[System] Scheduling automated cloud backup at ${schedule.time} daily.`);
            
            activeCronJob = cron.schedule(cronExpression, async () => {
                console.log('[System] Running scheduled cloud backup...');
                try {
                    await performCloudBackup('system', 'SYSTEM', 'Automated Cloud Backup');
                    console.log('[System] Scheduled cloud backup completed successfully.');
                } catch (error) {
                    console.error('[System] Scheduled cloud backup failed:', error);
                }
            });
        }
    } catch (error) {
        console.error('[System] Failed to initialize cron jobs:', error);
    }
};
