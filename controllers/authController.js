import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import dbRepository from '../repositories/dbRepository.js';
import { encryptText, decryptText } from '../utils/encryption.js';
import { logActivity } from './auditLogController.js';

const JWT_SECRET = process.env.JWT_SECRET || 'nwu-routine-secret-key-super-secure';

// Helper to map Supabase user to frontend user
const mapUser = (user) => {
    if (!user) return null;
    return {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        status: user.status,
        permissions: user.permissions || [],
        fullName: user.full_name,
        mobileNumber: user.mobile_number,
        studentId: user.student_id,
        section: user.section,
        facultyId: user.faculty_id,
        createdAt: user.created_at,
        updatedAt: user.updated_at
    };
};

// Helper to map frontend data to Supabase columns
const mapToSupabase = (data) => {
    const mapped = {
        username: data.username,
        email: data.email,
        password: data.password,
        role: data.role,
        status: data.status,
        permissions: data.permissions,
        full_name: data.fullName,
        mobile_number: data.mobileNumber,
        student_id: data.studentId,
        section: data.section,
        faculty_id: data.facultyId !== undefined ? (data.facultyId && data.facultyId !== '' ? parseInt(data.facultyId) : null) : undefined,
        encrypted_password: data.encryptedPassword
    };
    // Remove undefined
    Object.keys(mapped).forEach(key => mapped[key] === undefined && delete mapped[key]);
    return mapped;
};

export const register = async (req, res) => {
    try {
        const { username, email, password, role, fullName, mobileNumber, section, facultyId, studentId, batchName, sectionName } = req.body;
        
        if (!username || !password || !fullName || !mobileNumber || !email) {
            return res.status(400).json({ message: 'Full Name, Mobile Number, Email, Username, and Password are required' });
        }

        const existingUser = await dbRepository.findOne('users', 'username', username);
        const existingEmail = email ? await dbRepository.findOne('users', 'email', email) : null;

        if (existingUser || existingEmail) {
            return res.status(400).json({ message: 'Username or Email already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const encryptedPassword = encryptText(password);

        // Validate Requested Role against Settings
        const settings = await dbRepository.getSettings();
        const allowedRoles = settings?.general?.registration_roles || ['Student', 'Faculty', 'CR/ACR'];
        
        let requestedRole = role || 'Student';
        if (!allowedRoles.includes(requestedRole)) {
            requestedRole = allowedRoles.length > 0 ? allowedRoles[0] : 'Student';
        }

        const users = await dbRepository.getAll('users');
        const isFirstUser = Array.isArray(users) && users.length === 0;
        const actualRole = isFirstUser ? 'Super Admin' : requestedRole;
        const status = isFirstUser ? 'approved' : 'pending';

        const newUser = {
            id: Date.now(), // Store as number for bigint column
            username,
            email: email && email.trim() !== '' ? email : null, // Treat empty string as null for unique constraint
            password: hashedPassword,
            encrypted_password: encryptedPassword,
            role: actualRole,
            status: status,
            permissions: [],
            full_name: fullName || '',
            mobile_number: mobileNumber || '',
            student_id: studentId || '',
            section: section || '',
            faculty_id: facultyId || null
        };

        const created = await dbRepository.create('users', newUser);

        if (!created) {
            return res.status(500).json({ message: 'Failed to create user account' });
        }

        if (['Student', 'CR/ACR'].includes(actualRole) && studentId) {
            await dbRepository.create('student_management', {
                student_id: studentId,
                name: fullName || '',
                email: email && email.trim() !== '' ? email : null,
                phone: mobileNumber || '',
                batch: batchName || '',
                section: sectionName || '',
                account_type: actualRole
            });
        }

        if (status === 'pending') {
            await logActivity('Guest', username, 'Registration Request', `User ${username} requested to create an account as ${requestedRole}.`);
            return res.status(201).json({ message: 'Registration successful. Waiting for Super Admin approval.', status: 'pending' });
        }

        const token = jwt.sign({ id: created.id, role: created.role, status: created.status }, JWT_SECRET, { expiresIn: '24h' });
        res.status(201).json({ token, user: mapUser(created) });

    } catch (error) {
        console.error("Registration Error:", error.message);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

export const login = async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await dbRepository.findOne('users', 'username', username);
        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        if (user.status !== 'approved') {
            return res.status(403).json({ message: `Account is ${user.status}. Please wait for Super Admin approval.` });
        }

        const token = jwt.sign({ id: user.id, role: user.role, status: user.status }, JWT_SECRET, { expiresIn: '24h' });
        
        await logActivity(user.id, user.full_name || user.username, 'Login', `User ${user.username} logged in.`);

        res.json({ token, user: mapUser(user) });
    } catch (error) {
        console.error("Login Error:", error.message);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

export const getMe = async (req, res) => {
    try {
        const user = await dbRepository.getById('users', req.user.id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        res.json(mapUser(user));
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

export const getAllUsers = async (req, res) => {
    try {
        const users = await dbRepository.getAll('users');
        
        const safeUsers = users.map(user => {
            const mapped = mapUser(user);
            if (req.user && req.user.role === 'Super Admin') {
                mapped.plainPassword = decryptText(user.encrypted_password) || 'Unrecoverable (Legacy)';
            }
            return mapped;
        });

        if (req.user && req.user.role !== 'Super Admin') {
            return res.json(safeUsers.filter(u => u.role !== 'Super Admin'));
        }

        res.json(safeUsers);
    } catch (error) {
        console.error("GetAllUsers Error:", error.message);
        res.status(500).json({ message: 'Server error' });
    }
};

export const updateUserStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, role } = req.body;

        const user = await dbRepository.getById('users', id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        if (req.user && String(req.user.role) !== 'Super Admin') {
            if (String(user.role) === 'Super Admin') {
                return res.status(403).json({ message: 'Cannot modify a Super Admin' });
            }
            if (String(role) === 'Super Admin') {
                return res.status(403).json({ message: 'Cannot assign Super Admin role' });
            }
        }

        const updates = {};
        if (status) updates.status = status;
        if (role) updates.role = role;

        const updated = await dbRepository.update('users', id, updates);
        
        if (updated) {
            const action = status ? `Status Update: ${status}` : `Role Update: ${role}`;
            await logActivity(
                req.user.id, 
                req.user.fullName || req.user.username, 
                'User Management', 
                `Updated user ${updated.username} (${updated.full_name}): ${action}.`
            );
        }

        res.json(mapUser(updated));
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

export const createUser = async (req, res) => {
    try {
        const { username, email, password, role, fullName, mobileNumber, section, facultyId, studentId, batchName, sectionName } = req.body;
        
        if (!username || !password) {
            return res.status(400).json({ message: 'Username and password are required' });
        }

        const existingUser = await dbRepository.findOne('users', 'username', username);
        const existingEmail = email ? await dbRepository.findOne('users', 'email', email) : null;

        if (existingUser || existingEmail) {
            return res.status(400).json({ message: 'Username or Email already exists' });
        }

        if (req.user && req.user.role !== 'Super Admin' && role === 'Super Admin') {
            return res.status(403).json({ message: 'Only Super Admins can create Super Admins' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const encryptedPassword = encryptText(password);

        const newUser = {
            id: Date.now(), // Store as number for bigint column
            username,
            email: email && email.trim() !== '' ? email : null, // Treat empty string as null for unique constraint
            password: hashedPassword,
            encrypted_password: encryptedPassword,
            role: role || 'Student',
            status: 'approved',
            permissions: req.body.permissions || [],
            full_name: fullName || '',
            mobile_number: mobileNumber || '',
            student_id: studentId || '',
            section: section || '',
            faculty_id: facultyId || null
        };

        const created = await dbRepository.create('users', newUser);
        
        if (!created) {
            return res.status(500).json({ message: 'Failed to create user account' });
        }

        if (['Student', 'CR/ACR'].includes(created.role) && studentId) {
            await dbRepository.create('student_management', {
                student_id: studentId,
                name: fullName || '',
                email: email && email.trim() !== '' ? email : null,
                phone: mobileNumber || '',
                batch: batchName || '',
                section: sectionName || '',
                account_type: created.role
            });
        }

        await logActivity(req.user.id, req.user.fullName || req.user.username, 'User Created', `Created new user ${created.username} with role ${created.role}.`);

        res.status(201).json(mapUser(created));
    } catch (error) {
        console.error("CreateUser Error:", error.message);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

export const updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        let data = req.body;
        
        const user = await dbRepository.getById('users', id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        if (req.user && String(req.user.role) !== 'Super Admin' && String(req.user.id) !== String(id)) {
            if (req.user.role !== 'Admin' && (!req.user.permissions || !req.user.permissions.includes('assign_permissions'))) {
                return res.status(403).json({ message: 'You can only edit your own profile' });
            }
        }

        if (req.user && String(req.user.role) !== 'Super Admin') {
            if (String(user.role) === 'Super Admin' && String(req.user.id) !== String(id)) {
                return res.status(403).json({ message: 'Cannot modify a Super Admin' });
            }
            if (String(data.role) === 'Super Admin') {
                return res.status(403).json({ message: 'Cannot assign Super Admin role' });
            }
        }

        const isSelfEdit = (req.user && String(req.user.id) === String(id));
        const isAdminEdit = (req.user && (String(req.user.role) === 'Super Admin' || String(req.user.role) === 'Admin' || (req.user.permissions && req.user.permissions.includes('assign_permissions'))));

        if (isSelfEdit && !isAdminEdit) {
            // Allow self-switching between Student, Moderator, and Faculty, otherwise delete role
            if (data.role && !['Student', 'Faculty', 'Moderator'].includes(data.role)) {
                delete data.role;
            }
            delete data.status;
            delete data.permissions;
            
            // Student ID is immutable for self-update (except for Admins)
            delete data.studentId;
        } else if (!isSelfEdit && isAdminEdit) {
            // Admin/Super Admin editing someone else
            if (req.user.role !== 'Super Admin') {
                delete data.role; // Only Super Admin can modify someone else's role
            }
        }

        // Check conflicts
        if (data.username || (data.email !== undefined)) {
            if (data.username) {
                const existing = await dbRepository.findOne('users', 'username', data.username);
                if (existing && String(existing.id) !== String(id)) return res.status(400).json({ message: 'Username already in use' });
            }
            if (data.email !== undefined) {
                // Treat empty string as null
                data.email = data.email && data.email.trim() !== '' ? data.email : null;
                if (data.email) {
                    const existing = await dbRepository.findOne('users', 'email', data.email);
                    if (existing && String(existing.id) !== String(id)) return res.status(400).json({ message: 'Email already in use' });
                }
            }
        }

        const mappedUpdates = mapToSupabase(data);
        const updated = await dbRepository.update('users', id, mappedUpdates);
        
        if (updated) {
            const isSelf = String(req.user.id) === String(id);
            await logActivity(
                req.user.id, 
                req.user.fullName || req.user.username, 
                'Profile Update', 
                `${isSelf ? 'Updated own profile' : `Updated profile for ${updated.username}`}.`
            );
        }
        
        // Sync to student_management if the user is a student/cr/acr
        if (updated && ['Student', 'CR/ACR'].includes(updated.role)) {
            let studentEntry = await dbRepository.findOne('student_management', 'user_id', updated.id);
            
            // If not found by user_id, try by student_id as fallback (legacy)
            if (!studentEntry && updated.student_id) {
                studentEntry = await dbRepository.findOne('student_management', 'student_id', updated.student_id);
                // If found by student_id, update its user_id for future sync
                if (studentEntry) {
                    await dbRepository.update('student_management', studentEntry.id, { user_id: updated.id });
                }
            }

            const studentData = {
                user_id: updated.id,
                student_id: updated.student_id,
                name: updated.full_name,
                email: updated.email,
                phone: updated.mobile_number,
                account_type: updated.role
            };
            
            // Resolve batch/section names
            if (updated.section) {
                const batch = await dbRepository.getById('batches', updated.section);
                if (batch) {
                    studentData.batch = batch.name;
                    studentData.section = batch.section;
                }
            }

            if (studentEntry) {
                await dbRepository.update('student_management', studentEntry.id, studentData);
            } else {
                // Create entry if it doesn't exist
                await dbRepository.create('student_management', studentData);
            }
        }

        res.json(mapUser(updated));
    } catch (error) {
        console.error("UpdateUser Error:", error.message);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

export const changeUserPassword = async (req, res) => {
    try {
        const { id } = req.params;
        const { password } = req.body;

        if (!password || password.length < 6) {
            return res.status(400).json({ message: 'Password must be at least 6 characters long' });
        }

        if (req.user && String(req.user.role) !== 'Super Admin' && String(req.user.id) !== String(id)) {
            return res.status(403).json({ message: 'You can only change your own password' });
        }

        const user = await dbRepository.getById('users', id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        const hashedPassword = await bcrypt.hash(password, 10);
        const encryptedPassword = encryptText(password);
        
        await dbRepository.update('users', id, { 
            password: hashedPassword, 
            encrypted_password: encryptedPassword 
        });

        await logActivity(
            req.user.id, 
            req.user.fullName || req.user.username, 
            'Password Change', 
            `${String(req.user.id) === String(id) ? 'Changed own password' : `Changed password for user ${user.username}`}.`
        );

        res.json({ message: 'Password updated successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

export const requestNameChange = async (req, res) => {
    try {
        const { id } = req.params;
        const { requestedName } = req.body;
        if (req.user && String(req.user.role) !== 'Super Admin' && String(req.user.id) !== String(id)) {
            return res.status(403).json({ message: 'You can only request your own name change' });
        }
        if (!requestedName || requestedName.trim() === '') {
            return res.status(400).json({ message: 'Name cannot be empty' });
        }
        
        const updated = await dbRepository.update('users', id, { pending_full_name: requestedName });
        if (!updated) return res.status(404).json({ message: 'User not found' });

        res.json({ message: 'Name change requested successfully', user: mapUser(updated) });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

export const resolveNameChange = async (req, res) => {
    try {
        const { id } = req.params;
        const { action } = req.body; // 'approve' or 'reject'
        
        const user = await dbRepository.getById('users', id);
        if (!user) return res.status(404).json({ message: 'User not found' });
        
        const updates = { pending_full_name: null };
        if (action === 'approve') {
            updates.full_name = user.pending_full_name;
        }
        
        await dbRepository.update('users', id, updates);

        await logActivity(
            req.user.id, 
            req.user.fullName || req.user.username, 
            'Name Change Resolution', 
            `${action === 'approve' ? 'Approved' : 'Rejected'} name change request for user ${user.username} (Requested: ${user.pending_full_name}).`
        );

        res.json({ message: `Name change ${action}d successfully` });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

export const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await dbRepository.getById('users', id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        if (user.role === 'Super Admin') {
            return res.status(403).json({ message: 'Cannot delete a Super Admin account' });
        }

        if (req.user.role !== 'Super Admin' && req.user.role !== 'Admin') {
            return res.status(403).json({ message: 'Permission denied. Only Admins can delete users.' });
        }

        const username = user.username;
        await dbRepository.delete('users', id);

        await logActivity(req.user.id, req.user.full_name || req.user.username, 'User Deleted', `Deleted user ${username}.`);

        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

export const bulkDeleteUsers = async (req, res) => {
    try {
        const { ids } = req.body;
        if (!ids || !Array.isArray(ids)) {
            return res.status(400).json({ message: 'Required array of IDs for bulk deletion' });
        }

        const users = await dbRepository.getAll('users');
        
        const safeIds = ids.filter(id => {
            const user = users.find(u => String(u.id) === String(id));
            return user && user.role !== 'Super Admin';
        });

        if (safeIds.length === 0 && ids.length > 0) {
            return res.status(403).json({ message: 'No deletable users found in selection (Super Admins are protected)' });
        }

        if (req.user.role !== 'Super Admin' && req.user.role !== 'Admin') {
            return res.status(403).json({ message: 'Permission denied. Only Admins can delete users.' });
        }

        for (const id of safeIds) {
            await dbRepository.delete('users', id);
        }

        await logActivity(req.user.id, req.user.full_name || req.user.username, 'Bulk User Deletion', `Deleted ${safeIds.length} users.`);

        res.json({ message: `Successfully deleted ${safeIds.length} users.`, deletedCount: safeIds.length });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

