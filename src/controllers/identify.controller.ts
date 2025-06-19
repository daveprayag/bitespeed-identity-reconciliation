import { Request, Response } from "express";
import Joi from "joi";
import { reconcileIdentity } from "../services/identity.service";
import { IdentifyRequestBody, IdentifyResponse } from "../utils/types";

const identifySchema = Joi.object<IdentifyRequestBody>({
    email: Joi.string().email().allow(null, "").optional(),
    phoneNumber: Joi.string().allow(null, "").optional(),
});

const handleIdentify = async (
    req: Request,
    res: Response
): Promise<Response | void> => {
    const { error, value } = identifySchema.validate(req.body);

    if (error) {
        return res.status(400).json({ error: error.details[0].message });
    }

    try {
        const result: IdentifyResponse = await reconcileIdentity(value);
        return res.status(200).json(result);
    } catch (err: any) {
        return res.status(500).json({ error: err.message });
    }
};

export default handleIdentify;
