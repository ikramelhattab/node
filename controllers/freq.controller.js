
const { updateFreqValidation } = require('../middlewares/validation');
const User = require('../models/user');
const Frequence = require('../models/freq');

const { verifyCookieToken } = require('../services');






/**
 * Update Frequence 
 * 
 * @param {*} req 
 * @param {*} res 
 * @returns 
 */
async function updateFrequence(req, res) {
  try {
    // Verify that JWT (auth token is in the cookies request and valid)
    const verifyCookiesResult = await verifyCookieToken(req);
    if (!verifyCookiesResult.valid) {
      return res.status(401).json(verifyCookiesResult.msg);
    }

    // Only an admin is allowed to change freq controle
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
    const { error } = updateFreqValidation(req.body);
    if (error) {
      return res.status(400).json(error.details[0].message);
    }

    const id = req.body.id;
    const _0_100euro = req.body._0_100euro;
    const _100_500euro = req.body._100_500euro;
    const _500_1500euro = req.body._500_1500euro;
    const _1500euro = req.body._1500euro;
    const horizon = req.body.horizon;

    // Verify that freqcontrole with the requested id exists
    const foundFreq = await Frequence.findById(id);
    if (!foundFreq) {
      return res.status(404).json('Can\'t find the Freq to update');
    }

    // If the user provided the same data as the existing freq, return empty response
    if (foundFreq._0_100euro == _0_100euro && foundFreq._100_500euro == _100_500euro && foundFreq._500_1500euro == _500_1500euro && foundFreq._1500euro == _1500euro && foundFreq.horizon == horizon) {
      return res.status(200).json('');
    }

    // Perform the update
    const update = {
      _0_100euro: _0_100euro ? _0_100euro : undefined,
      _100_500euro: _100_500euro ? _100_500euro : undefined,
      _500_1500euro: _500_1500euro ? _500_1500euro : undefined,
      _1500euro: _1500euro ? _1500euro : undefined,
      horizon: horizon ? horizon : undefined
    }

    // Everything is fine --> update freq control
    const updatedFrequence = await Frequence.findByIdAndUpdate(id, update, { new: true });
    return res.status(200).json(updatedFrequence);

  } catch (e) {
    console.error(e);
    return res.status(500).json('Unexpected error occured');
  }
}





async function getAllFrequence(req, res) {
  // Verify that JWT (auth token is in the cookies request and valid)
  const verifyCookiesResult = await verifyCookieToken(req);
  if (!verifyCookiesResult.valid) {
    return res.status(401).json(verifyCookiesResult.msg);
  }
  const userId = verifyCookiesResult.msg;
  const foundUser = await User.findById(userId);
  if (!foundUser) {
    return res.status(401).json('Not allowed');
  }

  const freqControles = await Frequence.find();
  return res.status(200).json(freqControles[0]);

}

module.exports = {
  updateFrequence,
  getAllFrequence,

};
