import prisma from "../lib/prisma";

async function fetchContacts() {
    const contacts = await prisma.contact.findMany({});
    if (contacts.length === 0) {
        console.log("No contacts found.");
        return;
    }

    console.log(`Found ${contacts.length} contacts:`);
    console.log("Contacts:", contacts);
}

fetchContacts()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
