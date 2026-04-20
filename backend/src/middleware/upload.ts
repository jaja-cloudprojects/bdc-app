import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { env } from '../config/env';

const uploadRoot = path.resolve(env.uploadDir);
if (!fs.existsSync(uploadRoot)) fs.mkdirSync(uploadRoot, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadRoot),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext).replace(/\W+/g, '-').toLowerCase();
    cb(null, `${base}-${Date.now()}${ext}`);
  },
});

export const upload = multer({
  storage,
  limits: { fileSize: env.maxFileSize },
  fileFilter: (_req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp|gif|pdf|doc|docx|xls|xlsx/;
    const ok = allowed.test(path.extname(file.originalname).toLowerCase());
    if (ok) cb(null, true);
    else cb(new Error('Unsupported file type'));
  },
});

export const uploadDir = uploadRoot;

export function fileUrl(filename: string) {
  return `${env.publicBaseUrl}/uploads/${filename}`;
}
