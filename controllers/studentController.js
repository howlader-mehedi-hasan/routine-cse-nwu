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
