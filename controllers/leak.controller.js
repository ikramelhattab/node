
const { addLeakValidation, updateLeakValidation } = require('../middlewares/validation');
const Leak = require('../models/leak');
const User = require('../models/user');

const { verifyCookieToken, uploadToCloudinary, isValidDate } = require('../services');


/**
 * Add new leak
 * @param {*} req 
 * @param {*} res 
 * @returns 
 */
async function addLeak(req, res) {
  try {
    // First of all verify JWT (auth token is in the cookies request and valid)
    const verifyCookiesResult = await verifyCookieToken(req);
    if (!verifyCookiesResult.valid) {
      return res.status(401).json(verifyCookiesResult.msg);
    }
    const userId = verifyCookiesResult.msg;
    const foundUser = await User.findById(userId);
    if (!foundUser) {
      return res.status(401).json('Request not permitted');
    }

    // Validation of the data
    const { error } = addLeakValidation(req.body);
    if (error) {
      return res.status(400).json(error.details[0].message);
    }
    const imgFile = req.file;
    let leakImgUrl = '';
    // Validation of the image file
    if (imgFile == null) {
      return res.status(400).json('"image" is required');
    }
    if (imgFile.mimetype !== 'image/png' && imgFile.mimetype !== 'image/jpeg' && imgFile.mimetype !== 'image/jpg'
      && imgFile.mimetype !== 'image/gif' && imgFile.mimetype !== 'image/svg+xml') {
      return res.status(400).json('Image file format not supported');
    }

    // Upload leak image and get url
    leakImgUrl = await uploadToCloudinary(imgFile, 'tarsier_leaks');

    // Save new leak
    const newLeak = new Leak({
      leakName: req.body.leakName,
      bookingId: req.body.bookingId,
      leakDate: req.body.leakDate,
      leakGain: req.body.leakGain,
      leakDbRms: req.body.leakDbRms,
      leakK: req.body.leakK,
      leakFlow: req.body.leakFlow,
      leakCost: req.body.leakCost,
      leakCurrency: req.body.leakCurrency,
      leakImgUrl: leakImgUrl,
      leakCoord: [req.body.leakCoordX, req.body.leakCoordY],
      actionPilote: req.body.actionPilote,
      actionDelai: req.body.actionDelai,
      actionDesc: req.body.actionDesc,
      actionCost: req.body.actionCost,
      actionStatut: req.body.actionStatut,
      type_action: req.body.type_action,
      isValidated: req.body.isValidated,
      createdBy: userId
    });

    const savedLeak = await newLeak.save();
    res.status(200).json(savedLeak);

  } catch (e) {
    console.error(e);
    res.status(500).json('Unexpected error occured');
  }
}




/**
 * Get all leaks (with paginations, order and filtering)
 * @param {*} req 
 * @param {*} res 
 * 
 * The request query (req.query) may contain:
 * 
 * page: page number
 * 
 * pageSize: number of items per page
 * 
 * orderBy: the field upon with the results will be ordered
 * 
 * orderDir: the direction of ordering ('asc' or 'desc')
 * 
 * start: valid date string
 * 
 * end: valid date string
 * 
 * perimeter: name of the perimeter
 * 
 * typeMission: name of mission type
 * 
 * actionStatut: Réparation/Contrôle
 * 
 * actionType: En cours/Clôturé
 * 
 * actionPilote
 * 
 * @returns 
 */
async function getAllLeaks(req, res) {
  try {
    // First of all verify that JWT (auth token is in the cookies request and valid)
    const verifyCookiesResult = await verifyCookieToken(req);
    if (!verifyCookiesResult.valid) {
      return res.status(401).json(verifyCookiesResult.msg);
    }
    // Only an admin are allowed to retreive users list
    const userId = verifyCookiesResult.msg;
    const foundUser = await User.findById(userId);
    if (!foundUser) {
      return res.status(401).json('Not allowed');
    }

    // Extract pagination stuffs
    let pageNumber = req.query.page >= 1 ? +req.query.page : 1;
    let pageSize = req.query.pageSize >= 1 ? +req.query.pageSize : 10;
    pageNumber = pageNumber - 1;
    pageSize = +pageSize;
    // Extract order by stuffs
    let orderBy = req.query.orderBy ? req.query.orderBy : 'createdOn';
    let orderDir = req.query.orderDir === 'asc' ? 1 : -1;
    let orderByQuery = {};
    orderByQuery[orderBy] = orderDir;

    // Extarct filter stuffs
    let dateStart = req.query.start;
    let dateEnd = req.query.end;
    let perimeter = req.query.perimeter;
    let typeMission = req.query.typeMission;
    let actionStatut = req.query.actionStatut;
    let actionType = req.query.actionType;
    let actionPilote = req.query.actionPilote;

    if (dateStart == null) {
      dateStart = new Date(0);
    } else {
      dateStart = new Date(dateStart)
    }
    if (dateEnd == null) {
      dateEnd = new Date(3656063137089);
    } else {
      dateEnd = new Date(dateEnd);
    }
    if (perimeter == null) {
      perimeter = 'all'
    }
    if (typeMission == null) {
      typeMission = 'all'
    }
    if (actionStatut == null) {
      actionStatut = 'all';
    }
    if (actionType == null) {
      actionType = 'all';
    }
    if (actionPilote == null) {
      actionPilote = '';
    }

    if (!isValidDate(dateStart) || !isValidDate(dateEnd)) {
      return res.status(400).json('Invalid date received');
    }


    // Get leaks list
    const leakList = await Leak.aggregate([
      {
        $lookup: {
          from: 'bookings', // Name of the foreign document
          localField: 'bookingId',
          foreignField: '_id',
          as: 'linkedBooking',
        }
      },
      {
        $unwind: {
          path: '$linkedBooking',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: 'perimeters', // Name of the foreign document
          localField: 'linkedBooking.perimeterId',
          foreignField: '_id',
          as: 'linkedPerimeter',
        }
      },
      {
        $unwind: {
          path: "$linkedPerimeter",
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $lookup: {
          from: 'typesmissions', // Name of the foreign document
          localField: 'linkedBooking.typeMissionId',
          foreignField: '_id',
          as: 'linkedTypeMission',
        }
      },
      {
        $unwind: {
          path: "$linkedTypeMission",
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $lookup: {
          from: 'equipements', // Name of the foreign document
          localField: 'linkedBooking.equipId',
          foreignField: '_id',
          as: 'linkedEquip',
        }
      },
      {
        $unwind: {
          path: "$linkedEquip",
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'createdBy',
          foreignField: '_id',
          as: 'linkedUser'
        }
      },
      {
        $unwind: {
          path: '$linkedUser',
          preserveNullAndEmptyArrays: true
        }
      },

      {
        $project: {
          'leakName': '$leakName',
          'bookingId': '$bookingId',
          'leakDate': '$leakDate',
          'leakGain': { $ifNull: ['$leakGain', 0] },
          // Exemple de calcul : Une fuite de 3000 €  est l’équivalent de 3000 /0,078 = 38 461 KWh
          // et l'équivalent en émission CO2 de (38 461 *0,4281 )/1000 = 16,5
          'leakCo2': { $multiply: [{ $multiply: ['$leakCost', 12.8205, 0.4281] }, 0.001] },
          'leakDbRms': '$leakDbRms',
          'leakK': '$leakK',
          'leakFlow': '$leakFlow',
          'leakCost': '$leakCost',
          'leakCurrency': '$leakCurrency',
          'leakImgUrl': '$leakImgUrl',
          'leakCoord': '$leakCoord',
          // If action statut is null, set it 'En cours' by default
          'actionStatut': { $ifNull: ['$actionStatut', 'En cours'] },
          'type_action': { $ifNull: ['$type_action', 'Réparation'] },
          'createdOn': '$createdOn',
          'actionCost': { $ifNull: ['$actionCost', 0] },
          'actionDelai': { $ifNull: ['$actionDelai', ''] },
          'actionDesc': { $ifNull: ['$actionDesc', ''] },
          'actionPilote': { $ifNull: ['$actionPilote', ''] },
          'num_reservation': '$linkedBooking.num_reservation',
          'bookingStart': '$linkedBooking.start',
          'bookingEnd': '$linkedBooking.end',
          'bookingCreationDate': '$linkedBooking.createdOn',
          'perimeterId': '$linkedPerimeter._id',
          'perimeterCode': '$linkedPerimeter.code',
          'typeMissionId': '$linkedTypeMission._id',
          'typeMission': '$linkedTypeMission.typeMission',
          'equipId': '$linkedEquip._id',
          'equipCode': '$linkedEquip.code',
          'facteur': '$linkedEquip.facteur',
          'userId': '$linkedUser._id',
          'userName': { $concat: ['$linkedUser.firstName', ' ', '$linkedUser.lastName'] },
          // finalGain = cout fuite - cout réparation (seulement sur les actions de réparation cloturées)
          // { $cond: [ <boolean-expression>, <true-case>, <false-case> ] }
          'finalGain': { $cond: [{ $eq: ['$actionStatut', 'Clôturé'] }, { $subtract: ['$leakCost', '$actionCost'] }, 0] }
        }
      },

      // Filter
      {
        $match: {
          $and: [
            { 'perimeterCode': perimeter == 'all' ? /.*/g : new RegExp(perimeter, 'i') },
            { 'typeMission': typeMission == 'all' ? /.*/g : new RegExp(typeMission, 'i') },
            { 'actionStatut': actionStatut == 'all' ? /.*/g : new RegExp(actionStatut, 'i') },
            { 'type_action': actionType == 'all' ? /.*/g : new RegExp(actionType, 'i') },
            { 'actionPilote': actionPilote == '' ? /.*/g : new RegExp(actionPilote, 'i') },
            { 'bookingStart': { $gte: dateStart, $lte: dateEnd } }
          ],
        },
      },
      {
        $facet: {
          'leaks': [
            // sort
            { $sort: orderByQuery },
            // pagination
            { $skip: pageNumber * pageSize },
            { $limit: pageSize },
          ],
          'total': [
            { $count: 'count' }
          ],
          'totalGain': [
            {
              $group: {
                _id: '_id',
                'totalCout': { $sum: '$leakCost' },
                'totalEmissionCo2': { $sum: '$leakCo2' },
                'totalGain': { $sum: '$finalGain' },
                'totalActionCost': { $sum: '$actionCost' }
              }
            }
          ],

        },
      }
    ]);
    res.status(200).json(leakList);

  } catch (e) {
    console.error(e);
    return res.status(500).json('Unexpected error occured');
  }
}







/**
 * Get all leaks (with paginations, order and filtering)
 * @param {*} req 
 * @param {*} res 
 * 
 * The request query (req.query) may contain:
 * 
 * page: page number
 * 
 * pageSize: number of items per page
 * 
 * orderBy: the field upon with the results will be ordered
 * 
 * orderDir: the direction of ordering ('asc' or 'desc')
 * 
 * start: valid date string
 * 
 * end: valid date string
 * 
 * perimeter: name of the perimeter
 * 
 * typeMission: name of mission type
 * 
 * actionStatut: Réparation/Contrôle
 * 
 * actionType: En cours/Clôturé
 * 
 * actionPilote
 * 
 * @returns 
 */
async function getAllLeaksInPdf(req, res) {
  try {
    // First of all verify that JWT (auth token is in the cookies request and valid)
     const verifyCookiesResult = await verifyCookieToken(req);
    if (!verifyCookiesResult.valid) {
      return res.status(401).json(verifyCookiesResult.msg);
    }
    // Only an admin are allowed to retreive users list
    const userId = verifyCookiesResult.msg;
    const foundUser = await User.findById(userId);
    if (!foundUser) {
      return res.status(401).json('Not allowed');
    }

 
    // Extarct filter stuffs
    let dateStart = req.query.start;
    let dateEnd = req.query.end;
    let perimeter = req.query.perimeter;
    let typeMission = req.query.typeMission;
    let actionStatut = req.query.actionStatut;
    let actionType = req.query.actionType;
    let actionPilote = req.query.actionPilote;

    if (dateStart == null) {
      dateStart = new Date(0);
    } else {
      dateStart = new Date(dateStart)
    }
    if (dateEnd == null) {
      dateEnd = new Date(3656063137089);
    } else {
      dateEnd = new Date(dateEnd);
    }
    if (perimeter == null) {
      perimeter = 'all'
    }
    if (typeMission == null) {
      typeMission = 'all'
    }
    if (actionStatut == null) {
      actionStatut = 'all';
    }
    if (actionType == null) {
      actionType = 'all';
    }
    if (actionPilote == null) {
      actionPilote = '';
    }

    if (!isValidDate(dateStart) || !isValidDate(dateEnd)) {
      return res.status(400).json('Invalid date received');
    }


    // Get leaks list
    const leakList = await Leak.aggregate([
      {
        $lookup: {
          from: 'bookings', // Name of the foreign document
          localField: 'bookingId',
          foreignField: '_id',
          as: 'linkedBooking',
        }
      },
      {
        $unwind: {
          path: '$linkedBooking',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: 'perimeters', // Name of the foreign document
          localField: 'linkedBooking.perimeterId',
          foreignField: '_id',
          as: 'linkedPerimeter',
        }
      },
      {
        $unwind: {
          path: "$linkedPerimeter",
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $lookup: {
          from: 'typesmissions', // Name of the foreign document
          localField: 'linkedBooking.typeMissionId',
          foreignField: '_id',
          as: 'linkedTypeMission',
        }
      },
      {
        $unwind: {
          path: "$linkedTypeMission",
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $lookup: {
          from: 'equipements', // Name of the foreign document
          localField: 'linkedBooking.equipId',
          foreignField: '_id',
          as: 'linkedEquip',
        }
      },
      {
        $unwind: {
          path: "$linkedEquip",
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'createdBy',
          foreignField: '_id',
          as: 'linkedUser'
        }
      },
      {
        $unwind: {
          path: '$linkedUser',
          preserveNullAndEmptyArrays: true
        }
      },

      {
        $project: {
          'leakName': '$leakName',
          'bookingId': '$bookingId',
          'leakDate': '$leakDate',
          'leakGain': { $ifNull: ['$leakGain', 0] },
          // Exemple de calcul : Une fuite de 3000 €  est l’équivalent de 3000 /0,078 = 38 461 KWh
          // et l'équivalent en émission CO2 de (38 461 *0,4281 )/1000 = 16,5
          'leakCo2': { $multiply: [{ $multiply: ['$leakCost', 12.8205, 0.4281] }, 0.001] },
          'leakDbRms': '$leakDbRms',
          'leakK': '$leakK',
          'leakFlow': '$leakFlow',
          'leakCost': '$leakCost',
          'leakCurrency': '$leakCurrency',
          'leakImgUrl': '$leakImgUrl',
          'leakCoord': '$leakCoord',
          // If action statut is null, set it 'En cours' by default
          'actionStatut': { $ifNull: ['$actionStatut', 'En cours'] },
          'type_action': { $ifNull: ['$type_action', 'Réparation'] },
          'createdOn': '$createdOn',
          'actionCost': { $ifNull: ['$actionCost', 0] },
          'actionDelai': { $ifNull: ['$actionDelai', ''] },
          'actionDesc': { $ifNull: ['$actionDesc', ''] },
          'actionPilote': { $ifNull: ['$actionPilote', ''] },
          'num_reservation': '$linkedBooking.num_reservation',
          'bookingStart': '$linkedBooking.start',
          'bookingEnd': '$linkedBooking.end',
          'bookingCreationDate': '$linkedBooking.createdOn',
          'perimeterId': '$linkedPerimeter._id',
          'perimeterCode': '$linkedPerimeter.code',
          'typeMissionId': '$linkedTypeMission._id',
          'typeMission': '$linkedTypeMission.typeMission',
          'equipId': '$linkedEquip._id',
          'equipCode': '$linkedEquip.code',
          'facteur': '$linkedEquip.facteur',
          'userId': '$linkedUser._id',
          'userName': { $concat: ['$linkedUser.firstName', ' ', '$linkedUser.lastName'] },
          // finalGain = cout fuite - cout réparation (seulement sur les actions de réparation cloturées)
          // { $cond: [ <boolean-expression>, <true-case>, <false-case> ] }
          'finalGain': { $cond: [{ $eq: ['$actionStatut', 'Clôturé'] }, { $subtract: ['$leakCost', '$actionCost'] }, 0] }
        }
      },

      // Filter
      {
        $match: {
          $and: [
            { 'perimeterCode': perimeter == 'all' ? /.*/g : new RegExp(perimeter, 'i') },
            { 'typeMission': typeMission == 'all' ? /.*/g : new RegExp(typeMission, 'i') },
            { 'actionStatut': actionStatut == 'all' ? /.*/g : new RegExp(actionStatut, 'i') },
            { 'type_action': actionType == 'all' ? /.*/g : new RegExp(actionType, 'i') },
            { 'actionPilote': actionPilote == '' ? /.*/g : new RegExp(actionPilote, 'i') },
            { 'bookingStart': { $gte: dateStart, $lte: dateEnd } }
          ],
        },
      },

    ]);

    res.status(200).json(leakList);

  } catch (e) {
    console.error(e);
    return res.status(500).json('Unexpected error occured');
  }
}




/**
 * Update leak 
 * @param {*} req 
 * @param {*} res 
 * @returns 
 */
async function updateLeak(req, res) {
  try {
    // First of all verify JWT (auth token is in the cookies request and valid)
    const verifyCookiesResult = await verifyCookieToken(req);
    if (!verifyCookiesResult.valid) {
      return res.status(401).json(verifyCookiesResult.msg);
    }
    const userId = verifyCookiesResult.msg;
    const foundUser = await User.findById(userId);
    if (!foundUser) {
      return res.status(401).json('Request not permitted');
    }

    // Validation of the data
    const { error } = updateLeakValidation(req.body);
    if (error) {
      return res.status(400).json(error.details[0].message);
    }

    // Only admin or the user who created admin are allowed to edit the leaks
    const isAdmin = foundUser.isAdmin;
    const leakId = req.body.leakId;
    const targetLeak = await Leak.findById(leakId);
    if (!targetLeak) {
      return res.status(400).json('Source does not exist');
    }

    if (targetLeak.createdBy.toString() !== userId && !isAdmin) {
      return res.status(401).json('Not permitted to update');
    }


    const updateQuery = {
      leakName: req.body.leakName ? req.body.leakName : undefined,
      bookingId: req.body.bookingId ? req.body.bookingId : undefined,
      leakDate: req.body.leakDate ? req.body.leakDate : undefined,
      leakGain: req.body.leakGain ? req.body.leakGain : undefined,
      leakDbRms: req.body.leakDbRms ? req.body.leakDbRms : undefined,
      leakK: req.body.leakK ? req.body.leakK : undefined,
      leakFlow: req.body.leakFlow ? req.body.leakFlow : undefined,
      leakCost: req.body.leakCost ? req.body.leakCost : undefined,
      leakCurrency: req.body.leakCurrency ? req.body.leakCurrency : undefined,
      leakCoord: [req.body.leakCoordX, req.body.leakCoordY],
      actionPilote: req.body.actionPilote ? req.body.actionPilote : undefined,
      actionDelai: req.body.actionDelai ? req.body.actionDelai : undefined,
      actionDesc: req.body.actionDesc ? req.body.actionDesc : undefined,
      actionCost: req.body.actionCost ? req.body.actionCost : undefined,
      actionStatut: req.body.actionStatut ? req.body.actionStatut : undefined,
      isValidated: req.body.isValidated ? req.body.isValidated : undefined
    }

    // Everything is fine --> update leak
    const updatedLeak = await Leak.findByIdAndUpdate(leakId, updateQuery, { new: true });
    res.status(200).json(updatedLeak);

  } catch (e) {
    console.error(e);
    return res.status(500).json('Unexpected error occured');
  }
}


async function deleteLeak(req, res) {
  try {
    // First of all verify JWT (auth token is in the cookies request and valid)
    const verifyCookiesResult = await verifyCookieToken(req);
    if (!verifyCookiesResult.valid) {
      return res.status(401).json(verifyCookiesResult.msg);
    }
    const userId = verifyCookiesResult.msg;
    const foundUser = await User.findById(userId);
    if (!foundUser) {
      return res.status(401).json('Request not permitted');
    }

    // Validattion of the data
    if (req.body.leakId == null) {
      return res.status(400).json('\'leakId\' property is required');
    }

    // Everything is fine, delete leak
    const deletedLeak = await Leak.findByIdAndDelete(req.body.leakId);
    res.status(200).json(deletedLeak);
  } catch (e) {
    console.error(e);
    return res.status(500).json('Unexpected error occured');
  }
}



/**
 * API to get gain by hour, day, week, month and year
 * @param {*} req 
 * @param {*} res 
 * @returns 
 */
async function getGain(req, res) {
  try {
    // First of all verify JWT (auth token is in the cookies request and valid)
    const verifyCookiesResult = await verifyCookieToken(req);
    if (!verifyCookiesResult.valid) {
      return res.status(401).json(verifyCookiesResult.msg);
    }
    const userId = verifyCookiesResult.msg;
    const foundUser = await User.findById(userId);
    if (!foundUser) {
      return res.status(401).json('Request not permitted');
    }


    let dateStart = req.query.start;

    let dateEnd = req.query.end;



    if (dateStart == null) {
      dateStart = new Date(0);
    } else {
      dateStart = new Date(dateStart);
    }

    if (dateEnd == null) {
      dateEnd = new Date(3656063137089);
    } else {
      dateEnd = new Date(dateEnd);
    }


    if (!isValidDate(dateStart) || !isValidDate(dateEnd)) {
      return res.status(400).json('Invalid date received');
    }


    const leaksGainData = await Leak.aggregate([
      // Join mission collection
      {
        $lookup: {
          from: 'bookings', // Name of the foreign document
          localField: 'bookingId',
          foreignField: '_id',
          as: 'linkedBooking',
        }
      },
      {
        $unwind: {
          path: '$linkedBooking',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: 'perimeters', // Name of the foreign document
          localField: 'linkedBooking.perimeterId',
          foreignField: '_id',
          as: 'linkedPerimeter',
        }
      },
      {
        $unwind: {
          path: "$linkedPerimeter",
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $lookup: {
          from: 'typesmissions', // Name of the foreign document
          localField: 'linkedBooking.typeMissionId',
          foreignField: '_id',
          as: 'linkedTypeMission',
        }
      },
      {
        $unwind: {
          path: "$linkedTypeMission",
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $lookup: {
          from: 'equipements', // Name of the foreign document
          localField: 'linkedBooking.equipId',
          foreignField: '_id',
          as: 'linkedEquip',
        }
      },
      {
        $unwind: {
          path: "$linkedEquip",
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'createdBy',
          foreignField: '_id',
          as: 'linkedUser'
        }
      },
      {
        $unwind: {
          path: '$linkedUser',
          preserveNullAndEmptyArrays: true
        }
      },


      {
        $project: {
          'leakName': '$leakName',
          'bookingId': '$bookingId',
          'leakDate': '$leakDate',
          'leakGain': { $ifNull: ['$leakGain', 0] },
          // Exemple de calcul : Une fuite de 3000 €  est l’équivalent de 3000 /0,078 = 38 461 KWh
          // et l'équivalent en émission CO2 de (38 461 *0,4281 )/1000 = 16,5
          'leakCo2': { $multiply: [{ $multiply: ['$leakCost', 12.8205, 0.4281] }, 0.001] },
          'leakDbRms': '$leakDbRms',
          'leakK': '$leakK',
          'leakFlow': '$leakFlow',
          'leakCost': '$leakCost',
          'leakCurrency': '$leakCurrency',
          'leakImgUrl': '$leakImgUrl',
          'leakCoord': '$leakCoord',
          // If action statut is null, set it 'En cours' by default
          'actionStatut': { $ifNull: ['$actionStatut', 'En cours'] },
          'type_action': { $ifNull: ['$type_action', 'Réparation'] },
          'createdOn': '$createdOn',
          'actionCost': { $ifNull: ['$actionCost', 0] },
          'actionDelai': { $ifNull: ['$actionDelai', ''] },
          'actionDesc': { $ifNull: ['$actionDesc', ''] },
          'actionPilote': { $ifNull: ['$actionPilote', ''] },
          'num_reservation': '$linkedBooking.num_reservation',
          'bookingStart': '$linkedBooking.start',
          'bookingEnd': '$linkedBooking.end',
          'bookingCreationDate': '$linkedBooking.createdOn',
          'perimeterId': '$linkedPerimeter._id',
          'perimeterCode': '$linkedPerimeter.code',
          'typeMissionId': '$linkedTypeMission._id',
          'typeMission': '$linkedTypeMission.typeMission',
          'equipId': '$linkedEquip._id',
          'equipCode': '$linkedEquip.code',
          'facteur': '$linkedEquip.facteur',
          'userId': '$linkedUser._id',
          'userName': { $concat: ['$linkedUser.firstName', ' ', '$linkedUser.lastName'] },
          // finalGain = cout fuite - cout réparation (seulement sur les actions de réparation cloturées)
          // { $cond: [ <boolean-expression>, <true-case>, <false-case> ] }
          'finalGain': { $cond: [{ $eq: ['$actionStatut', 'Clôturé'] }, { $subtract: ['$leakCost', '$actionCost'] }, 0] }
        }
      },

      {
        $match: {
          'bookingStart': {
            $gte: dateStart, $lte: dateEnd
          }
        }
      },
      // Group by hour, day, week, month and year
      // It's a little complicated!
      // TODO: Find out exactly the date on which the filter will be applied
      // Edit: it's the date of fuite in csv file
      {
        $facet: {
          'leaks': [
          ],

          'totalGain': [
            {
              $group: {
                _id: {date: "$bookingStart", code :"$perimeterCode" },// 

                totalGain: { $sum: '$finalGain' },
              }
            },
          ],
       
        }
      }
    ]);
    res.status(200).json(leaksGainData);
  } catch (e) {
    console.error(e);
    return res.status(500).json('Unexpected error occured');
  }
}





/**
 * Get leaks list of specific booking
 * @param {*} req 
 * @param {*} res 
 */
async function getLeaksOfSpecificBooking(req, res) {
  try {
    // First of all verify JWT (auth token is in the cookies request and valid)
    const verifyCookiesResult = await verifyCookieToken(req);
    if (!verifyCookiesResult.valid) {
      return res.status(401).json(verifyCookiesResult.msg);
    }
    const userId = verifyCookiesResult.msg;
    const foundUser = await User.findById(userId);
    if (!foundUser) {
      return res.status(401).json('Request not permitted');
    }

    const bookingId = req.query.bookingId;
    if (bookingId == null) {
      return res.status(400).json('Id of the booking must be provided');
    }

    const leaksList = await Leak.find({ bookingId: bookingId });
    res.status(200).json(leaksList);
  } catch (e) {
    console.error(e);
    return res.status(500).json('Unexpected error occured');
  }

}



module.exports = {
  addLeak,
  updateLeak,
  getGain,
  getAllLeaks,
  getLeaksOfSpecificBooking,
  deleteLeak,
  getAllLeaksInPdf
};
