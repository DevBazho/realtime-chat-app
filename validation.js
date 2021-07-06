// VALIDATION
const Joi = require('@hapi/joi');


// REGISTER VALIDATION
const registerValidation = data =>{
    const schema = Joi.object({
        name: Joi.string().min(2).required(),
        email: Joi.string().min(6).required().email(),
        password: Joi.string().min(6).required()
    });
    return schema.validate(data);
}

// LOGIN VALIDATION
const loginValidation = data =>{
    const schema = Joi.object({
        email: Joi.string().min(6).required().email(),
        password: Joi.string().min(6).required()
    });
    return schema.validate(data);
}

// Edit||Update user validation
const nameValidaiton = data => {
    const schema = Joi.object({
        name: Joi.string().min(2).required(),
    });
    return schema.validate(data);
}
// Edit||Update user validation
const passwordValidaiton = data => {
    const schema = Joi.object({
        password: Joi.string().min(8).required(),
    });
    return schema.validate(data);
}
// Email validation
const emailValidaiton = data => {
    const schema = Joi.object({
        email: Joi.string().min(6).required().email(),
    });
    return schema.validate(data);
}

// Message validation
const messageValidaiton = data => {
    const schema = Joi.object({
        toName: Joi.string().min(1).max(50),
        msgFrom: Joi.string().min(6).required().email(),
        msgTo: Joi.string().min(6).required().email(),
        message: Joi.string().max(1024),
        image: Joi.string().max(255)
    });
    return schema.validate(data);
}


module.exports = {
    registerValidation,
    loginValidation,
    nameValidaiton,
    passwordValidaiton,
    emailValidaiton,
    messageValidaiton
}