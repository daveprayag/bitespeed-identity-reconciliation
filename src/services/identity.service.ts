import prisma from "../lib/prisma";
import { IdentifyRequestBody, IdentifyResponse } from "../utils/types";

function formatResponse(primary: any, contacts: any[]): IdentifyResponse {
    const emails = new Set<string>();
    const phoneNumbers = new Set<string>();
    const secondaryContactIds: number[] = [];

    for (const contact of contacts) {
        if (contact.email) emails.add(contact.email);
        if (contact.phoneNumber) phoneNumbers.add(contact.phoneNumber);
        if (contact.id !== primary.id) secondaryContactIds.push(contact.id);
    }

    return {
        contact: {
            primaryContactId: primary.id,
            emails: [...emails],
            phoneNumbers: [...phoneNumbers],
            secondaryContactIds,
        },
    };
}

export async function reconcileIdentity({
    email,
    phoneNumber,
}: IdentifyRequestBody): Promise<IdentifyResponse> {
    if (!email && !phoneNumber) {
        throw new Error(
            "At least one of email or phoneNumber must be provided"
        );
    }

    // Step 1: Fetch contacts matching email or phoneNumber
    const matchedContacts = await prisma.contact.findMany({
        where: {
            OR: [
                ...(email ? [{ email }] : []),
                ...(phoneNumber ? [{ phoneNumber }] : []),
            ],
        },
        orderBy: { createdAt: "asc" },
    });

    // Step 2: If no match, create primary contact
    if (matchedContacts.length === 0) {
        const newPrimary = await prisma.contact.create({
            data: {
                email,
                phoneNumber,
                linkPrecedence: "primary",
            },
        });
        return formatResponse(newPrimary, [newPrimary]);
    }

    // Step 3: Collect all related IDs
    const relatedIds = new Set<number>();
    matchedContacts.forEach((c: any) => {
        relatedIds.add(c.id);
        if (c.linkedId) relatedIds.add(c.linkedId);
    });

    // Step 4: Fetch all linked contacts in the group
    const allContacts = await prisma.contact.findMany({
        where: {
            OR: [
                { id: { in: [...relatedIds] } },
                { linkedId: { in: [...relatedIds] } },
            ],
        },
        orderBy: { createdAt: "asc" },
    });

    // Step 5: Determine oldest primary contact
    const primaryContacts = allContacts.filter(
        (c: any) => c.linkPrecedence === "primary"
    );
    const truePrimary = primaryContacts.sort(
        (a: any, b: any) => a.createdAt.getTime() - b.createdAt.getTime()
    )[0];

    // Step 6: Downgrade all other primaries → secondary
    const needsUpdate = primaryContacts.filter(
        (c: any) => c.id !== truePrimary.id
    );

    if (needsUpdate.length > 0) {
        await prisma.$transaction(
            needsUpdate.map((c: any) =>
                prisma.contact.update({
                    where: { id: c.id },
                    data: {
                        linkPrecedence: "secondary",
                        linkedId: truePrimary.id,
                    },
                })
            )
        );
    }

    // Step 7: Check if input data is already in group
    const hasEmail = email
        ? allContacts.some((c: any) => c.email === email)
        : true;
    const hasPhone = phoneNumber
        ? allContacts.some((c: any) => c.phoneNumber === phoneNumber)
        : true;

    // Step 8: Create new secondary if needed
    let newContact = null;
    if (!hasEmail || !hasPhone) {
        newContact = await prisma.contact.create({
            data: {
                email,
                phoneNumber,
                linkPrecedence: "secondary",
                linkedId: truePrimary.id,
            },
        });
        allContacts.push(newContact);
    }

    // Step 9: Final response
    return formatResponse(truePrimary, allContacts);
}
