import dbRepository from '../repositories/dbRepository.js';

export const getAuditLogs = async (req, res) => {
    try {
        const logs = await dbRepository.getAll('audit_logs');
        
        // Map Supabase snake_case back to frontend camelCase
        const mappedLogs = logs.map(log => ({
            id: log.id,
            userId: log.user_id,
            fullName: log.full_name,
            activityType: log.activity_type,
            details: typeof log.details === 'object' ? JSON.stringify(log.details) : log.details,
            timestamp: log.timestamp
        }));

        // Filter logs: Only Super Admins can see 'Bulk Delete' activities
        const finalLogs = req.user.role === 'Super Admin' 
            ? mappedLogs 
            : mappedLogs.filter(log => log.activityType !== 'Bulk Delete');

        // Sort by timestamp descending (newest first)
        const sortedLogs = [...finalLogs].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        res.json(sortedLogs);
    } catch (error) {
        console.error("Error fetching audit logs:", error.message);
        res.status(500).json({ message: 'Failed to fetch audit logs' });
    }
};

export const updateAuditLog = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        
        // Map frontend camelCase to Supabase snake_case
        const mappedUpdates = {
            user_id: updates.userId,
            full_name: updates.fullName,
            activity_type: updates.activityType,
            details: updates.details,
            timestamp: updates.timestamp
        };
        
        // Remove undefined values
        Object.keys(mappedUpdates).forEach(key => mappedUpdates[key] === undefined && delete mappedUpdates[key]);

        const updatedLog = await dbRepository.update('audit_logs', id, mappedUpdates);
        
        if (!updatedLog) {
            return res.status(404).json({ message: 'Audit log not found' });
        }
        
        // Map back to camelCase for response
        const responseLog = {
            id: updatedLog.id,
            userId: updatedLog.user_id,
            fullName: updatedLog.full_name,
            activityType: updatedLog.activity_type,
            details: updatedLog.details,
            timestamp: updatedLog.timestamp
        };
        
        res.json(responseLog);
    } catch (error) {
        console.error("Error updating audit log:", error.message);
        res.status(500).json({ message: 'Failed to update audit log' });
    }
};

export const deleteMultipleAuditLogs = async (req, res) => {
    try {
        const { ids } = req.body;
        
        if (!Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ message: 'No IDs provided for deletion' });
        }
        
        // Delete log entries in bulk
        await dbRepository.bulkDelete('audit_logs', ids);
        
        // Log the bulk deletion activity
        await logActivity(
            req.user.id,
            req.user.fullName || req.user.username,
            'Bulk Delete',
            `Deleted ${ids.length} activity log entries`
        );
        
        res.json({ message: `Successfully deleted ${ids.length} logs` });
    } catch (error) {
        console.error("Error bulk deleting audit logs:", error.message);
        res.status(500).json({ message: 'Failed to bulk delete audit logs' });
    }
};

// Helper for internal use in other controllers
export const logActivity = async (userId, fullName, activityType, details) => {
    try {
        const newLog = {
            user_id: userId === 'System' || userId === 'Guest' ? null : userId,
            full_name: fullName,
            activity_type: activityType,
            details: details,
            timestamp: new Date().toISOString()
        };
        await dbRepository.create('audit_logs', newLog);
    } catch (error) {
        console.error("Logging Error:", error.message);
    }
};
