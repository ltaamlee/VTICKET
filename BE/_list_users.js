const prisma = require("./src/config/prisma");

async function main() {
    const users = await prisma.user.findMany({
        where: { status: "ACTIVE" },
        select: { id: true, email: true, role: { select: { roleName: true } } },
    });
    console.log(JSON.stringify(users, null, 1));
    await prisma.$disconnect();
}

main().catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
});
