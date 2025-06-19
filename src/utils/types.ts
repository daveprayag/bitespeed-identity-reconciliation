export interface IdentifyResponse {
    contact: {
        primaryContactId: number;
        emails: string[];
        phoneNumbers: string[];
        secondaryContactIds: number[];
    };
}

export interface IdentifyRequestBody {
    email?: string | null;
    phoneNumber?: string | null;
}
