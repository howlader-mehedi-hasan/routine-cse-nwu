import dbRepository from '../repositories/dbRepository.js';

export const createBugReport = async (req, res) => {
    try {
        const { title, description } = req.body;
        const userId = req.user?.id;

        if (!userId) {
            console.error('UserId missing from authenticated request:', req.user);
            return res.status(401).json({ success: false, message: 'User identification failed. Please re-login.' });
        }

        const newReport = await dbRepository.create('bug_reports', {
            user_id: userId,
            title,
            description,
            status: 'open'
        });

        res.status(201).json({ success: true, message: 'Bug report created', data: newReport });
    } catch (error) {
        console.error('Error creating bug report:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error: failed to initialize ticket',
            details: error.message 
        });
    }
};

export const getBugReports = async (req, res) => {
    try {
        const userId = req.user.id;
        const userRole = req.user.role;

        let reports = [];

        // Assuming Admins/Super Admins can see all.
        if (userRole === 'Admin' || userRole === 'Super Admin' || req.user.permissions?.includes('manage_bugs')) {
            // Get all reports, possibly with user details
            const { data, error } = await dbRepository.supabase
                .from('bug_reports')
                .select(`
                    *,
                    users!user_id ( full_name, role )
                `)
                .order('created_at', { ascending: false });
            
            if (error) throw error;
            reports = data;
        } else {
            // User can only see their own
            const { data, error } = await dbRepository.supabase
                .from('bug_reports')
                .select(`
                    *,
                    users!user_id ( full_name, role )
                `)
                .eq('user_id', userId)
                .order('created_at', { ascending: false });
            
            if (error) throw error;
            reports = data;
        }

        res.json({ success: true, data: reports });
    } catch (error) {
        console.error('Error fetching bug reports:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

export const updateBugReportStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        
        // Basic check if admin
        const userRole = req.user.role;
        if (userRole !== 'Admin' && userRole !== 'Super Admin' && !req.user.permissions?.includes('manage_bugs')) {
            return res.status(403).json({ success: false, message: 'Not authorized to update status' });
        }

        const updated = await dbRepository.update('bug_reports', id, { status, updated_at: new Date().toISOString() });
        res.json({ success: true, data: updated });
    } catch (error) {
        console.error('Error updating status:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

export const getMessages = async (req, res) => {
    try {
        const { reportId } = req.params;
        const userId = req.user.id;
        const userRole = req.user.role;

        // Verify access to this report
        const report = await dbRepository.getById('bug_reports', reportId);
        if (!report) return res.status(404).json({ success: false, message: 'Report not found' });

        if (report.user_id !== userId && userRole !== 'Admin' && userRole !== 'Super Admin' && !req.user.permissions?.includes('manage_bugs')) {
            return res.status(403).json({ success: false, message: 'Not authorized to view this report' });
        }

        const { data, error } = await dbRepository.supabase
            .from('bug_messages')
            .select(`
                *,
                users!sender_id ( full_name, role )
            `)
            .eq('bug_report_id', reportId)
            .order('created_at', { ascending: true });

        if (error) throw error;

        res.json({ success: true, data });
    } catch (error) {
        console.error('Error fetching messages:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Also handles file uploads via multer
export const addMessage = async (req, res) => {
    try {
        const { reportId } = req.params;
        const { message_content, message_type } = req.body;
        const userId = req.user.id;
        const userRole = req.user.role;

        // Verify access to this report
        const report = await dbRepository.getById('bug_reports', reportId);
        if (!report) return res.status(404).json({ success: false, message: 'Report not found' });

        if (report.user_id !== userId && userRole !== 'Admin' && userRole !== 'Super Admin' && !req.user.permissions?.includes('manage_bugs')) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        let contentToSave = message_content || '';
        let typeToSave = message_type || 'text';

        // Check if there's a file
        if (req.file) {
            const file = req.file;
            const ext = file.originalname.split('.').pop() || (typeToSave === 'voice' ? 'webm' : 'jpg');
            const path = `${reportId}/${Date.now()}_${userId}.${ext}`;
            
            await dbRepository.uploadMedia('bug_reports_media', path, file.buffer, file.mimetype);
            contentToSave = dbRepository.getMediaPublicUrl('bug_reports_media', path);
            typeToSave = file.mimetype.startsWith('audio') ? 'voice' : 'image';
        }

        const newMessage = await dbRepository.create('bug_messages', {
            bug_report_id: reportId,
            sender_id: userId,
            message_type: typeToSave,
            message_content: contentToSave
        });
        
        // Update the report's updated_at
        await dbRepository.update('bug_reports', reportId, { updated_at: new Date().toISOString() });

        res.status(201).json({ success: true, data: newMessage });
    } catch (error) {
        console.error('Error adding message:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
