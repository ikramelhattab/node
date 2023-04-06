
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();
const routes = require('./routes');
const cookieParser = require('cookie-parser');

// // Middelware to upload files
// const busboy = require('connect-busboy');

const app = express();

const mongoUrl = {
    dev: process.env.MONGO_LOCAL_URL,
    cloud: process.env.MONGO_CLOUD_URL
};

// TODO: change database name in prod (prod: tarsier-demo, test: tarsier)
mongoose.connect(mongoUrl.cloud, {
    dbName: 'tarsier',
}).then(() => {
    console.log('Connected to mongodb');
    initilizer();
}).catch(err => {
    console.error('Failed to connect to mongodb: ', err);
});

// CDN to store images
const cloudinary = require('cloudinary');
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));
app.use(cookieParser());
// TODO: change origin:
// Development --> http://localhost:4200
// Demo --> https://tarsio-demo.web.app
// Demo ext --> https://tarsio-demo-ext.web.app
// Production -->
app.use(cors({
    credentials: true,
    origin: 'http://localhost:4200',
    allowedHeaders: 'Origin, X-Requested-With, Content-Type, Accept'
}));

// // Make the app uses the middelware
// app.use(busboy());



const port = process.env.TARSIO_PORT | 3190;

app.get('/', (req, res) => {
    res.status(200).send('Tarsier server is up and running!');
});

// List all of your routes here
app.use('/auth', routes.authRoutes);
app.use('/booking', routes.bookingRoutes);
app.use('/leak', routes.leakRoutes);
app.use('/perimeter', routes.perimeterRoutes);
app.use('/equipement', routes.equipRoutes);
app.use('/typeEquip', routes.typeEquipRoutes);
app.use('/typesMission', routes.typesMissionRoutes);
app.use('/freq', routes.freqControleRoutes);





/**
 * Init some docs on mongoDB
 */
async function initilizer() {
    // Create typesMission if they are not set yet
    try {
        const TypesMission = require('./models/typeMission');
        const foundEtalonnage = await TypesMission.findOne({ typeMission: 'Etalonnage' });
        const foundReparation = await TypesMission.findOne({ typeMission: 'Réparation' });
        const foundFuites = await TypesMission.findOne({ typeMission: 'Mission de détection des fuites' });
        const foundFormation = await TypesMission.findOne({ typeMission: 'Formation' });
        if (!foundEtalonnage) {
            const newTypeMission = new TypesMission({
                typeMission: 'Etalonnage',
                description: '',
                statut: true
            });
            await newTypeMission.save();
        }
        if (!foundReparation) {
            const newTypeMission = new TypesMission({
                typeMission: 'Réparation',
                description: '',
                statut: true
            });
            await newTypeMission.save();
        }
        if (!foundFuites) {
            const newTypeMission = new TypesMission({
                typeMission: 'Mission de détection des fuites',
                description: 'Mission de chasse aux fuites',
                statut: true
            });
            await newTypeMission.save();
        }
        if (!foundFormation) {
            const newTypeMission = new TypesMission({
                typeMission: 'Formation',
                description: '',
                statut: true
            });
            await newTypeMission.save();
        }
    } catch (e) {
        console.error(e);
    }

    // Create freq controle if they are not set yet
    try {
        const Frequence = require('./models/freq');
        const freqExist = await Frequence.find();
        if (freqExist.length === 0) {
            const newFreq = new Frequence({
                _0_100euro: 12,
                _100_500euro: 6,
                _500_1500euro: 3,
                _1500euro: 1,
                horizon: 12
            });
            await newFreq.save();
        }
    } catch (e) {
        console.error(e);
    }
}



// TODO: To deploy in Firebase
// comment app.listen part, uncomment exports.app part

app.listen(port, () => {
    console.log(`Server is listening on http://localhost:${port}`);
});

// const functions = require('firebase-functions');
// exports.app = functions.https.onRequest(app);