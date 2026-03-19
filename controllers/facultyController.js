import dbRepository from '../repositories/dbRepository.js';
import { logActivity } from './auditLogController.js';

const COLLECTION = 'faculty';

export const getAll = async (req, res) => {
    try {
        const data = await dbRepository.getAll(COLLECTION);
        res.json(data);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

export const getById = async (req, res) => {
    try {
        const id = req.params.id;
        const item = await dbRepository.getById(COLLECTION, id);
        if (item) {
            res.json(item);
        } else {
            res.status(404).json({ message: 'Faculty not found' });
        }
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

export const create = async (req, res) => {
    try {
        const newItem = req.body;
        // Basic validation
        if (!newItem.name) {
            return res.status(400).json({ message: 'Name is required' });
        }
        const created = await dbRepository.create(COLLECTION, newItem);
        
        logActivity(req.user.id, req.user.username, 'Create Faculty', `Created new faculty: ${newItem.name}.`);

        res.status(201).json(created);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

export const update = async (req, res) => {
    try {
        const id = req.params.id;
        const updates = req.body;
        const updated = await dbRepository.update(COLLECTION, id, updates);
        if (updated) {
            logActivity(req.user.id, req.user.username, 'Update Faculty', `Updated faculty: ${updated.name} (ID: ${id}).`);
            res.json(updated);
        } else {
            res.status(404).json({ message: 'Faculty not found' });
        }
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

export const remove = async (req, res) => {
    try {
        const id = req.params.id;
        const success = await dbRepository.delete(COLLECTION, id);
        if (success) {
            logActivity(req.user.id, req.user.username, 'Delete Faculty', `Deleted faculty ID: ${id}.`);
            res.json({ message: 'Deleted successfully' });
        } else {
            res.status(404).json({ message: 'Faculty not found' });
        }
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
