
const { addTypeEquiValidation, updateTypeEquiValidation, deleteTEquipValidation } = require('../middlewares/validation');
const TypeEquip = require('../models/typeEquip');
const User = require('../models/user');

const { verifyCookieToken } = require('../services');


/**
 * Add new leak
 * @param {*} req 
 * @param {*} res 
 * @returns 
 */
async function addTypeEqui(req, res) {
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
    // Only admin allowed
    const isAdmin = foundUser.isAdmin;
    if (!isAdmin) {
      return res.status(401).json('Request not permitted');
    }

    // Validation of the data
    const { error } = addTypeEquiValidation(req.body);
    if (error) {
      return res.status(400).json(error.details[0].message);
    }

    // Save new TypeEqui
    const newTypeEqui = new TypeEquip({
      typeEquip: req.body.typeEquip,
      description: req.body.description,
      statut: req.body.statut,
      createdBy: userId
    });

    const savedTypeEqui = await newTypeEqui.save();
    res.status(200).json(savedTypeEqui);

  } catch (e) {
    console.error(e);
    res.status(500).json('Unexpected error occured');
  }
}




/**
 * Update Perimeter 
 * 
 * @param {*} req 
 * @param {*} res 
 * @returns 
 */
async function updateTypeEqui(req, res) {
  try {

    // Verify that JWT (auth token is in the cookies request and valid)
    const verifyCookiesResult = await verifyCookieToken(req);
    if (!verifyCookiesResult.valid) {
      return res.status(401).json(verifyCookiesResult.msg);
    }

    // Only an admin or the concerned user are allowed to update their profile
    const userId = verifyCookiesResult.msg;
    const foundUser = await User.findById(userId);
    if (!foundUser) {
      return res.status(401).json('Not allowed');
    }

    // Everything is fine --> update TypeEqui
    const isAdmin = foundUser.isAdmin;

    if (!isAdmin) {
      return res.status(401).json('Request not permitted');
    }

    // Validation of the data
    const { error } = updateTypeEquiValidation(req.body);
    if (error) {
      return res.status(400).json(error.details[0].message);
    }

    const id = req.body.id;
    const typeEquip = req.body.typeEquip;
    const description = req.body.description;
    const statut = req.body.statut;


    if (typeEquip) {
      // If code was updated, verify that it's available
      const typeEquipExists = await TypeEquip.find({ _id: { $ne: id }, typeEquip: typeEquip });
      if (typeEquipExists.length > 0) {
        return res.status(400).json('Type d\'équipement code already exists');
      }
    }


    // Verify that the equip type with the requested id exists
    const foundEquip = await TypeEquip.findById(id);
    if (!foundEquip) {
      return res.status(404).json('Can\'t find the equipement to update');
    }

    // If the user provided the same data as the existing perimeter, return empty response
    if (foundEquip.typeEquip == typeEquip && foundEquip.description == description && (foundEquip.statut + '') == statut) {
      return res.status(200).json('');
    }


    // Perform the update
    const update = {
      typeEquip: typeEquip ? typeEquip : undefined,
      description: description ? description : undefined,
      statut: statut
    }
    const updatedTyEquip = await TypeEquip.findByIdAndUpdate(id, update, { new: true });
    return res.status(200).json(updatedTyEquip);


  } catch (e) {
    console.error(e);
    return res.status(500).json('Unexpected error occured');
  }
}


async function deleteTypeEquip(req, res) {
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
    const { error } = deleteTEquipValidation(req.body);
    if (error) {
      return res.status(400).json(error.details[0].message);
    }

    // Perform delete
    const id = req.body.id;
    const deletedTEq = await TypeEquip.findByIdAndDelete(id);
    if (deletedTEq) {
      return res.status(200).json(deletedTEq);
    }
    return res.status(400).json('Cannot find Equip type with the provided id');

  } catch (e) {
    console.error(e);
    return res.status(500).json('Unexpected error occured');
  }
}





/** 
 * Get all activated types equipements (statut = true)
 * 
 */
async function getActTypeEquis(req, res) {
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

  TypeEquip.find({ statut: true })
    .populate("createdBy")
    .exec((err, actTypeEqps) => {
      if (err) {
        console.error(err);
        res.status(400).json('Unexpected error occured');
      }
      res.status(200).json(actTypeEqps);
    });
}








/**
 * Get typeEquip list with pagination and filtering
 * @param {*} req 
 * @param {*} res 
 * @returns 
 */
async function getAllTypeEqui(req, res) {
  try {
    // First of all verify that JWT (auth token is in the cookies request and valid)
    const verifyCookiesResult = await verifyCookieToken(req);
    if (!verifyCookiesResult.valid) {
      return res.status(401).json(verifyCookiesResult.msg);
    }
    // Only an admin are allowed to retreive typeEquip list
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
    let orderBy = req.query.orderBy ? req.query.orderBy : 'typeEquip';
    let orderDir = req.query.orderDir === 'asc' ? 1 : -1;
    let orderByQuery = {};
    orderByQuery[orderBy] = orderDir;
    // Extarct filter stuffs
    let filter = req.query.filter ? req.query.filter : '';
    const regixFilter = new RegExp(filter, 'i');

    const typeequipsList = await TypeEquip.aggregate([
      {
        $match: {
          $or: [
            { 'typeEquip': regixFilter },
            { 'description': regixFilter },
          ]
        },
      },
      {
        $facet: {
          'typeequips': [
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
    res.status(200).json(typeequipsList);
  } catch (e) {
    console.error(e);
    return res.status(500).json('Unexpected error occured');
  }
}



module.exports = {
  addTypeEqui,
  updateTypeEqui,
  getAllTypeEqui,
  getActTypeEquis,
  deleteTypeEquip
};
