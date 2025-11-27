const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public')); 

// --- CONNECT TO YOUR RUNNING MONGODB SERVICE ---
const MONGO_URI = 'mongodb://127.0.0.1:27017/citizenshield_final';

// FIX: Removed deprecated options. Simple connection is enough for modern Mongoose.
mongoose.connect(MONGO_URI)
.then(() => console.log("✅ REAL DATABASE CONNECTED: System is Live!"))
.catch(err => {
    console.error("❌ CONNECTION ERROR DETAILS:", err);
});

// --- DATA MODEL ---
const IncidentSchema = new mongoose.Schema({
    type: String,
    lat: Number,
    lng: Number,
    severity: String,
    status: { type: String, default: 'Pending' }, 
    reporterPhone: String, 
    timestamp: { type: Date, default: Date.now }
});
const Incident = mongoose.model('Incident', IncidentSchema);

// --- ROUTES ---

// 1. Report (Saves to Disk)
app.post('/api/report', async (req, res) => {
    try {
        const newIncident = new Incident(req.body);
        await newIncident.save();
        console.log(`🚨 ALERT SAVED: ${req.body.type}`);
        res.status(201).json(newIncident);
    } catch (e) { res.status(500).json({error: e.message}); }
});

// 2. Public Feed (Secure)
app.get('/api/public-feed', async (req, res) => {
    try {
        const data = await Incident.find({ status: { $ne: 'Resolved' } }).select('-reporterPhone');
        res.json(data);
    } catch (e) { res.status(500).json({error: e.message}); }
});

// 3. Admin Feed (Full Access)
app.get('/api/admin-feed', async (req, res) => {
    try {
        const data = await Incident.find({ status: { $ne: 'Resolved' } }).sort({ timestamp: -1 });
        res.json(data);
    } catch (e) { res.status(500).json({error: e.message}); }
});

// 4. Update Status
app.patch('/api/update-status/:id', async (req, res) => {
    try {
        const updated = await Incident.findByIdAndUpdate(
            req.params.id, 
            { status: req.body.status },
            { new: true }
        );
        res.json(updated);
    } catch (e) { res.status(500).json({error: e.message}); }
});

app.listen(3000, () => console.log("🚀 SERVER STARTED: http://localhost:3000"));