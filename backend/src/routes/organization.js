import { Router } from 'express';
import multer from 'multer';
import { pool } from '../db.js';
import { authenticate, requirePermission } from '../middleware/auth.js';
import { wrap } from '../utils/asyncHandler.js';
import { imageType, saveImage, removeImage } from '../utils/uploads.js';

const router = Router();

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 2 * 1024 * 1024 }, // 2 MB
}).single('logo');

function handleUpload(req, res, next) {
    upload(req, res, (err) => {
        if (err) {
            if (err.code === 'LIMIT_FILE_SIZE') {
                return res.status(422).json({ message: 'Logo image must be 2 MB or smaller' });
            }
            return res.status(422).json({ message: 'Error processing uploaded logo file' });
        }
        next();
    });
}

// GET /api/organization - Fetch current organization details
router.get('/', authenticate, wrap(async (_req, res) => {
    const [rows] = await pool.query('SELECT * FROM organization_details ORDER BY id ASC LIMIT 1');
    res.json({ organization: rows[0] || null });
}));

// POST /api/organization - Add for first time or update existing details
router.post(
    '/',
    authenticate,
    requirePermission('user.manage'),
    handleUpload,
    wrap(async (req, res) => {
        const {
            companyname,
            province,
            district,
            munvdc,
            wardno,
            tole,
            contactno,
            panno,
            registrationdate,
            email,
            remove_logo,
        } = req.body || {};

        if (!companyname || !companyname.trim()) {
            return res.status(422).json({ message: 'Company name is required' });
        }

        // Check existing record
        const [existing] = await pool.query('SELECT * FROM organization_details ORDER BY id ASC LIMIT 1');
        const current = existing[0] || null;

        let logoFilename = current ? current.logo : null;

        if (req.file) {
            const type = imageType(req.file.buffer);
            if (!type) {
                return res.status(422).json({ message: 'Only JPG and PNG images are supported for logo' });
            }
            if (current?.logo) {
                await removeImage('logo', current.logo);
            }
            logoFilename = await saveImage('logo', 'org-logo', req.file.buffer);
        } else if (remove_logo === 'true' || remove_logo === true) {
            if (current?.logo) {
                await removeImage('logo', current.logo);
            }
            logoFilename = null;
        }

        const cleanField = (val) => (typeof val === 'string' ? val.trim() : null);

        const data = [
            companyname.trim(),
            cleanField(province),
            cleanField(district),
            cleanField(munvdc),
            cleanField(wardno),
            cleanField(tole),
            cleanField(contactno),
            cleanField(panno),
            cleanField(registrationdate),
            logoFilename,
            cleanField(email),
        ];

        if (current) {
            // Update
            await pool.query(
                `UPDATE organization_details SET
           companyname = ?, province = ?, district = ?, munvdc = ?, wardno = ?,
           tole = ?, contactno = ?, panno = ?, registrationdate = ?, logo = ?, email = ?
         WHERE id = ?`,
                [...data, current.id]
            );
        } else {
            // Insert first time
            await pool.query(
                `INSERT INTO organization_details
           (companyname, province, district, munvdc, wardno, tole, contactno, panno, registrationdate, logo, email)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                data
            );
        }

        const [updated] = await pool.query('SELECT * FROM organization_details ORDER BY id ASC LIMIT 1');
        res.json({
            ok: true,
            message: current ? 'Organization details updated successfully' : 'Organization details created successfully',
            organization: updated[0] || null,
        });
    })
);

export default router;
