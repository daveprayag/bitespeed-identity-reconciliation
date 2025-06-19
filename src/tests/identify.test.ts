import { describe, it, expect, beforeEach, vi } from "vitest";
import { reconcileIdentity } from "../services/identity.service";
import prisma from "../lib/prisma";

vi.mock("../lib/prisma");

beforeEach(() => {
    vi.clearAllMocks();
});

describe("reconcileIdentity scenarios from Notion spec", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("📦 Case A: New user → create primary", async () => {
        (prisma.contact.findMany as any).mockResolvedValueOnce([]);
        (prisma.contact.create as any).mockResolvedValueOnce({
            id: 1,
            email: "a@b.com",
            phoneNumber: "111",
            linkPrecedence: "primary",
            createdAt: new Date(),
        });

        const result = await reconcileIdentity({
            email: "a@b.com",
            phoneNumber: "111",
        });

        expect(prisma.contact.create).toHaveBeenCalledOnce();
        expect(result.contact.primaryContactId).toBe(1);
        expect(result.contact.secondaryContactIds).toEqual([]);
    });

    it("📧 Case B: Email matches existing primary", async () => {
        const primary = {
            id: 1,
            email: "a@b.com",
            phoneNumber: "111",
            linkPrecedence: "primary",
            linkedId: null,
            createdAt: new Date("2020-01-01"),
        };
        (prisma.contact.findMany as any)
            // Step 1 fetch
            .mockResolvedValueOnce([primary])
            // fetch all group
            .mockResolvedValueOnce([primary]);

        const result = await reconcileIdentity({
            email: "a@b.com",
            phoneNumber: null,
        });

        expect(prisma.contact.create).not.toHaveBeenCalled();
        expect(result.contact.primaryContactId).toBe(1);
        expect(result.contact.emails).toContain("a@b.com");
    });

    it("📞 Case C: Phone matches existing secondary → link to primary", async () => {
        const primary = {
            id: 1,
            email: "a@b.com",
            phoneNumber: "111",
            linkPrecedence: "primary",
            linkedId: null,
            createdAt: new Date("2020-01-01"),
        };
        const secondary = {
            id: 2,
            email: "b@b.com",
            phoneNumber: "222",
            linkPrecedence: "secondary",
            linkedId: 1,
            createdAt: new Date("2020-02-01"),
        };

        (prisma.contact.findMany as any)
            .mockResolvedValueOnce([secondary])
            .mockResolvedValueOnce([primary, secondary]);

        const result = await reconcileIdentity({
            email: null,
            phoneNumber: "222",
        });

        expect(result.contact.primaryContactId).toBe(1);
        expect(result.contact.secondaryContactIds).toContain(2);
    });

    it("🔁 Case D: Email and phone from different primaries → merge older as primary", async () => {
        const primaryOld = {
            id: 1,
            email: "a@b.com",
            phoneNumber: "111",
            linkPrecedence: "primary",
            linkedId: null,
            createdAt: new Date("2020-01-01"),
        };
        const primaryNew = {
            id: 2,
            email: "c@d.com",
            phoneNumber: "222",
            linkPrecedence: "primary",
            linkedId: null,
            createdAt: new Date("2021-01-01"),
        };

        (prisma.contact.findMany as any)
            .mockResolvedValueOnce([primaryOld, primaryNew])
            .mockResolvedValueOnce([primaryOld, primaryNew]);

        (prisma.$transaction as any).mockResolvedValueOnce([
            {
                id: 2,
                email: "c@d.com",
                phoneNumber: "222",
                linkPrecedence: "secondary",
                linkedId: 1,
                createdAt: primaryNew.createdAt,
            },
        ]);

        (prisma.contact.findMany as any).mockResolvedValueOnce([
            primaryOld,
            {
                ...primaryNew,
                linkPrecedence: "secondary",
                linkedId: 1,
            },
        ]);

        const result = await reconcileIdentity({
            email: "a@b.com",
            phoneNumber: "222",
        });

        expect(prisma.$transaction).toHaveBeenCalled();
        expect(result.contact.primaryContactId).toBe(1);
        expect(result.contact.secondaryContactIds).toContain(2);
    });

    it("➕ Case E: New email added to existing primary adds secondary", async () => {
        const primary = {
            id: 1,
            email: "a@b.com",
            phoneNumber: "111",
            linkPrecedence: "primary",
            linkedId: null,
            createdAt: new Date("2020-01-01"),
        };

        (prisma.contact.findMany as any)
            .mockResolvedValueOnce([primary])
            .mockResolvedValueOnce([primary]);

        (prisma.contact.create as any).mockResolvedValueOnce({
            id: 3,
            email: "new@b.com",
            phoneNumber: null,
            linkPrecedence: "secondary",
            linkedId: 1,
        });

        const result = await reconcileIdentity({
            email: "new@b.com",
            phoneNumber: null,
        });

        expect(prisma.contact.create).toHaveBeenCalled();
        expect(result.contact.secondaryContactIds).toContain(3);
    });

    it("❗ Error when no email & no phone", async () => {
        await expect(
            reconcileIdentity({ email: null, phoneNumber: null })
        ).rejects.toThrow();
    });
});
