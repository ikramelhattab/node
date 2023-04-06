const { default: axios } = require('axios');
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');
const pdfToPng = require('pdf-to-png-converter').pdfToPng;

module.exports = new (class Service {
    constructor() {
    }

    /**
     * Decode JWT token
     * 
     * @param {*} token 
     * @returns Object
     */
    decodeToken = async (token) => {
        const decodedToken = jwt.decode(token, { complete: true });
        if (!decodedToken) {
            console.error('provided token does not decode as JWT');
            return { valid: false, code: 500, message: 'provided token does not decode as JWT' };
        }
        const id = decodedToken.payload._id;
        try {
            let foundUser = await User.findById(id);
            if (foundUser) {
                foundUser = foundUser.toObject();
                delete foundUser.password;
                return { valid: true, code: 200, message: foundUser };
            } else {
                return { valid: false, code: 400, message: 'There is no user found with this token' };
            }
        } catch (e) {
            return { valid: false, code: 500, message: e };
        }
    }


    /**
     * Verify if the request contains JWT token to allow user access API
     * 
     * @param {*} req 
     * @returns object
     */
    verifyCookieToken = async (req) => {
        if (!req.cookies) {
            return { valid: false, msg: 'Cookies are not defined' };
        }
        const token = req.cookies.tarsierToken || '';
        if (!token) {
            return { valid: false, msg: 'Token does not exist' };
        }
        const decodeResult = await this.decodeToken(token);
        if (!decodeResult.valid) {
            return { valid: false, msg: 'Invalid token' };
        }
        const userId = decodeResult.message._id;
        return { valid: true, msg: userId };
    }


    /**
     * Is d a valid date?
     * @param {*} d 
     * @returns Boolean
     */
    isValidDate = (d) => {
        return d instanceof Date && !isNaN(d);
    }



    /**
     * Send emails
     * @param {*} title 
     * @param {*} message 
     * @param {*} recipientEmails 
     */
    sendEmails = (title, message, recipientEmails) => {
        // TODO: Better to use nodemailer so the project has it's own email sender
        recipientEmails.forEach(mail => {
            axios.post('https://smartlogger.ovh/email', {
                name: 'Reservation équipement',
                from: 'alerte@smartlogger.tn',
                sendTo: mail,
                subject: title,
                message: message
            }).catch(error => {
                console.error('error on sending email to:' + mail);
                console.error(error);
            });
        });
    }


    /**
     * Convert date to date string
     * @param {*} d 
     * @returns 
     */
    toDate = (d) => {
        // TODO: Deal with time zone later
        const hourStr = ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2);
        const dateStr = ('0' + d.getDate()).slice(-2) + '/' + ('0' + (d.getMonth() + 1)).slice(-2) + '/'
            + d.getFullYear();
        return dateStr + ' ' + hourStr;
    }



    /**
     * Upload file to cloudinary
     * @param {*} file 
     * @param {*} folderName 
     * @param {*} isBuffer: Specify whether the file is a buffer
     * @returns 
     */
    uploadToCloudinary = async (file, folderName, isBuffer) => {
        return new Promise((resolve, reject) => {
            let cloudinaryUploader = cloudinary.uploader.upload_stream(
                { folder: folderName }, (err, result) => {
                    if (err) {
                        reject(err);

                    } else if (result) {
                        resolve(result.secure_url);
                    }
                }
            );
            if (isBuffer) {
                streamifier.createReadStream(file).pipe(cloudinaryUploader);
            } else {
                streamifier.createReadStream(file.buffer).pipe(cloudinaryUploader);
            }
        });
    }

    /**
     * Upload thumb version of an image to cloudinary
     * 
     * @param {*} file File
     * @param {*} folderName String
     * @param {*} isBuffer: Specify whether the file is a buffer
     * @returns Promise of the uploaded thumb image URL
     */
    async uploadThumbToCloudinary(file, folderName, isBuffer) {
        return new Promise((resolve, reject) => {
            let cloudinaryUploader = cloudinary.uploader.upload_stream(
                { folder: folderName, transformation: [{ width: 384, height: 500, crop: 'thumb' }] },
                (err, result) => {
                    if (err) {
                        reject(err)
                    } else if (result) {
                        resolve(result.secure_url)
                    }
                });
            if (isBuffer) {
                streamifier.createReadStream(file).pipe(cloudinaryUploader);
            } else {
                streamifier.createReadStream(file.buffer).pipe(cloudinaryUploader);
            }
        });
    }


    /**
     * Convert PDF to PNG
     * Using the library pdf-to-png-converter
     * 
     * @param {*} buffer (Buffer)
     * @returns Buffer
     */

    convertPdfToImg = async (buffer) => {
        const pngPage = await pdfToPng(buffer, {
            disableFontFace: false,
            useSystemFonts: false,
            pagesToProcess: [1],
            viewportScale: 2.0
        });
        return pngPage[0].content;
    }

});