
const { addTypesMissionValidation, updateTypesMissionValidation, deleteTMissValidation } = require('../middlewares/validation');
const TypesMission = require('../models/typeMission');
const User = require('../models/user');

const { verifyCookieToken } = require('../services');


/**
 * Add new leak
 * @param {*} req 
 * @param {*} res 
 * @returns 
 */
async function addTypsMission(req, res) {
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
    const { error } = addTypesMissionValidation(req.body);
    if (error) {
      return res.status(400).json(error.details[0].message);
    }
    // Save new TypeEqui
    const newTypeMission = new TypesMission({
      typeMission: req.body.typeMission,
      description: req.body.description,
      statut: req.body.statut,
      createdBy: userId
    });

    const savedTypeMission = await newTypeMission.save();
    res.status(200).json(savedTypeMission);

  } catch (e) {
    console.error(e);
    res.status(500).json('Unexpected error occured');
  }
}




/**
 * Update Types Mission 
 * 
 * @param {*} req 
 * @param {*} res 
 * @returns 
 */
async function updateTypesMission(req, res) {
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
    const { error } = updateTypesMissionValidation(req.body);
    if (error) {
      return res.status(400).json(error.details[0].message);
    }

    const id = req.body.id;
    const statut = req.body.statut;


    // Verify the email
    const foundtypeM = await TypesMission.findById(id);
    if (!foundtypeM) {
      return res.status(404).json('user to update not found');
    }

    // Perform the update
    const update = {
      statut: statut
    }
    const updatedTyMission = await TypesMission.findByIdAndUpdate(id, update, { new: true });
    return res.status(200).json(updatedTyMission);

  } catch (e) {
    console.error(e);
    return res.status(500).json('Unexpected error occured');
  }
}



async function deleteTypeMission(req, res) {
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
    const { error } = deleteTMissValidation(req.body);
    if (error) {
      return res.status(400).json(error.details[0].message);
    }

    // Perform delete
    const id = req.body.id;
    const deletedTM = await TypesMission.findByIdAndDelete(id);
    if (deletedTM) {
      return res.status(200).json(deletedTM);
    }
    return res.status(400).json('Cannot find Equip type with the provided id');


  } catch (e) {
    console.error(e);
    return res.status(500).json('Unexpected error occured');
  }
}



/**
 * Get Types missions list with pagination and filtering
 * @param {*} req 
 * @param {*} res 
 * @returns 
 */
async function getAllTypesMission(req, res) {
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
    let orderBy = req.query.orderBy ? req.query.orderBy : 'createdOn';
    let orderDir = req.query.orderDir === 'asc' ? 1 : -1;
    let orderByQuery = {};
    orderByQuery[orderBy] = orderDir;
    // Extarct filter stuffs
    let filter = req.query.filter ? req.query.filter : '';
    const regixFilter = new RegExp(filter, 'i');

    const typeeMissionList = await TypesMission.aggregate([
      {
        $match: {
          $or: [
            { 'typeMission': regixFilter },
            { 'description': regixFilter },
          ]
        },
      },
      {
        $facet: {
          'typesmissions': [
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
    res.status(200).json(typeeMissionList);
  } catch (e) {
    console.error(e);
    return res.status(500).json('Unexpected error occured');
  }
}



/**
 * Get all activated typeMission (statut == true)
 */
 async function getActTypesMissions (req, res) {
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

  TypesMission.find({ statut: true })
    .populate("createdBy")
    .exec((err, tMisssion) => {
      if (err) {
        console.error(err);
        res.status(400).json('unexpected error occured');
      }
      res.status(200).json(tMisssion);
    })
}


module.exports = {
  addTypsMission,
  updateTypesMission,
  getAllTypesMission,
  deleteTypeMission,
  getActTypesMissions
};
