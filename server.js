const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public')); // Serves your HTML files

// --- 1. DATABASE CONNECTION ---
// Connects to your local MongoDB service
const MONGO_URI = 'mongodb://127.0.0.1:27017/citizenshield_final';

mongoose.connect(MONGO_URI)
.then(() => console.log("✅ REAL DATABASE CONNECTED: System is Live!"))
.catch(err => {
    console.error("❌ CONNECTION ERROR: Is MongoDB running?");
    console.error(err);
});

// --- 2. DATA MODEL ---
const IncidentSchema = new mongoose.Schema({
    type: String,       // Fire, Accident, Medical
    lat: Number,
    lng: Number,
    severity: String,   // red, orange
    status: { type: String, default: 'Pending' }, // Pending -> Dispatched -> Resolved
    reporterPhone: String, 
    timestamp: { type: Date, default: Date.now }
});

const Incident = mongoose.model('Incident', IncidentSchema);

// --- 3. API ROUTES ---

// [POST] REPORT INCIDENT (Citizen App)
app.post('/api/report', async (req, res) => {
    try {
        const newIncident = new Incident(req.body);
        await newIncident.save();
        console.log(`🚨 NEW ALERT: ${req.body.type} reported.`);
        res.status(201).json(newIncident);
    } catch (e) { res.status(500).json({error: e.message}); }
});

// [GET] PUBLIC FEED (Citizen App)
// SECURE: Hides phone numbers & hides 'Resolved' cases to keep map clean
app.get('/api/public-feed', async (req, res) => {
    try {
        const data = await Incident.find({ status: { $ne: 'Resolved' } })
            .select('-reporterPhone') // Exclude private data
            .sort({ timestamp: -1 });
        res.json(data);
    } catch (e) { res.status(500).json({error: e.message}); }
});

// [GET] ADMIN FEED (Dispatch Dashboard)
// FULL ACCESS: Shows phone numbers & includes 'Resolved' cases for statistics
app.get('/api/admin-feed', async (req, res) => {
    try {
        const data = await Incident.find()
            .sort({ timestamp: -1 }); // Newest first
        res.json(data);
    } catch (e) { res.status(500).json({error: e.message}); }
});

// [PATCH] UPDATE STATUS (Dispatch Action)
// Updates status to 'Dispatched' or 'Resolved'
app.patch('/api/update-status/:id', async (req, res) => {
    try {
        const updated = await Incident.findByIdAndUpdate(
            req.params.id, 
            { status: req.body.status },
            { new: true }
        );
        console.log(`📝 STATUS UPDATE: Incident is now ${req.body.status}`);
        res.json(updated);
    } catch (e) { res.status(500).json({error: e.message}); }
});

// --- START SERVER ---
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`🚀 COMMAND CENTER ONLINE: http://localhost:${PORT}`);
    console.log(`📱 CITIZEN VIEW: http://localhost:${PORT}/index.html`);
    console.log(`🖥️ DISPATCH VIEW: http://localhost:${PORT}/dispatch.html`);
});
