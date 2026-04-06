import dbRepository from '../repositories/dbRepository.js';

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
            res.json(updated);
        } else {
            res.status(404).json({ message: 'Student not found' });
        }
    } catch (error) {
        console.error("Error updating student:", error);
        res.status(500).json({ message: 'Server error' });
    }
};
