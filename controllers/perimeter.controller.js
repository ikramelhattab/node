
const { addPeriValidation, updatePeriValidation, deletePeriValidation } = require('../middlewares/validation');
const Perimeter = require('../models/perimeter');
const User = require('../models/user');
const PeriChange = require('../models/periChange');

const { verifyCookieToken, uploadToCloudinary, convertPdfToImg, uploadThumbToCloudinary } = require('../services');

/**
 * Add new Perimeter
 * @param {*} req 
 * @param {*} res 
 * @returns 
 */
async function addPerimeter(req, res) {
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
    const { error } = addPeriValidation(req.body);
    if (error) {
      return res.status(400).json(error.details[0].message);
    }

    // Don't allow perimeter with the same code
    const perimeterExists = await Perimeter.findOne({ code: req.body.code });
    if (perimeterExists) {
      return res.status(400).json('Perimeter code already exists');
    }

    // Validation of the image file
    const imgFile = req.file;
    if (imgFile == null) {
      return res.status(400).json('"image" is required');
    }
    if (imgFile.mimetype !== 'image/png' && imgFile.mimetype !== 'application/pdf') {
      return res.status(400).json('Plan file format not supported');
    }

    // Upload plan image to get url
    let photoUrl = '';
    let thumbUrl = '';
    // Handle the case where the uploaded plan is a PDF to convert it to png file
    if (imgFile.mimetype == 'application/pdf') {
      
      const bufferFromPdf = await convertPdfToImg(imgFile.buffer);
      photoUrl = await uploadToCloudinary(bufferFromPdf, 'tarsier_plans', true);
      thumbUrl = await uploadThumbToCloudinary(bufferFromPdf, 'tarsier_plans_thumbs', true);
    } else {
      photoUrl = await uploadToCloudinary(imgFile, "tarsier_plans", false);
      thumbUrl = await uploadThumbToCloudinary(imgFile, 'tarsier_plans_thumbs', false);
    }


    // Save new perimeter
    const newPerimeter = new Perimeter({
      code: req.body.code,
      description: req.body.description,
      statut: req.body.statut,
      photoUrl: photoUrl,
      thumbUrl: thumbUrl,
      createdBy: userId
    });
    const savedPerimeter = await newPerimeter.save();

    // Save new PeriChange
    const newChange = new PeriChange({
      perimeter: savedPerimeter._id,
      planUrl: photoUrl
    });
    await newChange.save();
    res.status(200).json(savedPerimeter);

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
async function updatePerimeter(req, res) {
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
    const { error } = updatePeriValidation(req.body);
    if (error) {
      return res.status(400).json(error.details[0].message);
    }

    const id = req.body.id;
    const code = req.body.code;
    const description = req.body.description;
    const statut = req.body.statut;
    const file = req.file;
    let photoUrl = undefined;
    let thumbUrl = undefined;

    if (code) {
      // If code was updated, verify that it's available
      const perimeterExists = await Perimeter.find({ _id: { $ne: id }, code: code });
      if (perimeterExists.length > 0) {
        return res.status(400).json('Perimeter code already exists');
      }
    }

    // Verify that the peri with the requested id exists
    const foundPeri = await Perimeter.findById(id);
    if (!foundPeri) {
      return res.status(404).json('Can\'t find the perimeter to update');
    }

    // If the user provided the same data as the existing perimeter, return empty response
    if (foundPeri.code == code && foundPeri.description == description && (foundPeri.statut + '') == statut && !file) {
      return res.status(200).json('');
    }

    if (file) {
      // If the perimeter plan was changed
      if (file.mimetype !== 'image/png' && file.mimetype !== 'application/pdf') {
        return res.status(400).json('Plan file format not supported');
      }
      // Handle the case where the uploaded plan is a PDF to convert it to png file
      if (file.mimetype == 'application/pdf') {
        const bufferFromPdf = await convertPdfToImg(file.buffer);
        photoUrl = await uploadToCloudinary(bufferFromPdf, 'tarsier_plans', true);
        thumbUrl = await uploadThumbToCloudinary(bufferFromPdf, 'tarsier_plans_thumbs', true);
      } else {
        photoUrl = await uploadToCloudinary(file, "tarsier_plans", false);
        thumbUrl = await uploadThumbToCloudinary(file, 'tarsier_plan_thumbs', false);
      }
    }

    // Perform the update
    const update = {
      code: code ? code : undefined,
      description: description ? description : undefined,
      statut: statut,
      photoUrl: photoUrl,
      thumbUrl: thumbUrl,
      updatedOn: new Date()
    }
    const updatedPeri = await Perimeter.findByIdAndUpdate(id, update, { new: true });

    // Save new PeriChange if the plan changed
    if (photoUrl) {
      const newChange = new PeriChange({
        perimeter: id,
        planUrl: photoUrl
      });
      await newChange.save();
    }

    return res.status(200).json(updatedPeri);

  } catch (e) {
    console.error(e);
    return res.status(500).json('Unexpected error occured');
  }
}




async function deletePerimeter(req, res) {
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
    const { error } = deletePeriValidation(req.body);
    if (error) {
      return res.status(400).json(error.details[0].message);
    }

    // Perform delete
    const id = req.body.id;
    const deletedPeri = await Perimeter.findByIdAndDelete(id);
    if (deletedPeri) {
      return res.status(200).json(deletedPeri);
    }
    return res.status(400).json('Cannot find perimeter with the provided id');


  } catch (e) {
    console.error(e);
    return res.status(500).json('Unexpected error occured');
  }
}




/**
 * Get perimeters list with pagination and filtering
 * @param {*} req 
 * @param {*} res 
 * @returns 
 */
async function getAllPerimeters(req, res) {
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
    const periList = await Perimeter.aggregate([
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
          'perimeters': [
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
    res.status(200).json(periList);
  } catch (e) {
    console.error(e);
    return res.status(500).json('Unexpected error occured');
  }
}



/**
 * Get all activated perimeters (statut == true)
 */
async function getActPeris(req, res) {
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

  Perimeter.find({ statut: true })
    .populate("createdBy")
    .exec((err, peris) => {
      if (err) {
        console.error(err);
        res.status(400).json('unexpected error occured');
      }
      res.status(200).json(peris);
    })
}





module.exports = {
  addPerimeter,
  updatePerimeter,
  getAllPerimeters,
  deletePerimeter,
  getActPeris

};
