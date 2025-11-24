"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('🌱 Start seeding...');
    const roles = ['ADMIN', 'TREASURER', 'SUPER_ADMIN', 'MEMBER'];
    for (const roleName of roles) {
        await prisma.role.upsert({
            where: { name: roleName },
            update: {},
            create: { name: roleName },
        });
    }
    console.log('✅ Roles seeded');
    const demoOrg = await prisma.organization.create({
        data: {
            name: 'Himpunan Mahasiswa Informatika (Dummy)',
            description: 'Organisasi untuk demo aplikasi',
            code: 'DEMO123',
            divisions: {
                create: [
                    { name: 'BPH Inti' },
                    { name: 'Divisi Kominfo' },
                    { name: 'Divisi Kaderisasi' }
                ]
            },
            categories: {
                create: [
                    { categoryName: 'Kesekretariatan' },
                    { categoryName: 'Konsumsi' },
                    { categoryName: 'Transportasi' }
                ]
            }
        }
    });
    console.log(`✅ Demo Organization created: ${demoOrg.name} with code: DEMO123`);
    console.log('🌱 Seeding finished.');
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
