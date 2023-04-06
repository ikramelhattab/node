
const { addEquipValidation, updateEquipValidation, deleteEquipValidation } = require('../middlewares/validation');
const Equipement = require('../models/equipement');
const User = require('../models/user');
const EquipChange = require('../models/equipChange.js');

const { verifyCookieToken, uploadToCloudinary } = require('../services');


/**
 * Add new leak
 * @param {*} req 
 * @param {*} res 
 * @returns 
 */
async function addEquip(req, res) {
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
    const isAdmin = foundUser.isAdmin;
    if (!isAdmin) {
      return res.status(401).json('Request not permitted');
    }

    // Validation of the data
    const { error } = addEquipValidation(req.body);
    if (error) {
      return res.status(400).json(error.details[0].message);
    }


    // Don't allow Equipement with the same code
    const equipementExists = await Equipement.findOne({ code: req.body.code });
    if (equipementExists) {
      return res.status(400).json('Equipement code already exists');
    }
    const imgFile = req.file;

    //    Validation of the image file
    if (imgFile == null) {
      return res.status(400).json('"image" is required');
    }
    if (imgFile.mimetype !== 'image/png' && imgFile.mimetype !== 'image/jpeg' && imgFile.mimetype !== 'image/jpg') {
      return res.status(400).json('Image file format not supported');
    }
    let photoUrl = '';
    // Upload eqp image and get url
    photoUrl = await uploadToCloudinary(imgFile, "tarsier_equipement");

    // Save new eqp
    const newequipement = new Equipement({
      code: req.body.code,
      description: req.body.description,
      typeEquipId: req.body.typeEquip,
      statut: req.body.statut,
      photoUrl: photoUrl,
      facteur: req.body.facteur,
      createdBy: userId
    });

    const savedEquipement = await newequipement.save();

    // Save new eqp change 
    const newChange = new EquipChange({
      equipement: savedEquipement._id,
      facteur: req.body.facteur,
    });
    await newChange.save();

    res.status(200).json(savedEquipement);

  } catch (e) {
    console.error(e);
    res.status(500).json('Unexpected error occured');
  }
}




/**
 * Update Equipement 
 * 
 * @param {*} req 
 * @param {*} res 
 * @returns 
 */
async function updateEquipement(req, res) {
  try {

    // Verify that JWT (auth token is in the cookies request and valid)
    const verifyCookiesResult = await verifyCookieToken(req);
    if (!verifyCookiesResult.valid) {
      return res.status(401).json(verifyCookiesResult.msg);
    }

    // Only an admin is allowed to update eqp
    const userId = verifyCookiesResult.msg;
    const foundUser = await User.findById(userId);
    if (!foundUser) {
      return res.status(401).json('Not allowed');
    }

    const isAdmin = foundUser.isAdmin;

    if (!isAdmin) {
      return res.status(401).json('Request not permitted');
    }

    // Validation of the data
    const { error } = updateEquipValidation(req.body);
    if (error) {
      return res.status(400).json(error.details[0].message);
    }


    const id = req.body.id;
    const typeEquipId = req.body.typeEquipId;
    const code = req.body.code;
    const description = req.body.description;
    const statut = req.body.statut;
    const facteur = req.body.facteur;
    let photoUrl = undefined;


    if (code) {
      // If code was updated, verify that it's available
      const equipExists = await Equipement.find({ _id: { $ne: id }, code: code });
      if (equipExists.length > 0) {
        return res.status(400).json('Equipement code already exists');
      }
    }

    // Verify that the peri with the requested id exists
    const foundEquip = await Equipement.findById(id);
    if (!foundEquip) {
      return res.status(404).json('Can\'t find the Equipement to update');
    }

    let file = req.file;

    // If the user provided the same data as the existing equip, return empty response
    if (foundEquip.code == code && foundEquip.description == description
      && foundEquip.typeEquipId == typeEquipId && (foundEquip.statut + '') == statut
      && !file && foundEquip.facteur == facteur) {
      return res.status(200).json('');
    }

    if (file) {
      // If the eqp photo was changed
      if (file.mimetype !== 'image/png' && file.mimetype !== 'image/jpg' && file.mimetype !== 'image/jpeg') {
        return res.status(400).json('Image format not supported');
      }
      photoUrl = await uploadToCloudinary(file, "tarsier_equips");
    }


    // Perform the update
    const update = {
      code: code ? code : undefined,
      typeEquipId: typeEquipId ? typeEquipId : undefined,
      description: description ? description : undefined,
      statut: statut,
      facteur: facteur ? facteur : undefined,
      photoUrl: photoUrl
    }

    const updatedEquip = await Equipement.findByIdAndUpdate(id, update, { new: true });

    // Save new equipChange if facteur changed
    if (facteur && (foundEquip.facteur != facteur)) {
      const newChange = new EquipChange({
        equipement: id,
        facteur: facteur,
      });
      await newChange.save();
    }

    return res.status(200).json(updatedEquip);

  } catch (e) {
    console.error(e);
    return res.status(500).json('Unexpected error occured');
  }

}




async function deleteEquipement(req, res) {
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
    const isAdmin = foundUser.isAdmin;
    if (!isAdmin) {
      return res.status(401).json('Request not permitted');
    }

    // Validation of the data
    const { error } = deleteEquipValidation(req.body);
    if (error) {
      return res.status(400).json(error.details[0].message);
    }

    // Perform delete
    const id = req.body.id;
    const deletedEquip = await Equipement.findByIdAndDelete(id);
    if (deletedEquip) {
      const newChange = new EquipChange({
        equipement: id,
        facteur: deletedEquip.facteur,
      });
      await newChange.save();
      return res.status(200).json(deletedEquip);

    }
    return res.status(400).json('Cannot find Equipement with the provided id');


  } catch (e) {
    console.error(e);
    return res.status(500).json('Unexpected error occured');
  }
}











/**
 * Get equipements list with pagination and filtering
 * @param {*} req 
 * @param {*} res 
 * @returns 
 */
async function getAllEquipements(req, res) {
  try {

    // First of all verify that JWT (auth token is in the cookies request and valid)
    const verifyCookiesResult = await verifyCookieToken(req);
    if (!verifyCookiesResult.valid) {
      return res.status(401).json(verifyCookiesResult.msg);
    }
    // Only an admin are allowed to retreive users list
    const userId = verifyCookiesResult.msg;
    const foundAdmin = await User.findById(userId);
    if (!foundAdmin) {
      return res.status(401).json('Not allowed');
    }
    if (!foundAdmin.isAdmin) {
      return res.status(401).json('Not allowed');
    }

    // Extract pagination stuffs
    let pageNumber = req.query.page >= 1 ? +req.query.page : 1;
    let pageSize = req.query.pageSize >= 1 ? req.query.pageSize : 10;
    pageNumber = pageNumber - 1;
    pageSize = +pageSize;
    // Extract order by stuffs
    let orderBy = req.query.orderBy ? req.query.orderBy : 'code';
    let orderDir = req.query.orderDir === 'asc' ? 1 : -1;
    let orderByQuery = {};
    orderByQuery[orderBy] = orderDir;
    // Extarct filter stuffs
    let filter = req.query.filter ? req.query.filter : '';
    const regixFilter = new RegExp(filter, 'i');

    const equipList = await Equipement.aggregate([
      {
        $lookup: {
          from: 'typeequips', // Name of the foreign document
          localField: 'typeEquipId',
          foreignField: '_id',
          as: 'typeEquip'
        }
      },
      {
        $unwind: {
          path: '$typeEquip',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $match: {
          $or: [
            { 'code': regixFilter },
            { 'description': regixFilter },
          ]
        },
      },
      {
        $facet: {
          'equipements': [
            // sort
            { $sort: orderByQuery },
            // pagination
            { $skip: pageNumber * pageSize },
            { $limit: pageSize },
          ],
          'total': [
            { $count: 'count' }
          ]
        }
      }
    ]);
    res.status(200).json(equipList);
  } catch (e) {
    console.error(e);
    return res.status(500).json('Unexpected error occured');
  }
}

/**
 * Get all activated Equipements (statut == true)
 */
async function getActEquis(req, res) {
  // First verify that JWT (auth token) is in the cookies and valid
  const verifyCookiesResult = await verifyCookieToken(req);
  if (!verifyCookiesResult.valid) {
    return res.status(401).json(verifyCookiesResult.msg);
  }
  const userId = verifyCookiesResult.msg;
  const foundUser = await User.findById(userId);
  if (!foundUser) {
    return res.status(401).json('Not allowed');
  }

  Equipement.find({ statut: true })
    .populate("createdBy")
    .exec((err, equip) => {
      if (err) {
        console.error(err);
        res.status(400).json('unexpected error occured');
      }
      res.status(200).json(equip);
    });
}



/**
 * Get facteur of equipId depending on specific date
 * because we need to keep track of old "facteur"
 */
async function getFacteur(req, res) {
  try {
    // First verify that JWT (auth token) is in the cookies and valid
    const verifyCookiesResult = await verifyCookieToken(req);
    if (!verifyCookiesResult.valid) {
      return res.status(401).json(verifyCookiesResult.msg);
    }
    const userId = verifyCookiesResult.msg;
    const foundUser = await User.findById(userId);
    if (!foundUser) {
      return res.status(401).json('Not allowed');
    }
    let date = req.query.date;
    const equipId = req.query.equipId;
    if (date == null || equipId == null) {
      return res.status(400).json('"date" and "equipId" are required');
    }
    date = new Date(date);
    const equipChange = await EquipChange.find({
      equipement: equipId,
      changeDate: { $lte: date }
    }).sort({ changeDate: 'desc' }).limit(1);
    if (equipChange.length == 0) {
      const equipement = await Equipement.findById(equipId);
      return res.status(200).json(equipement.facteur);
    }
    return res.status(200).json(equipChange[0].facteur);
  } catch (e) {
    console.error(e);
    return res.status(500).json('Unexpected error occured');
  }
}


module.exports = {
  addEquip,
  updateEquipement,
  getAllEquipements,
  deleteEquipement,
  getActEquis,
  getFacteur
};
