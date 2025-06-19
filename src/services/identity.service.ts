import prisma from "../lib/prisma";
import { IdentifyRequestBody, IdentifyResponse } from "../utils/types";

export async function reconcileIdentity({
    email,
    phoneNumber,
}: IdentifyRequestBody): Promise<IdentifyResponse> {
    if (!email && !phoneNumber) {
        throw new Error(
            "At least one of email or phoneNumber must be provided"
        );
    }

    // 1. Find all matching contacts by email or phone number
    const matchingContacts = await prisma.contact.findMany({
        where: {
            OR: [
                { email: email ?? undefined },
                { phoneNumber: phoneNumber ?? undefined },
            ],
        },
        orderBy: {
            createdAt: "asc",
        },
    });

    // 2. If no matching contacts, create a new contact
    if (matchingContacts.length === 0) {
        const newContact = await prisma.contact.create({
            data: {
                email: email,
                phoneNumber,
                linkPrecedence: "primary",
            },
        });
        return formatResponse(
            newContact,
            [
                {
                    id: newContact.id,
                    email: newContact.email,
                    phoneNumber: newContact.phoneNumber,
                    linkPrecedence: "primary",
                },
            ],
            []
        );
    }

    // 3. Determine the primary contact
    const primaryContact =
        matchingContacts.find(
            (c: { linkPrecedence: string }) => c.linkPrecedence === "primary"
        ) || matchingContacts[0];

    // 4. Gather all contacts (primary + all linked secondaries)
    const allRelatedContacts = await prisma.contact.findMany({
        where: {
            OR: [
                { id: primaryContact.id },
                { linkedId: primaryContact.id },
                { id: { in: matchingContacts.map((c: { id: any }) => c.id) } },
                {
                    linkedId: {
                        in: matchingContacts.map((c: { id: any }) => c.id),
                    },
                },
            ],
        },
        orderBy: { createdAt: "asc" },
    });

    // 5. If input email/phone not found in group → create a new SECONDARY linked to primary
    const hasEmail = allRelatedContacts.some(
        (c: { email: string | null | undefined }) => c.email === email
    );
    const hasPhone = allRelatedContacts.some(
        (c: { phoneNumber: string | null | undefined }) =>
            c.phoneNumber === phoneNumber
    );

    let newlyCreated: (typeof allRelatedContacts)[number] | null = null;
    if (!hasEmail || !hasPhone) {
        newlyCreated = await prisma.contact.create({
            data: {
                email,
                phoneNumber,
                linkedId: primaryContact.id,
                linkPrecedence: "secondary",
            },
        });
        allRelatedContacts.push(newlyCreated);
    }

    return formatResponse(
        primaryContact,
        allRelatedContacts,
        newlyCreated ? [newlyCreated] : []
    );
}

function formatResponse(
    primary: { id: number },
    allContacts: {
        id: number;
        email: string | null;
        phoneNumber: string | null;
        linkPrecedence: string;
    }[],
    newOnes: { id: number }[]
) {
    const emails = Array.from(
        new Set(allContacts.map((c) => c.email).filter((e) => e !== null))
    ) as string[];

    const phoneNumbers = Array.from(
        new Set(allContacts.map((c) => c.phoneNumber).filter((p) => p !== null))
    ) as string[];

    const secondaryContactIds = allContacts
        .filter((c) => c.linkPrecedence === "secondary")
        .map((c) => c.id)
        .filter((id) => id !== primary.id);

    return {
        contact: {
            primaryContactId: primary.id,
            emails,
            phoneNumbers,
            secondaryContactIds,
        },
    };
}
