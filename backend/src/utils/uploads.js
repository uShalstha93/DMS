import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const UPLOAD_ROOT = path.join(__dirname, '../../uploads');
const FOLDERS = { photo: 'membership/photo', signature: 'membership/signature' };

for (const folder of Object.values(FOLDERS)) await fs.mkdir(path.join(UPLOAD_ROOT, folder), { recursive: true });

// Look at the first bytes of the file instead of trusting its name or type
export function imageType(buffer) {
  if (buffer?.length > 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return 'jpg';
  if (buffer?.length > 4 && buffer.subarray(0, 4).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47]))) return 'png';
  return null;
}

export async function saveImage(kind, memberNo, buffer) {
  const name = `${memberNo}-${Date.now()}.${imageType(buffer)}`;
  await fs.writeFile(path.join(UPLOAD_ROOT, FOLDERS[kind], name), buffer);
  return name;
}

export async function removeImage(kind, filename) {
  if (!filename) return;
  try { await fs.unlink(path.join(UPLOAD_ROOT, FOLDERS[kind], path.basename(filename))); } catch { /* already gone */ }
}
