const bcrypt = require('bcryptjs');
const { loginValidation, registerValidation, oneUserValidation, updateUserValidation, doesUserHavePasswordValidation } = require('../middlewares/validation');
const User = require('../models/user');
const jwt = require('jsonwebtoken');
const { decodeToken, verifyCookieToken } = require('../services');
// const cookie = require('cookie')




/**
 * An API to find out if a user have a password or not
 * @param {*} req 
 * @param {*} res 
 * @returns 
 */
async function doesUserHavePassword(req, res) {
    try {
        // Validation of the data
        const { error } = doesUserHavePasswordValidation(req.body);
        if (error) {
            return res.status(400).json(error.details[0].message);
        }
        const email = req.body.email;
        // See if email exists
        const foundUser = await User.findOne({ email: email });
        if (!foundUser) {
            return res.status(400).json('Email does not exist');
        }
        let foundUserObj = foundUser.toObject();
        delete foundUserObj.password;
        if (foundUser.password == null) {
            return res.status(200).json({ passwordExist: false, user: foundUserObj });
        }
        return res.status(200).json({ passwordExist: true, user: foundUserObj });
    } catch (e) {
        console.error(e);
        return res.status(500).json('An unexpected error occurred');
    }
}



/**
 * Login
 * @param {*} req 
 * @param {*} res 
 * @returns 
 */
async function login(req, res, next) {
    try {
        // Validation of the data
        const { error } = loginValidation(req.body);
        if (error) {
            return res.status(400).json(error.details[0].message);
        }
        const email = req.body.email;
        const password = req.body.password;
        const rememberme = req.body.rememberme;

        // See if the email exists
        const foundUser = await User.findOne({ email: email });
        if (!foundUser) {
            return res.status(400).json('Email does not exists');
        }
        let foundUserObj = foundUser.toObject();
        delete foundUserObj.password;
        // Password comparaison
        const validPass = await bcrypt.compare(password, foundUser.password);
        if (!validPass) {
            return res.status(400).json('Wrong password');
        }

        // Everything is fine
        // Create and assign a token
        const token = jwt.sign({ _id: foundUser._id }, process.env.ACCESS_TOKEN_SECRET);
        // Update lastSignIn date
        await User.findByIdAndUpdate(foundUser._id, { 'lastSignIn': new Date() });

        // Send token through http only cookie
        res.cookie('tarsierToken', token, {
            // Cookie expires after a month if rememberme, session cookie if not
            expires: rememberme ? new Date(Date.now() + 2629800000) : 0,
            secure: true,
            httpOnly: true,
            sameSite: 'none' // TODO: delete sameSite property before the final delivery
        });
        // Send login date as normal cookie so we can use it back on the auth guard in the frontend
        res.cookie('login', new Date().toUTCString(), {
            expires: rememberme ? new Date(Date.now() + 2629800000) : 0,
            secure: true,
            httpOnly: false,
            sameSite: 'none' // TODO: delete sameSite property before the final delivery 
        });

        res.set('Access-Control-Allow-Credentials', 'true');
        res.status(200).json(foundUserObj);
        next();

    } catch (e) {
        console.error(e);
        return res.status(500).json(e);
    }
}



/**
 * Create password and login
 * This API used when the user try to login for the first time
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 * @returns 
 */
async function createPasswordAndLogin(req, res, next) {
    try {
        // Validation of the data
        const { error } = loginValidation(req.body);
        if (error) {
            return res.status(400).json(error.details[0].message);
        }
        const email = req.body.email;
        const password = req.body.password;
        const rememberme = req.body.rememberme;

        const foundUser = await User.findOne({ email: email });
        if (!foundUser) {
            return res.status(400).json('Email does not exist');
        }
        if (foundUser.password) {
            return res.status(400).json('User already have a password');
        }

        // Encrypt password
        const salt = 10;
        const hashedPassword = await bcrypt.hash(password, salt);

        // Update the user with the password
        const updatedUser = await User.findOneAndUpdate({ email: email }, { password: hashedPassword }, { new: true });
        let updatedUserObj = updatedUser.toObject();
        delete updatedUserObj.password;

        // Create and assign a token
        const token = jwt.sign({ _id: updatedUser._id }, process.env.ACCESS_TOKEN_SECRET);
        // Update lastSignIn date
        await User.findByIdAndUpdate(foundUser._id, { 'lastSignIn': new Date() });

        // Send token through http only cookie
        res.cookie('tarsierToken', token, {
            // Cookie expires after a month if rememberme, session cookie if not
            expires: rememberme ? new Date(Date.now() + 2629800000) : 0,
            secure: true,
            httpOnly: true,
            sameSite: 'none' // TODO: delete sameSite property before the final delivery
        });
        // Send login date as normal cookie so we can use it back on the auth guard in the frontend
        res.cookie('login', new Date().toUTCString(), {
            expires: rememberme ? new Date(Date.now() + 2629800000) : 0,
            secure: true,
            httpOnly: false,
            sameSite: 'none' // TODO: delete sameSite property before the final delivery 
        });
        res.set('Access-Control-Allow-Credentials', 'true');
        res.status(200).json(updatedUserObj);
        next();
    } catch (e) {
        console.error('Unexpected error occured');
        console.error(e);
    }
}






/**
 * Add new admin
 * @param {*} req 
 * @param {*} res 
 * @returns 
 */
async function registerAdmin(req, res) {
    // Validation of the data
    const { error } = registerValidation(req.body);
    if (error) {
        return res.status(400).json(error.details[0].message);
    }
    const email = req.body.email;
    const password = req.body.password;
    const firstName = req.body.firstName;
    const lastName = req.body.lastName;

    // Cheking if the user already in the database
    const emailExist = await User.findOne({ email: req.body.email });
    if (emailExist) {
        return res.status(400).json('This email already exists');
    }

    // Encrypt password
    const salt = 10;
    const hashedPassword = await bcrypt.hash(password, salt);

    // Save admin
    const newAdmin = new User({
        firstName: firstName,
        lastName: lastName,
        email: email,
        password: hashedPassword,
        isAdmin: true
    });
    try {
        const savedAdmin = await newAdmin.save();
        let savedAdminObj = savedAdmin.toObject();
        delete savedAdminObj.password;
        // Create an assign token
        // const token = jwt.sign({ _id: savedAdmin._id }, process.env.ACCESS_TOKEN_SECRET);
        // Send the created admin as response
        res.status(200).json(savedAdminObj);
    } catch (error) {
        console.error(error);
        res.status(500).json(error);
    }
}




/**
 * Add new user by an admin
 * @param {*} req 
 * @param {*} res 
 * @returns 
 */
async function registerUser(req, res) {

    // Validation of the data
    const { error } = registerValidation(req.body);
    if (error) {
        return res.status(400).json(error.details[0].message);
    }

    // Verify that JWT (auth token is in the cookies request and valid)
    const verifyCookiesResult = await verifyCookieToken(req);
    if (!verifyCookiesResult.valid) {
        return res.status(401).json(verifyCookiesResult.msg);
    }
    // Only an admin are allowed to retreive users list
    const adminId = verifyCookiesResult.msg;
    const foundAdmin = await User.findById(adminId);
    if (!foundAdmin) {
        return res.status(401).json('Not allowed');
    }
    if (!foundAdmin.isAdmin) {
        return res.status(401).json('Not allowed');
    }

    // Find out if the user email alredy exists
    const foundUser = await User.findOne({ email: req.body.email });
    if (foundUser) {
        return res.status(400).json('Email already exists');
    }

    // Everything is ok to add new user
    const email = req.body.email;
    const firstName = req.body.firstName;
    const lastName = req.body.lastName;

    // Save new user
    const newUser = User({
        firstName: firstName,
        lastName: lastName,
        email: email,
        createdBy: adminId
    });
    try {
        const savedUser = await newUser.save();
        res.status(200).json(savedUser);
    } catch (e) {
        console.error(e);
        res.status(500).json(e);
    }
}






/**
 * Get all users list
 * @param {*} req 
 * @param {*} res 
 * 
 * With pagination, sorting and filtring
 */
async function getUsers(req, res) {
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
        let orderBy = req.query.orderBy ? req.query.orderBy : 'lastSignIn';
        let orderDir = req.query.orderDir === 'asc' ? 1 : -1;
        let orderByQuery = {};
        orderByQuery['_id.' + orderBy] = orderDir;
        // Extarct filter stuffs
        let filter = req.query.filter ? req.query.filter : '';
        const regixFilter = new RegExp(filter, 'i');

        // Filtering, pagination and ordering in one aggregation
        const usersList = await User.aggregate([
            // The fields that we need
            {
                $project: {
                    'fullName': { $concat: ['$firstName', ' ', '$lastName'] },
                    'firstName': '$firstName',
                    'lastName': '$lastName',
                    'email': '$email',
                    'isAdmin': '$isAdmin',
                    'createdBy': '$createdBy',
                    'createdOn': '$createdOn',
                    'lastSignIn': '$lastSignIn'
                }
            },
            {
                $match: {
                    $or: [
                        { 'firstName': regixFilter },
                        { 'lastName': regixFilter },
                        { 'email': regixFilter },
                        { 'fullName': regixFilter }
                    ]
                }
            },
            {
                $facet: {
                    'users': [
                        // lookup is like populate --> get the admin who created this user and add it 
                        // to the new field "created"
                        { $lookup: { from: 'users', localField: 'createdBy', foreignField: '_id', as: 'created' } },
                        // unwind to make the new "created" field as an object
                        // preserveNullAndEmptyArrays: without it, a user (Admin) who doesn't have 
                        // "createdBy" field will not be returned by the request
                        { $unwind: { path: '$created', preserveNullAndEmptyArrays: true } },
                        {
                            $group: {
                                '_id': {
                                    '_id': '$_id',
                                    'firstName': '$firstName',
                                    'lastName': '$lastName',
                                    'email': '$email',
                                    'isAdmin': '$isAdmin',
                                    'createdByFN': '$created.firstName',
                                    'createdByLN': '$created.lastName',
                                    'createdOn': '$createdOn',
                                    'lastSignIn': '$lastSignIn'
                                }
                            }
                        },
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
            },
        ]);

        // Before returning the response, refine the results
        const users = usersList[0].users;
        for (let i = 0; i < users.length; i++) {
            let refinedUser = [];
            let user = users[i];
            for (let key of Object.keys(user)) {
                refinedUser = user[key];
            }
            users[i] = refinedUser;
        }
        usersList[0].users = users;

        // Return the response finally
        res.status(200).json(usersList);

    } catch (e) {
        console.error(e);
        return res.status(500).json('Unexpected error occured');
    }
}










/**
 * Get details of one user (from a POST request)
 * @param {*} req 
 * @param {*} res 
 * @returns 
 */
async function getOneUser(req, res) {

    try {
        // Validation of the data
        const { error } = oneUserValidation(req.body);
        if (error) {
            return res.status(400).json(error.details[0].message);
        }
        const userIdToGet = req.body.id;

        // Verify that JWT (auth token is in the cookies request and valid)
        const verifyCookiesResult = await verifyCookieToken(req);
        if (!verifyCookiesResult.valid) {
            return res.status(401).json(verifyCookiesResult.msg);
        }

        // Only and admin or the concerned user are allowed to get user details
        const userId = verifyCookiesResult.msg;
        const foundUser = await User.findById(userId);
        if (!foundUser) {
            return res.status(401).json('Not allowed');
        }
        const isAdmin = foundUser.isAdmin;

        if ((userId.toString() === userIdToGet.toString()) || isAdmin) {
            // User allowed to view
            const userToGet = await User.findById(userIdToGet);
            if (!userToGet) {
                return res.status(404).json('User not found');
            }
            const userToGetObj = userToGet.toObject();
            delete userToGetObj.password;
            return res.status(200).json(userToGetObj);
        } else {
            // User not allowed to view
            return res.status(401).json('Not allowed');
        }

    } catch (e) {
        console.error(e);
        return res.status(500).json('Unexpected error occured');
    }
}





/**
 * Update user document
 * @param {*} req 
 * @param {*} res 
 * @returns 
 */
async function updateOneUser(req, res) {
    try {
        // Validation of the data
        const { error } = updateUserValidation(req.body);
        if (error) {
            return res.status(400).json(error.details[0].message);
        }

        const userIdToUpdate = req.body.id;
        const firstName = req.body.firstName;
        const lastName = req.body.lastName;
        const email = req.body.email;
        const password = req.body.password;
        let hashedPassword = null;

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
        const isAdmin = foundUser.isAdmin;
        if ((userId.toString() === userIdToUpdate.toString()) || isAdmin) {
            // ---
            // User are allowed to update
            // ---

            // Hash password if password exist in the request
            if (password) {
                const salt = 10;
                hashedPassword = await bcrypt.hash(password, salt);
            }

            // Verify the email
            const userToUpdate = await User.findById(userIdToUpdate);
            if (!userToUpdate) {
                return res.status(404).json('user to update not found');
            }
            const userEmailBeforeUpdate = userToUpdate.email;
            if (email && email != userEmailBeforeUpdate) {
                const foundUserEmail = await User.findOne({ email: email });
                if (foundUserEmail) {
                    return res.status(404).json('Email already exists');
                }
            }

            // Perform the update
            const update = {
                firstName: firstName ? firstName : undefined,
                lastName: lastName ? lastName : undefined,
                email: email ? email : undefined,
                password: hashedPassword ? hashedPassword : undefined
            }
            const updatedUser = await User.findByIdAndUpdate(userIdToUpdate, update, { new: true });
            return res.status(200).json(updatedUser);

        } else {
            // User not allowed to update
            return res.status(401).json('Not allowed');
        }

    } catch (e) {
        console.error(e);
        return res.status(500).json('Unexpected error occured');
    }
}




async function deleteOneUser(req, res) {
    try {

        // Validation of the data
        const { error } = oneUserValidation(req.body);
        if (error) {
            return res.status(400).json(error.details[0].message);
        }
        const userIdToDelete = req.body.id;

        // Verify that JWT (auth token is in the cookies request and valid)
        const verifyCookiesResult = await verifyCookieToken(req);
        if (!verifyCookiesResult.valid) {
            return res.status(401).json(verifyCookiesResult.msg);
        }

        // Only an admin are allowed to delete a user profile
        const userId = verifyCookiesResult.msg;
        const foundUser = await User.findById(userId);
        if (!foundUser) {
            return res.status(401).json('Not allowed');
        }
        const isAdmin = foundUser.isAdmin;
        if (!isAdmin) {
            return res.status(401).json('Not allowed');
        }

        // Also, admin is not allowed to delete their profile or others admins profiles
        if (userIdToDelete.toString() == userId.toString()) {
            return res.status(401).json('Action not permitted');
        }
        const userToDelete = await User.findById(userIdToDelete);
        const isUserToDeleteAdmin = userToDelete.isAdmin;
        if (isUserToDeleteAdmin) {
            return res.status(401).json('Action not permitted');
        }

        // Perform delete
        const deletedUser = await User.findByIdAndDelete(userIdToDelete);
        return res.status(200).json(deletedUser);


    } catch (e) {
        console.error(e);
        return res.status(500).json('Unexpected error occured');
    }
}






/** 
 * Function to verify if the user are signed in 
 * and return there info if they are logged in.
 * 
 * This api is called whenever the web app start.
 */
async function isLoggedIn(req, res) {
    try {

        // First of all verify that JWT (auth token is in the cookies request and valid)
        const verifyCookiesResult = await verifyCookieToken(req);
        if (!verifyCookiesResult.valid) {
            return res.status(401).json(verifyCookiesResult.msg);
        }

        const userId = verifyCookiesResult.msg;
        const foundUser = await User.findById(userId);
        if (!foundUser) {
            return res.status(404).json('No user found');
        }
        // Update lastSignIn
        await User.findByIdAndUpdate(foundUser._id, { 'lastSignIn': new Date() });

        // Return the user
        let foundUserObj = foundUser.toObject();
        delete foundUserObj.password;
        return res.status(200).json(foundUserObj);

    } catch (e) {
        console.error(e);
        return res.status(500).json('Unexpected error occured');
    }
}






/**
 * Logout API
 * @param {*} req 
 * @param {*} res 
 */
async function logOut(req, res) {
    try {
        // Remove all cookies
        res.cookie('tarsierToken', '', {
            expires: 0,
            secure: true,
            httpOnly: true,
            sameSite: 'none' // TODO: Delete sameSite property before delivery
        });
        res.cookie('login', '', {
            expires: 0,
            secure: true,
            httpOnly: false,
            sameSite: 'none' // TODO: Delete sameSite property before delivery
        });
        res.status(200).json('success');
    } catch (e) {
        console.error(e);
        res.status(500).json('Unexpected error occured');
    }
}




/** 
 * Decode Token
 */
async function decode(req, res) {
    try {
        const token = req.body.token;
        const decodeResult = await decodeToken(token);
        return res.status(decodeResult.code).json(decodeResult.message);
    } catch (e) {
        console.error(e);
        return res.status(500).json('Unexpected error occured');
    }
}







module.exports = {
    doesUserHavePassword,
    login,
    createPasswordAndLogin,
    registerAdmin,
    registerUser,
    decode,
    isLoggedIn,
    logOut,
    getUsers,
    getOneUser,
    updateOneUser,
    deleteOneUser
};
