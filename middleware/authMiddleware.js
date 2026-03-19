import jwt from 'jsonwebtoken';
import dbRepository from '../repositories/dbRepository.js';

const JWT_SECRET = process.env.JWT_SECRET || 'nwu-routine-secret-key-super-secure';

export const protect = async (req, res, next) => {
    try {
        let token;
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        } else if (req.cookies?.token) { // If using cookies instead
            token = req.cookies.token;
        }

        if (!token) {
            return res.status(401).json({ message: 'Not authorized to access this route' });
        }

        const decoded = jwt.verify(token, JWT_SECRET);
        
        // Fetch fresh user to ensure we have fullName and other details
        const user = await dbRepository.getById('users', decoded.id);
        
        if (!user) {
            return res.status(401).json({ message: 'User no longer exists' });
        }

        const { password: _, encryptedPassword: __, ...userWithoutPass } = user;
        req.user = userWithoutPass;
        next();
    } catch (error) {
        return res.status(401).json({ message: 'Not authorized to access this route' });
    }
};

export const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({ message: `User role ${req.user?.role} is not authorized to access this route` });
        }
        next();
    }
};

export const requirePermission = (requiredPermission) => {
    return async (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ message: 'Not authorized' });
        }
        
        // Super Admin and Admin have all permissions implicitly
        if (req.user.role === 'Super Admin' || req.user.role === 'Admin') {
            return next();
        }

        // Fetch the fresh user to avoid token staleness for permissions:
        const currentUser = await dbRepository.getById('users', req.user.id);

        if (!currentUser) {
            return res.status(401).json({ message: 'User no longer exists' });
        }

        const userPermissions = currentUser.permissions || [];
        
        if (Array.isArray(requiredPermission)) {
            const hasAny = requiredPermission.some(p => userPermissions.includes(p));
            if (!hasAny) {
                return res.status(403).json({ message: `Requires one of: ${requiredPermission.join(', ')}` });
            }
        } else {
            if (!userPermissions.includes(requiredPermission)) {
                return res.status(403).json({ message: `Requires '${requiredPermission}' permission.` });
            }
        }

        next();
    };
};
