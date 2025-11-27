import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Pastikan folder uploads tersedia
const uploadDir = 'uploads';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        // Format nama file: TIMESTAMP-RANDOM-ASLI
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    },
});

const fileFilter = (req: any, file: Express.Multer.File, cb: any) => {
    // Hanya terima gambar & PDF
    const allowedTypes = /jpeg|jpg|png|pdf/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
        // File diterima
        return cb(null, true);
    } else {
        // PERUBAHAN DI SINI:
        // Jika file tidak valid, kita tolak (false) tanpa melempar Error 500.
        // File ini tidak akan masuk ke req.files, jadi array attachments akan kosong atau berkurang.
        cb(null, false);

        // Opsi Alternatif: Jika ingin tetap strict error untuk file .exe tapi loloskan yg kosong
        // Anda bisa cek file.originalname.length === 0, tapi cb(null, false) lebih aman untuk skip file sampah.
    }
};

export const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // Max 5MB
    fileFilter: fileFilter
});