const { bookingValidation, deleteBookingValidation, updateBookingValidation } = require('../middlewares/validation');
const Booking = require('../models/booking');
const User = require('../models/user');
const { verifyCookieToken, isValidDate, toDate, sendEmails } = require('../services');


/**
 * Add new booking API
 * @param {*} req 
 * @param {*} res 
 * @returns 
 */
async function addBooking(req, res) {
    try {
        // First of all verify JWT (auth token is in the cookies request and valid)
        const verifyCookiesResult = await verifyCookieToken(req);
        if (!verifyCookiesResult.valid) {
            return res.status(401).json(verifyCookiesResult.msg);
        }
        let userId = verifyCookiesResult.msg;
        const foundUser = await User.findById(userId);
        if (!foundUser) {
            return res.status(401).json('Request not permitted');
        }

        // Validation of the data
        const { error } = bookingValidation(req.body);
        if (error) {
            return res.status(400).json(error.details[0].message);
        }

        let start = req.body.start;
        let end = req.body.end;
        let num_reservation = req.body.num_reservation;
        let typeMissionId = req.body.typeMissionId;
        let perimeterId = req.body.perimeterId;
        let equipId = req.body.equipId;
        let statut = req.body.statut;

        let dateStart = new Date(start);
        let dateEnd = new Date(end);

        // Handle the case where start and end are reversed
        if (dateStart > dateEnd) {
            const swch = start;
            start = end;
            end = swch;
            dateStart = new Date(end);
            dateEnd = new Date(start);
        }

        // Check if date start is less than now (add a 1 minute safe margin to handle slower request)
        if (dateStart.getTime() < new Date().getTime() - 1 * 60 * 1000) {
            return res.status(400).json('invalid start date');
        }

        // Test whether the requested date range is available (overlapped dates with the same equipement)
        const overlappedBookingsList = await Booking.find({
            $and: [
                { equipId: equipId },
                {
                    $or: [
                        { 'start': { $gte: dateStart, $lte: dateEnd } },
                        { 'end': { $gte: dateStart, $lte: dateEnd } },
                        { $and: [{ 'start': { $lte: dateStart } }, { 'end': { $gte: dateEnd } }] },
                    ],
                }
            ]

        });

        if (overlappedBookingsList.length > 0) {
            return res.status(400).json('overlapped');
        }

        // Everthing is OK: Save new booking
        const newBooking = Booking({
            userId: userId,
            start: start,
            end: end,
            num_reservation: num_reservation,
            typeMissionId: typeMissionId,
            perimeterId: perimeterId,
            equipId: equipId,
            statut: statut,
            createdBy: userId,

        });
        const savedBooking = await newBooking.save();

        // Send email to the user and to the admins
        try {

            // Get the email of the user
            let emailsList = [];
            emailsList.push(foundUser.email);

            // Get the list of emails admins
            const adminsList = await User.find({ 'isAdmin': true });
            adminsList.forEach(admin => {
                emailsList.push(admin.email);
            });

            // Remove duplicated emails
            emailsList = [...new Set(emailsList)];


            const title = 'Reservation équipement';
            const message = `Bonjour,\n\rUne nouvelle réservation d'un équipement de détection des fuites a été crée pour l'utilisateur: ${foundUser.firstName} ${foundUser.lastName}\n\r Date de début réservation: ${toDate(dateStart)}\n\r Date de fin réservation: ${toDate(dateEnd)}`;
            sendEmails(title, message, emailsList);

        } catch (e) {
            console.error('Something is wrong in the sending emails logic');
            console.error(e);
        }
        res.status(200).json(savedBooking);
    } catch (e) {
        console.error(e);
        return res.status(500).json('Unexpected error occured');
    }
}




/**
 * Update Booking 
 * 
 * @param {*} req 
 * @param {*} res 
 * @returns 
 */
async function updateBookingStatut(req, res) {
    try {


        // Verify that JWT (auth token is in the cookies request and valid)
        const verifyCookiesResult = await verifyCookieToken(req);
        if (!verifyCookiesResult.valid) {
            return res.status(401).json(verifyCookiesResult.msg);
        }

        // Only an admin or the concerned user are allowed to update their booking
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
        const { error } = updateBookingValidation(req.body);
        if (error) {
            return res.status(400).json(error.details[0].message);
        }

        const id = req.body.id;
        const statut = req.body.statut;


        // Verify the email
        const foundBooking = await Booking.findById(id);
        if (!foundBooking) {
            return res.status(404).json('user to update not found');
        }

        // Perform the update
        const update = {
            statut: statut
        }
        const updatedBooking = await Booking.findByIdAndUpdate(id, update, { new: true });
        return res.status(200).json(updatedBooking);

    } catch (e) {
        console.error(e);
        return res.status(500).json('Unexpected error occured');
    }
}




/**
 * Get bookings list API
 * @param {*} req 
 * @param {*} res 
 * @returns 
 */
async function getBookings(req, res) {
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

        // Extract date range from params
        const filterStartDate = new Date(req.params.start);
        const filterEndDate = new Date(req.params.end);

        let bookingList = [];
        if (isValidDate(filterStartDate) && isValidDate(filterEndDate)) {
            // If there is date range in the params then this is paginated request
            bookingList = await Booking.find({
                $or: [
                    { 'start': { $gte: filterStartDate, $lte: filterEndDate } },
                    {
                        'end': { $gte: filterStartDate, $lte: filterEndDate }
                    },
                    {
                        $and: [{ 'start': { $lte: filterStartDate } }, { 'end': { $gte: filterEndDate } }]
                    },
                ],
            }).populate([
                { path: 'userId', select: 'firstName lastName' },
                { path: 'createdBy', select: 'firstName lastName' },
                { path: 'typeMissionId', select: 'typeMission' },
                { path: 'perimeterId', select: 'code' },
                { path: 'equipId', select: 'code' },

            ]).select('start end userId createBy createdOn typeMissionId perimeterId equipId statut num_reservation');

        } else {
            bookingList = await Booking.find().populate([
                { path: 'userId', select: 'firstName lastName' },
                { path: 'createdBy', select: 'firstName lastName' },
                { path: 'typeMissionId', select: 'typeMission' },
                { path: 'perimeterId', select: 'code' },
                { path: 'equipId', select: 'code' },

            ]).select('start end userId createBy createdOn typeMissionId perimeterId equipId statut num_reservation');
        }
        return res.status(200).json(bookingList);

    } catch (e) {
        console.error(e);
        return res.status(500).json('Unexpected error occured');
    }
}






/**
 * Get bookings list API
 * @param {*} req 
 * @param {*} res 
 * @returns 
 */
async function getBooking(req, res) {
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
        Booking.findById(req.params.id)
            .populate([
                { path: 'userId', select: 'firstName lastName' },
                { path: 'createdBy', select: 'firstName lastName' },
                { path: 'typeMissionId', select: 'typeMission' },
                { path: 'perimeterId', select: 'code photoUrl' },
                { path: 'equipId', select: 'code facteur' },
            ]).select('start end userId createBy createdOn typeMissionId perimeterId equipId statut num_reservation')
            .exec((err, booking) => {
                if (err) {
                    res.status(400).json({
                        message: "Failed to populate",
                        error: err.message,
                    });
                }
                return res.status(200).json(booking);
            })

    } catch (e) {
        console.error(e);
        return res.status(500).json('Unexpected error occured');
    }
}




/**
 * Get bookings list API
 * @param {*} req 
 * @param {*} res 
 * @returns 
 */
async function getAllBookings(req, res) {
    try {
        // // First of all verify that JWT (auth token is in the cookies request and valid)
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



        let bookings = [];


        bookings = await Booking.aggregate([
            {
                $lookup: { from: 'users', localField: 'userId', foreignField: '_id', as: 'responsable' }
            },
            {
                $unwind: { path: '$responsable', preserveNullAndEmptyArrays: true }
            },
            {
                $lookup: { from: 'typesmissions', localField: 'typeMissionId', foreignField: '_id', as: 'typeMission' }
            },
            {
                $unwind: { path: '$typeMission', preserveNullAndEmptyArrays: true }
            },
            {
                $lookup: { from: 'equipements', localField: 'equipId', foreignField: '_id', as: 'equipement' }
            },
            {
                $unwind: { path: '$equipement', preserveNullAndEmptyArrays: true }
            },
            {
                $lookup: { from: 'perimeters', localField: 'perimeterId', foreignField: '_id', as: 'perimeter' }
            },
            {
                $unwind: { path: '$perimeter', preserveNullAndEmptyArrays: true }
            },
            {
                $lookup: { from: 'users', localField: 'createdBy', foreignField: '_id', as: 'initiateur' }
            },
            {
                $unwind: { path: '$initiateur', preserveNullAndEmptyArrays: true }
            },
            {
                $project: {
                    'num_reservation': '$num_reservation',
                    'start': '$start',
                    'end': '$end',
                    'statut': '$statut',
                    'createdOn': '$createdOn',
                    'responsable': { $concat: ['$responsable.firstName', ' ', '$responsable.lastName'] },
                    'typeMission': '$typeMission.typeMission',
                    'equipement': '$equipement.code',
                    'perimeter': '$perimeter.code',
                    'initiateur': { $concat: ['$initiateur.firstName', ' ', '$initiateur.lastName'] }
                }
            },
            {
                $match: {
                    $or: [
                        { 'num_reservation': regixFilter },
                        { 'statut': regixFilter },
                        { 'responsable': regixFilter },
                        { 'typeMission': regixFilter },
                        { 'perimeter': regixFilter },
                        { 'initiateur': regixFilter }
                    ]
                }
            },
            {
                $facet: {
                    'bookings': [
                        { $sort: orderByQuery },
                        { $skip: pageNumber * pageSize },
                        { $limit: pageSize }
                    ],
                    'total': [
                        { $count: 'count' }
                    ]
                }
            },
        ]);

        return res.status(200).json(bookings);

    } catch (e) {
        console.error(e);
        return res.status(500).json('Unexpected error occured');
    }
}





/**
 * Delete one booking
 * @param {*} req 
 * @param {*} res 
 * @returns 
 */
async function deleteBooking(req, res) {
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
        // Validation of the data
        const { error } = deleteBookingValidation(req.body);
        if (error) {
            return res.status(400).json(error.details[0].message);
        }

        // Verify if the user is permitted to delete this booking
        const bookingToDeleteId = req.body.bookingId;
        const targetBooking = await Booking.findById(bookingToDeleteId);
        if (!targetBooking) {
            return res.status(400).json('Source does not exist');
        }
        if ((targetBooking.userId.toString() == userId.toString()) || isAdmin) {
            // The user is allowed to delete
            await Booking.findByIdAndDelete(bookingToDeleteId);
            return res.status(200).json(targetBooking);
        } else {
            return res.status(401).json('This user is not permitted to delete');
        }
    } catch (e) {
        console.error(e);
        return res.status(500).json('Unexpected error occured');
    }
}


module.exports = { addBooking, updateBookingStatut, getBookings, deleteBooking, getAllBookings, getBooking };