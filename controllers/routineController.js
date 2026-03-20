import dbRepository from '../repositories/dbRepository.js';
import axios from 'axios'; 
import { logActivity } from './auditLogController.js';

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000/optimize';

// Helper to get human-readable names for IDs
const getEntryDetails = async (entry) => {
    const course = await dbRepository.findOne('courses', 'id', entry.course_id);
    const batch = await dbRepository.findOne('batches', 'id', entry.batch_id);
    const faculty = await dbRepository.findOne('faculty', 'id', entry.faculty_id);
    const room = entry.room_id ? await dbRepository.findOne('rooms', 'id', entry.room_id) : null;

    return {
        course: course ? `${course.name} (${course.code})` : 'Unknown Course',
        batch: batch ? `${batch.name} (Section ${batch.section})` : 'Unknown Batch',
        faculty: faculty ? faculty.name : 'Unknown Faculty',
        room: room ? `Room ${room.room_number}` : 'No Room'
    };
};

export const addRoutineEntry = async (req, res) => {
    try {
        const { day, time, batch_id, course_id, faculty_id, room_id } = req.body;

        if (!day || !time || !batch_id || !course_id || !faculty_id) {
            return res.status(400).json({ message: 'All fields are required except room' });
        }

        const newEntry = {
            id: Date.now().toString(),
            day,
            time,
            batch_id: parseInt(batch_id),
            course_id: parseInt(course_id),
            faculty_id: parseInt(faculty_id),
            room_id: room_id ? parseInt(room_id) : null
        };

        const created = await dbRepository.create('routine_schedule', newEntry);
        const details = await getEntryDetails(created);

        await logActivity(
            req.user?.id || 'System', 
            req.user?.fullName || req.user?.username || 'Guest', 
            'Add Routine Entry', 
            `Added ${details.course} for ${details.batch} by ${details.faculty} in ${details.room} at ${time} on ${day}.`
        );

        res.json({ message: 'Class added successfully', entry: created });

    } catch (error) {
        console.error("Error adding class:", error.message);
        res.status(500).json({ message: 'Failed to add class', error: error.message });
    }
};

export const updateRoutineEntry = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        const oldEntry = await dbRepository.getById('routine_schedule', id);
        if (!oldEntry) return res.status(404).json({ message: 'Class not found' });
        
        const oldDetails = await getEntryDetails(oldEntry);
        const oldTime = oldEntry.time;
        const oldDay = oldEntry.day;

        const parsedUpdates = { ...updates };
        if (updates.batch_id) parsedUpdates.batch_id = parseInt(updates.batch_id);
        if (updates.course_id) parsedUpdates.course_id = parseInt(updates.course_id);
        if (updates.faculty_id) parsedUpdates.faculty_id = parseInt(updates.faculty_id);
        if (updates.room_id) parsedUpdates.room_id = parseInt(updates.room_id);
        else if (updates.room_id === '' || updates.room_id === null) parsedUpdates.room_id = null;

        const updatedEntry = await dbRepository.update('routine_schedule', id, parsedUpdates);
        const newDetails = await getEntryDetails(updatedEntry);

        // Analyze changes
        const changes = [];
        if (oldEntry.course_id != updatedEntry.course_id) changes.push(`Course: ${oldDetails.course} -> ${newDetails.course}`);
        if (oldEntry.batch_id != updatedEntry.batch_id) changes.push(`Batch: ${oldDetails.batch} -> ${newDetails.batch}`);
        if (oldEntry.faculty_id != updatedEntry.faculty_id) changes.push(`Faculty: ${oldDetails.faculty} -> ${newDetails.faculty}`);
        if (oldEntry.room_id != updatedEntry.room_id) changes.push(`Room: ${oldDetails.room} -> ${newDetails.room}`);
        if (oldTime != updatedEntry.time) changes.push(`Time: ${oldTime} -> ${updatedEntry.time}`);
        if (oldDay != updatedEntry.day) changes.push(`Day: ${oldDay} -> ${updatedEntry.day}`);

        const changeSummary = changes.length > 0 ? changes.join(', ') : 'No data changes detected (meta-update only).';

        await logActivity(
            req.user.id, 
            req.user.fullName || req.user.username, 
            'Update Routine Entry', 
            `Updated entry ${id}: ${changeSummary}`
        );

        res.json({ message: 'Class updated successfully', entry: updatedEntry });
    } catch (error) {
        console.error("Error updating class:", error.message);
        res.status(500).json({ message: 'Failed to update class', error: error.message });
    }
};

export const deleteRoutineEntry = async (req, res) => {
    try {
        const { id } = req.params;
        const entryToDelete = await dbRepository.getById('routine_schedule', id);
        if (!entryToDelete) return res.status(404).json({ message: 'Class not found' });

        const details = await getEntryDetails(entryToDelete);
        const success = await dbRepository.delete('routine_schedule', id);

        if (!success) {
            return res.status(404).json({ message: 'Class not found' });
        }

        await logActivity(
            req.user.id, 
            req.user.fullName || req.user.username, 
            'Delete Routine Entry', 
            `Deleted ${details.course} for ${details.batch} by ${details.faculty} at ${entryToDelete.time} on ${entryToDelete.day}.`
        );

        res.json({ message: 'Class deleted successfully' });
    } catch (error) {
        console.error("Error deleting class:", error.message);
        res.status(500).json({ message: 'Failed to delete class', error: error.message });
    }
};

export const getRoutine = async (req, res) => {
    try {
        const routine = await dbRepository.getAll('routine_schedule');
        res.json(routine);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const clearRoutine = async (req, res) => {
    try {
        await dbRepository.clearCollection('routine_schedule');
        
        await logActivity(req.user.id, req.user.fullName || req.user.username, 'Clear Routine', `Cleared all routine entries.`);

        res.json({ message: 'Routine cleared successfully' });
    } catch (error) {
        console.error("Error clearing routine:", error.message);
        res.status(500).json({ message: 'Failed to clear routine', error: error.message });
    }
};

export const exportRoutine = async (req, res) => {
    try {
        const routine = await dbRepository.getAll('routine_schedule');

        // Define filename for download
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `routine_backup_${timestamp}.json`;

        res.setHeader('Content-disposition', `attachment; filename=${filename}`);
        res.setHeader('Content-type', 'application/json');
        res.status(200).send(JSON.stringify(routine, null, 2));

    } catch (error) {
        console.error("Error exporting routine:", error.message);
        res.status(500).json({ message: 'Failed to export routine', error: error.message });
    }
};

export const importRoutine = async (req, res) => {
    try {
        const routineData = req.body;

        if (!Array.isArray(routineData)) {
            return res.status(400).json({ message: 'Invalid format. Expected an array of routine entries.' });
        }

        // Validate basic structure
        const isValid = routineData.every(entry =>
            entry.id && entry.day && entry.time && typeof entry.batch_id === 'number'
        );

        if (!isValid) {
            return res.status(400).json({ message: 'Invalid data structure in backup file.' });
        }

        await dbRepository.clearCollection('routine_schedule');
        await dbRepository.bulkCreate('routine_schedule', routineData);

        await logActivity(req.user.id, req.user.fullName || req.user.username, 'Import Routine', `Imported ${routineData.length} routine entries from backup.`);

        res.json({ message: 'Routine logic restored successfully.', count: routineData.length });

    } catch (error) {
        console.error("Error importing routine:", error.message);
        res.status(500).json({ message: 'Failed to import routine', error: error.message });
    }
};
