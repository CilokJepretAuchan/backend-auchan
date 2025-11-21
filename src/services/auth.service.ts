import { prisma } from '../prisma/client';
import { hashPassword, comparePassword } from '../utils/hash';
import jwt from 'jsonwebtoken';

// Fungsi helper untuk bikin kode unik (misal: 6 karakter acak)
const generateOrgCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
};

export const registerUser = async (data: any) => {
    const { name, email, password, orgName, orgDesc, orgCode } = data;

    // Cek apakah email sudah terdaftar
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
        throw new Error('Email sudah terdaftar. Silakan login.');
    }

    const hashedPassword = await hashPassword(password);

    // Jalankan Transaction (User + Org + Member harus sukses semua atau gagal semua)
    const result = await prisma.$transaction(async (tx) => {

        // A. Buat User dulu
        const newUser = await tx.user.create({
            data: {
                name,
                email,
                passwordHash: hashedPassword,
            },
        });

        let organization;
        let roleName;


        if (orgCode) {
            // === SKENARIO 1: GABUNG ORGANISASI (JOIN) ===
            organization = await tx.organization.findUnique({
                where: { code: orgCode }
            });

            if (!organization) {
                throw new Error('Kode Organisasi tidak valid.');
            }

            roleName = 'MEMBER'; // Default role untuk yang join (Viewer)

        } else if (orgName) {
            // === SKENARIO 2: BUAT ORGANISASI BARU (CREATE) ===
            // User mengirimkan Nama Organisasi

            // Generate kode unik
            let newCode = generateOrgCode();
            // (Opsional: Cek loop collision jika perlu, tapi probability rendah untuk MVP)

            organization = await tx.organization.create({
                data: {
                    name: orgName,
                    description: orgDesc,
                    code: newCode,
                },
            });

            roleName = 'ADMIN'; // Pembuat adalah Admin/Ketua

        } else {
            throw new Error('Harus menyertakan Nama Organisasi (untuk buat baru) atau Kode Organisasi (untuk gabung).');
        }

        // --- AKHIR LOGIKA CABANG ---

        // 3. Cari ID Role berdasarkan nama
        const role = await tx.role.findUnique({ where: { name: roleName } });
        if (!role) throw new Error(`Role ${roleName} belum disetting di database (Seed).`);

        // 4. Masukkan User ke dalam Organisasi dengan Role yang tepat
        await tx.organizationMember.create({
            data: {
                userId: newUser.id,
                orgId: organization.id,
                roleId: role.id,
            },
        });

        return {
            user: { id: newUser.id, name: newUser.name, email: newUser.email },
            organization: organization,
            role: roleName
        };
    });

    return result;
};

export const loginUser = async (data: any) => {
    const { email, password } = data;

    // Cari user
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw new Error('Email atau password salah');

    // Cek password
    const isValid = await comparePassword(password, user.passwordHash);
    if (!isValid) throw new Error('Email atau password salah');

    // Generate Token
    const token = jwt.sign(
        { userId: user.id, email: user.email },
        process.env.JWT_SECRET || 'rahasia_negara',
        { expiresIn: '1d' }
    );

    return { token, user: { id: user.id, name: user.name, email: user.email } };
};