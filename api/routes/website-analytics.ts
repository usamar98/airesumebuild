/*
// Website analytics functionality temporarily disabled to focus on core features
// This file contains website analytics routes that are not part of the core features:
// - AI Assistant 
// - Resume Builder 
// - Resume Analyzer 
// - Upwork Proposal 
// - AI Chat
// - Templates

import { Router, type Request, type Response } from 'express';

const router = Router();

// Placeholder route to prevent import errors
router.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'Website analytics temporarily disabled' });
});

export default router;
*/

// Temporary placeholder to prevent import errors
import { Router } from 'express';
const router = Router();
router.get('/health', (req, res) => res.json({ status: 'disabled' }));
export default router;