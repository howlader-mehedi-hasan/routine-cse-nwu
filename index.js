import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import dbRepository from './repositories/dbRepository.js';
import { initCronJobs } from './services/cronService.js';

import authRoutes from './routes/authRoutes.js';
import facultyRoutes from './routes/facultyRoutes.js';
import courseRoutes from './routes/courseRoutes.js';
import roomRoutes from './routes/roomRoutes.js';
import batchRoutes from './routes/batchRoutes.js';
import routineRoutes from './routes/routineRoutes.js';
import settingsRoutes from './routes/settingsRoutes.js';
import auditLogRoutes from './routes/auditLogRoutes.js';
import backupRoutes from './routes/backupRoutes.js';

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/faculty', facultyRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/batches', batchRoutes);
app.use('/api/routine', routineRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/audit-logs', auditLogRoutes);
app.use('/api/backup', backupRoutes);

// Basic Route
app.get('/', (req, res) => {
    res.send('Smart Routine API is running');
});

// Start Server
if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
        initCronJobs(); // Initialize scheduled cloud backups and auto-restore
    });
}

export default app;
// Trigger nodemon config reload
