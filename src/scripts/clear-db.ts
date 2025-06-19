import prisma from "../lib/prisma";

async function clearDatabase() {
    await prisma.contact.deleteMany();
    console.log("🧹 All contacts deleted");
}

clearDatabase()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
