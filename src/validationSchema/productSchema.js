import Joi from "joi";

const productSchema = Joi.object({
    name: Joi.string().required(),
    price: Joi.number().positive().required(),
    quantity: Joi.number().integer().min(0).optional(),
    description: Joi.string().allow(""),
    image: Joi.string().uri().optional(),
    category: Joi.string().required(),
    subcategory: Joi.string().optional(),
    status: Joi.string().valid("active", "inactive").default("active"),
    discount: Joi.number().min(0).max(100).optional(),
    brand: Joi.string().optional(),
    color: Joi.string().optional(),
    size: Joi.string().optional(),
});

export default productSchema;