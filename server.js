require('dotenv').config(); // Loads environment variables from .env file
const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch'); // For using the fetch API

const app = express();
const PORT = process.env.PORT || 3000; // Server will run on port 3000 by default

// Middleware
app.use(cors()); // Allow cross-origin requests from your frontend
app.use(express.json()); // Parse JSON request bodies

// In-memory store for OTPs (for demonstration purposes only)
// In a real application, use a database (e.g., Redis, MongoDB, PostgreSQL)
// for better persistence, security, and scalability.
const otpStore = {};

// --- API Endpoints ---

// 1. Endpoint to send OTP
app.post('/api/send-otp', async (req, res) => {
    const { phone } = req.body;
    const apiBaseUrl = process.env.INFOBIP_BASE_URL;
    const apiKey = process.env.INFOBIP_API_KEY;

    if (!phone) {
        return res.status(400).json({ success: false, message: 'Phone number is required.' });
    }

    // Generate a random 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    // Store OTP temporarily with expiry (e.g., 5 minutes)
    otpStore[phone] = { otp, expiry: Date.now() + 5 * 60 * 1000 };
    console.log(`Generated OTP for ${phone}: ${otp}`);

    const requestOptions = {
        method: 'POST',
        headers: {
            'Authorization': `App ${apiKey}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        body: JSON.stringify({
            "from": "InfoSMS", // This sender name must be configured in your Infobip portal
            "to": phone,
            "text": `Your Lets Go registration OTP is: ${otp}. Do not share this with anyone.`
        }),
    };

    try {
        const response = await fetch(`${apiBaseUrl}/sms/2/text/single`, requestOptions);
        const result = await response.json();

        // Check Infobip's response for success
        if (response.ok && result.messages && result.messages[0].status.groupName === 'OK') {
            console.log('OTP sent successfully via Infobip:', result);
            res.json({ success: true, message: 'OTP sent successfully to your phone.' });
        } else {
            console.error('Failed to send OTP via Infobip:', result);
            // Return appropriate error details from Infobip if available
            res.status(result.messages ? 400 : 500).json({ success: false, message: 'Failed to send OTP.', details: result });
        }
    } catch (error) {
        console.error('Error calling Infobip API for sending OTP:', error);
        res.status(500).json({ success: false, message: 'Server error while sending OTP.' });
    }
});

// 2. Endpoint to verify OTP
app.post('/api/verify-otp', (req, res) => {
    const { phone, otp } = req.body;

    if (!phone || !otp) {
        return res.status(400).json({ success: false, message: 'Phone number and OTP are required.' });
    }

    const storedOtpData = otpStore[phone];

    if (!storedOtpData) {
        return res.status(400).json({ success: false, message: 'No OTP found for this number. Please request a new one.' });
    }

    if (Date.now() > storedOtpData.expiry) {
        delete otpStore[phone]; // Remove expired OTP
        return res.status(400).json({ success: false, message: 'OTP has expired. Please request a new one.' });
    }

    if (storedOtpData.otp === otp) {
        delete otpStore[phone]; // OTP used, remove it to prevent reuse
        res.json({ success: true, message: 'OTP verified successfully.' });
    } else {
        res.status(400).json({ success: false, message: 'Invalid OTP.' });
    }
});

// 3. Endpoint to complete registration and generate credentials (after successful OTP verification)
app.post('/api/register-complete', async (req, res) => {
    const { fullName, email, phone, referralCode, password } = req.body;

    // In a real application:
    // 1. Perform final validation on the received data (e.g., check if phone is verified).
    // 2. Hash the password before storing (NEVER store plain text passwords). Use libraries like `bcrypt.js`.
    // 3. Generate a unique 6-digit ID.
    const generatedId = Math.floor(100000 + Math.random() * 900000).toString();
    // For simplicity, this example reuses the user-provided password.
    // In a real app, you might generate a separate system-generated password OR
    // securely hash and store the user-provided password.
    // const generatedSystemPassword = Math.random().toString(36).substring(2, 10); // Example of system-gen password

    // 4. Store all user data (fullName, email, phone, HASHED password, generatedId) in a **database**.
    //    Example (this is pseudocode for database interaction):
    //    try {
    //        await database.saveUser({ fullName, email, phone, hashedPassword, generatedId });
    //        res.json({
    //            success: true,
    //            message: 'Registration complete. Your unique ID and password are generated.',
    //            id: generatedId,
    //            password: password // Or generatedSystemPassword
    //        });
    //    } catch (dbError) {
    //        console.error('Database save error:', dbError);
    //        res.status(500).json({ success: false, message: 'Failed to save user data.' });
    //    }

    console.log('User registered and credentials generated:', { generatedId, password }); // Log for demo

    // Respond with generated credentials
    res.json({
        success: true,
        message: 'Registration complete. Your unique ID and password have been generated.',
        id: generatedId,
        password: password // Sending back the user's chosen password. Consider security implications.
    });
});


// Start the server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});