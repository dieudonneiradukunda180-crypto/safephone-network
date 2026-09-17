const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const PORT = 3000;

// Initialize SQLite Database
const db = new sqlite3.Database('./database.sqlite', (err) => {
    if (err) console.error('Database opening error: ', err.message);
    else console.log('Connected to the SQLite database.');
});

// Create Lost Phones Table with Police Case tracking & status
db.run(`CREATE TABLE IF NOT EXISTS lost_phones (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    brand_model TEXT,
    imei TEXT UNIQUE,
    owner_contact TEXT,
    description TEXT,
    police_case_number TEXT,
    status TEXT DEFAULT 'Lost (Community)'
)`);

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// API Route: Search IMEI in Database (Checks for Police Case)
app.get('/search', (req, res) => {
    const imei = req.query.imei;
    db.get(`SELECT * FROM lost_phones WHERE imei = ?`, [imei], (err, row) => {
        if (err) {
            res.status(500).json({ error: 'Database error' });
        } else if (row) {
            const hasPoliceCase = row.police_case_number && row.police_case_number.trim() !== '';
            res.json({ 
                found: true, 
                policeVerified: hasPoliceCase,
                data: row 
            });
        } else {
            res.json({ found: false });
        }
    });
});

// API Route: Report Lost Device Form Submission (No photo handling needed)
app.post('/report', (req, res) => {
    const { brand_model, imei, owner_contact, description, police_case_number } = req.body;

    const query = `INSERT INTO lost_phones (brand_model, imei, owner_contact, description, police_case_number) VALUES (?, ?, ?, ?, ?)`;
    
    db.run(query, [brand_model, imei, owner_contact, description, police_case_number], function(err) {
        if (err) {
            res.send(`<script>alert('Error: This IMEI is already registered as lost or database error.'); window.location='/';</script>`);
        } else {
            res.send(`<script>alert('Device successfully registered to SafePhone Network!'); window.location='/';</script>`);
        }
    });
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});