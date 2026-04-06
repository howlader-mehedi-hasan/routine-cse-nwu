import dbRepository from '../repositories/dbRepository.js';
import { logActivity } from './auditLogController.js';

export const getStudents = async (req, res) => {
    try {
        const students = await dbRepository.getAll('student_management');
        res.json(students || []);
    } catch (error) {
        console.error("Error fetching students:", error);
        res.status(500).json({ message: 'Server error' });
    }
};
export const updateStudent = async (req, res) => {
    try {
        const id = req.params.id;
        const updates = req.body;
        const updated = await dbRepository.update('student_management', id, updates);
        
        if (updated) {
            // Sync back to users table if linked
            if (updated.user_id) {
                const userUpdates = {
                    full_name: updated.name,
                    email: updated.email,
                    mobile_number: updated.phone,
                    student_id: updated.student_id,
                    role: updated.account_type
                };
                
                // Remove undefined/null if we don't want to overwrite with empty
                Object.keys(userUpdates).forEach(key => (userUpdates[key] === undefined || userUpdates[key] === null) && delete userUpdates[key]);
                
                await dbRepository.update('users', updated.user_id, userUpdates);
            }
            
            await logActivity(
                req.user.id, 
                req.user.fullName || req.user.username, 
                'Update Student', 
                `Updated student contact: ${updated.name} (${updated.student_id}).`
            );
            
            res.json(updated);
        } else {
            res.status(404).json({ message: 'Student not found' });
        }
    } catch (error) {
        console.error("Error updating student:", error);
        res.status(500).json({ message: 'Server error' });
    }
};

export const createStudent = async (req, res) => {
    try {
        const { name, student_id, email, phone, batch, section, account_type } = req.body;
        if (!name || !student_id) {
            return res.status(400).json({ message: 'Name and Student ID are required' });
        }

        const newStudent = {
            id: Date.now(),
            name,
            student_id,
            email: email || '',
            phone: phone || '',
            batch: batch || '',
            section: section || '',
            account_type: account_type || 'Student'
        };

        const created = await dbRepository.create('student_management', newStudent);
        
        await logActivity(
            req.user.id, 
            req.user.fullName || req.user.username, 
            'Create Student', 
            `Added new student contact: ${created.name} (${created.student_id}).`
        );

        res.status(201).json(created);
    } catch (error) {
        console.error("Error creating student:", error);
        res.status(500).json({ message: 'Server error' });
    }
};

export const deleteStudent = async (req, res) => {
    try {
        const id = req.params.id;
        const deleted = await dbRepository.delete('student_management', id);
        if (deleted) {
            await logActivity(
                req.user.id, 
                req.user.fullName || req.user.username, 
                'Delete Student', 
                `Deleted student contact ID: ${id}.`
            );
            res.json({ message: 'Student deleted successfully' });
        } else {
            res.status(404).json({ message: 'Student not found' });
        }
    } catch (error) {
        console.error("Error deleting student:", error);
        res.status(500).json({ message: 'Server error' });
    }
};
