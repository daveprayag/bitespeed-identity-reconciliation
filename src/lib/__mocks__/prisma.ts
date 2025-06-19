import { vi } from "vitest";

const mockPrisma = {
    contact: {
        findMany: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
    },
    $transaction: vi.fn(),
};

export default mockPrisma;
