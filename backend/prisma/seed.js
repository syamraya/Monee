"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcrypt = require("bcrypt");
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('Seeding started...');
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash('admin123', salt);
    const admin = await prisma.user.upsert({
        where: { email: 'admin@monee.com' },
        update: {},
        create: {
            email: 'admin@monee.com',
            name: 'Super Admin Monee',
            password: hashedPassword,
            role: client_1.Role.ADMIN,
            balance: 0,
        },
    });
    console.log(`Admin created: ${admin.email}`);
    const categories = [
        { name: 'Trading XAU/USD' },
        { name: 'Gaji' },
        { name: 'Makanan & Minuman' },
        { name: 'Transportasi' },
        { name: 'Hiburan' },
        { name: 'Kesehatan' },
    ];
    for (const cat of categories) {
        await prisma.category.upsert({
            where: { name: cat.name },
            update: {},
            create: cat,
        });
    }
    console.log('Default categories seeded.');
    console.log('Seeding finished successfully!');
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=seed.js.map