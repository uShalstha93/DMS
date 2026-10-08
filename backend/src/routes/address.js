import { Router } from 'express';
import { pool } from '../db.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();
// router.use(authenticate);

router.get('/province', async (_req, res) => {
    const [provinceName] = await pool.query(
        `SELECT DISTINCT NProvince FROM localgovernments`
    );
    res.json({ provinceName });
});

router.get('/district', async (req, res) => {
    const { province } = req.body || {};
    if (!province?.trim()) return res.status(422).json({ message: 'Province is required' });
    const [districtName] = await pool.query(
        `SELECT DISTINCT NDistrict FROM localgovernments WHERE NProvince = ?`, [province.trim()]
    );
    res.json({ districtName });
});

router.get('/munvdc', async (req, res) => {
    const { district } = req.body || {};
    if (!district?.trim()) return res.status(422).json({ message: 'District is required' });
    const [munVDC] = await pool.query(
        `SELECT DISTINCT GNameNepali FROM localgovernments WHERE NDistrict = ?`, [district.trim()]
    );
    res.json({ munVDC });
});

export default router;