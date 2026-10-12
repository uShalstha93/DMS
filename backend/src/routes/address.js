import { Router } from 'express';
import { pool } from '../db.js';
import { authenticate } from '../middleware/auth.js';
import { wrap } from '../utils/asyncHandler.js';

const router = Router();
router.use(authenticate);

// Provinces in their usual order (1 to 7), spelled as in the localgovernments table
const PROVINCE_ORDER = ['कोशी', 'मधेश', 'बागमती', 'गण्डकी', 'लुम्बिनी', 'कर्णाली', 'सुदुरपश्चीम'];

router.get('/provinces', wrap(async (_req, res) => {
  const [rows] = await pool.query("SELECT DISTINCT NProvince AS name FROM localgovernments WHERE NProvince IS NOT NULL AND NProvince <> ''");
  const rank = (n) => (PROVINCE_ORDER.includes(n) ? PROVINCE_ORDER.indexOf(n) : 99);
  const provinces = rows.map((r) => r.name).sort((a, b) => rank(a) - rank(b) || a.localeCompare(b));
  res.json({ provinces });
}));

// ?province=...  -> districts of that province. No province -> every district.
router.get('/districts', wrap(async (req, res) => {
  const params = [];
  let where = "NDistrict IS NOT NULL AND NDistrict <> ''";
  if (req.query.province) { where += ' AND NProvince = ?'; params.push(req.query.province); }
  const [rows] = await pool.query(`SELECT DISTINCT NDistrict AS name FROM localgovernments WHERE ${where} ORDER BY name`, params);
  res.json({ districts: rows.map((r) => r.name) });
}));

// ?district=...&province=... -> municipalities (palika) of that district
router.get('/municipalities', wrap(async (req, res) => {
  if (!req.query.district) return res.json({ municipalities: [] });
  const params = [req.query.district];
  let where = 'NDistrict = ?';
  if (req.query.province) { where += ' AND NProvince = ?'; params.push(req.query.province); }
  const [rows] = await pool.query(
    `SELECT GNameNepali AS name, PalikaType AS type FROM localgovernments WHERE ${where} ORDER BY name`, params
  );
  res.json({ municipalities: rows });
}));

export default router;
