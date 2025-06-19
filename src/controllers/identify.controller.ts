import { Request, Response } from "express";
import Joi from "joi";

interface IdentifyRequestBody {
    email?: string | null;
    phoneNumber?: string | null;
}

const identifySchema = Joi.object<IdentifyRequestBody>({
    email: Joi.string().email().allow(null, ""),
    phoneNumber: Joi.string().allow(null, ""),
});

const handleIdentify = async (req: Request, res: Response): Promise<void> => {
    const { error, value } = identifySchema.validate(req.body);

    if (error) {
        res.status(400).json({ error: error.details[0].message });
        return;
    }

    res.status(200).json({ message: "Valid input", data: value });
};

export default handleIdentify;
