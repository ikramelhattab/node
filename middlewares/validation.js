/* eslint-disable no-useless-escape */
const Joi = require('joi');

const emailPattern = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,4}$/;
const passwordPattern = /(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[$@$!%*?&])[A-Za-z\d$@$!%*?&].{8,}/;


const doesUserHavePasswordValidation = (data) => {
    const schema = Joi.object({
        email: Joi.string().required()
    });
    return schema.validate(data);
}

const loginValidation = (data) => {
    const schema = Joi.object({
        email: Joi.string().regex(emailPattern).required(),
        password: Joi.string().required(),
        rememberme: Joi.boolean().required(),
    });
    return schema.validate(data);
};


const registerValidation = (data) => {
    const schema = Joi.object({
        email: Joi.string().regex(emailPattern).required(),
        // password: Joi.string().min(8).regex(passwordPattern).required(),
        firstName: Joi.string().required(),
        lastName: Joi.string().required(),
    });
    return schema.validate(data);
}


const oneUserValidation = (data) => {
    const schema = Joi.object({
        id: Joi.string().required()
    });
    return schema.validate(data);
}


const updateUserValidation = (data) => {
    const schema = Joi.object({
        id: Joi.string().required(),
        firstName: Joi.string().allow(null, '').optional(),
        lastName: Joi.string().allow(null, '').optional(),
        email: Joi.string().regex(emailPattern).allow(null, '').optional(),
        password: Joi.string().regex(passwordPattern).allow(null, '').optional()
    });
    return schema.validate(data);
}

const bookingValidation = (data) => {
    const schema = Joi.object({
        num_reservation: Joi.string().required(),
        typeMissionId: Joi.string().required(),
        perimeterId: Joi.string().required(),
        equipId: Joi.string().required(),
        statut: Joi.string().required(),
        start: Joi.date().required(),
        end: Joi.date().required()
    });
    return schema.validate(data);
}

const updateBookingValidation = (data) => {
    const schema = Joi.object({
        id: Joi.string().required(),
        statut: Joi.string().optional(),
        
    });
    return schema.validate(data);
}


const deleteBookingValidation = (data) => {
    const schema = Joi.object({
        bookingId: Joi.string().required()
    });
    return schema.validate(data);
}

const getOneBookingValidation = (data) => {
    const schema = Joi.object({
        bookingId: Joi.string().required()
    });
    return schema.validate(data);
}

const addMissionValidation = (data) => {
    const schema = Joi.object({
        date: Joi.date().required(),
        perimetre: Joi.string().required(),
        responsable: Joi.string().required()
    });
    return schema.validate(data);
}

const addLeakValidation = (data) => {
    const schema = Joi.object({
        leakName: Joi.string().required(),
        bookingId: Joi.string().required(),
        leakDate: Joi.date().optional(),
        leakGain: Joi.number().optional(),
        leakDbRms: Joi.number().optional(),
        leakK: Joi.number().optional(),
        leakFlow: Joi.number().optional(),
        leakCost: Joi.number().optional(),
        leakCurrency: Joi.string().optional(),
        leakCoordX: Joi.number().optional(),
        leakCoordY: Joi.number().optional(),
        actionPilote: Joi.string().optional(),
        actionDelai: Joi.string().optional(),
        actionDesc: Joi.string().optional(),
        actionCost: Joi.number().optional(),
        actionStatut: Joi.boolean().optional(),
        type_action: Joi.boolean().optional(),


    });
    return schema.validate(data);
}


const updateLeakValidation = (data) => {
    const schema = Joi.object({
        leakId: Joi.string().required(),
        leakName: Joi.string().optional().allow(null, ''),
        bookingId: Joi.string().optional(),
        leakDate: Joi.date().optional().allow(null),
        leakGain: Joi.number().optional().allow(null),
        leakDbRms: Joi.number().optional().allow(null),
        leakK: Joi.number().optional().allow(null),
        leakFlow: Joi.number().optional().allow(null),
        leakCost: Joi.number().optional().allow(null),
        leakCurrency: Joi.string().optional().allow(null, ''),
        leakCoordX: Joi.number().optional().allow(null),
        leakCoordY: Joi.number().optional().allow(null),
        actionPilote: Joi.string().optional().allow(null, ''),
        actionDelai: Joi.string().optional().allow(null),
        actionDesc: Joi.string().optional().allow(null, ''),
        actionCost: Joi.number().optional().allow(null),
        actionStatut: Joi.string().optional().allow(null),
        isValidated: Joi.boolean().optional().allow(null)
    });
    return schema.validate(data);
}


const addPeriValidation = (data) => {
    const schema = Joi.object({
        code: Joi.string().required(),
        description: Joi.string().required(),
        statut: Joi.boolean().required(),
    });
    return schema.validate(data);
}


const updatePeriValidation = (data) => {
    const schema = Joi.object({
        id: Joi.string().required(),
        code: Joi.string().optional(),
        description: Joi.string().optional(),
        statut: Joi.boolean().optional(),
    });
    return schema.validate(data);
}


const deletePeriValidation = (data) => {
    const schema = Joi.object({
        id: Joi.string().required()
    });
    return schema.validate(data);
}




const addTypeEquiValidation = (data) => {
    const schema = Joi.object({
        typeEquip: Joi.string().required(),
        description: Joi.string().optional().allow('', null),
        statut: Joi.boolean().required()
    });
    return schema.validate(data);
}



const updateTypeEquiValidation = (data) => {
    const schema = Joi.object({
        id: Joi.string().required(),
        typeEquip: Joi.string().allow(null, '').optional(),
        description: Joi.string().allow(null, '').optional(),
        statut: Joi.boolean().optional()
    });
    return schema.validate(data);
}

const deleteTEquipValidation = (data) => {
    const schema = Joi.object({
        id: Joi.string().required()
    });
    return schema.validate(data);
}


const addTypesMissionValidation = (data) => {
    const schema = Joi.object({
        typeMission: Joi.string().required(),
        description: Joi.string().required(),
        statut: Joi.boolean().optional(),
    });
    return schema.validate(data);
}


const deleteTMissValidation = (data) => {
    const schema = Joi.object({
        id: Joi.string().required()
    });
    return schema.validate(data);
}

const updateTypesMissionValidation = (data) => {
    const schema = Joi.object({
        id: Joi.string().required(),
        statut: Joi.boolean().optional()
    });
    return schema.validate(data);
}



const addEquipValidation = (data) => {
    const schema = Joi.object({
        code: Joi.string().required(),
        description: Joi.string().required(),
        typeEquip: Joi.string().required(),
        facteur: Joi.number().required(),
        statut: Joi.boolean().required(),
    });
    return schema.validate(data);
}





const updateEquipValidation = (data) => {
    const schema = Joi.object({
        id: Joi.string().required(),
        code: Joi.string().optional().allow('', null),
        description: Joi.string().optional().allow('', null),
        facteur: Joi.number().optional().allow('', null),
        typeEquipId: Joi.string().allow(null, '').optional(),
        statut: Joi.boolean().optional(),
    });
    return schema.validate(data);
}



const deleteEquipValidation = (data) => {
    const schema = Joi.object({
        id: Joi.string().required()
    });
    return schema.validate(data);
}


const updateFreqValidation = (data) => {

    const schema = Joi.object({
        id: Joi.string().required(),
        _0_100euro: Joi.number().required(),
        _100_500euro: Joi.number().required(),
        _500_1500euro: Joi.number().required(),
        _1500euro: Joi.number().required(),
        horizon: Joi.number().required(),
    });

    return schema.validate(data);
}




module.exports = {
    loginValidation,
    registerValidation,
    bookingValidation,
    deleteBookingValidation,
    oneUserValidation,
    updateUserValidation,
    addMissionValidation,
    addLeakValidation,
    updateLeakValidation,
    addPeriValidation,
    updatePeriValidation,
    addTypeEquiValidation,
    updateTypeEquiValidation,
    addTypesMissionValidation,
    updateTypesMissionValidation,
    addEquipValidation,
    updateEquipValidation,
    deletePeriValidation,
    updateFreqValidation,
    deleteEquipValidation,
    deleteTEquipValidation,
    deleteTMissValidation,
    getOneBookingValidation,
    doesUserHavePasswordValidation,
    updateBookingValidation
};