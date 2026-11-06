/**
 * Production Hardened Health Check & Keepalive Router
 * 
 * Purpose:
 * - Responds to authenticated keepalive/health requests from Vercel Cron or external schedulers.
 * - Performs a lightweight, legitimate database query against Supabase to reset PostgreSQL inactivity timer.
 * - Enforces Bearer token authentication via CRON_SECRET.
 * - Idempotent, safe, and read-only (zero writes, zero schema alterations).
 */

import express from 'express';
import dbRepository from '../repositories/dbRepository.js';

export const handleHealth = async (req, res, supabase = dbRepository.supabase) => {
    // Enforce HTTP methods
    if (req.method !== 'GET' && req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // 1. Authenticate with CRON_SECRET
    const authHeader = req.headers['authorization'];
    const expectedSecret = process.env.CRON_SECRET;

    if (!expectedSecret) {
        console.error('[Health] CRON_SECRET is not configured in environment variables');
        return res.status(500).json({ error: 'Server configuration error: CRON_SECRET is missing' });
    }

    if (!authHeader || authHeader !== `Bearer ${expectedSecret}`) {
        return res.status(401).json({ error: 'Unauthorized: Invalid or missing authorization token' });
    }

    // 2. Perform lightweight, legitimate Supabase read query
    const startTime = Date.now();
    try {
        const { data, error } = await supabase
            .from('settings')
            .select('id')
            .limit(1);

        const latencyMs = Date.now() - startTime;

        if (error) {
            console.error('[Health] Supabase query failed:', error.message);
            return res.status(502).json({
                status: 'unhealthy',
                database: 'Supabase Postgres',
                latencyMs,
                error: error.message,
                timestamp: new Date().toISOString()
            });
        }

        console.log(`[Health] Supabase ping succeeded (${latencyMs}ms)`);
        return res.status(200).json({
            status: 'healthy',
            database: 'Supabase Postgres',
            latencyMs,
            timestamp: new Date().toISOString()
        });
    } catch (err) {
        const latencyMs = Date.now() - startTime;
        console.error('[Health] Unexpected error during database check:', err.message);
        return res.status(500).json({
            status: 'error',
            latencyMs,
            error: err.message,
            timestamp: new Date().toISOString()
        });
    }
};

const router = express.Router();
router.get('/', (req, res) => handleHealth(req, res));
router.post('/', (req, res) => handleHealth(req, res));

export default router;
