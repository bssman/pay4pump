// Backend implementation using Node.js with Express
const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');
const app = express();
const port = 3000;
require('dotenv').config();
// Middleware
app.use(bodyParser.json());

// Store pump states
const pumps = {
    1: { active: false, timeout: null },
    2: { active: false, timeout: null },
    3: { active: false, timeout: null },
    4: { active: false, timeout: null }
};

// Paystack API details
const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY; // Replace with your secret key
const CALLBACK_URL = 'http://your-domain.com/api/verify';

// Endpoint to handle payment
app.post('/api/pay', async (req, res) => {
    const { pumpId } = req.body;

    if (!pumpId || !pumps[pumpId]) {
        return res.status(400).json({ success: false, message: 'Invalid pump ID' });
    }

    try {
        // Initiate transaction
        const response = await axios.post(
            'https://api.paystack.co/transaction/initialize',
            {
                email: 'customer@example.com', // Replace with dynamic user email
                amount: 5000, // Replace with the amount for pump activation (in kobo)
                callback_url: CALLBACK_URL,
                metadata: { pumpId }
            },
            {
                headers: {
                    Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        res.json({ success: true, authorization_url: response.data.data.authorization_url });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Payment initialization failed' });
    }
});

// Endpoint to verify payment
app.get('/api/verify', async (req, res) => {
    const { reference } = req.query;

    try {
        // Verify transaction
        const response = await axios.get(`https://api.paystack.co/transaction/verify/${reference}`, {
            headers: {
                Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`
            }
        });

        const { status, metadata } = response.data.data;

        if (status === 'success' && metadata && pumps[metadata.pumpId]) {
            const pumpId = metadata.pumpId;

            // Activate pump
            activatePump(pumpId);
            res.redirect('/'); // Redirect to your frontend success page
        } else {
            res.status(400).json({ success: false, message: 'Invalid transaction data' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Payment verification failed' });
    }
});

// Function to activate pump
function activatePump(pumpId) {
    if (pumps[pumpId].active) return; // Already active

    pumps[pumpId].active = true;
    console.log(`Pump ${pumpId} activated.`);

    // Set a timeout to deactivate pump after 1 hour
    pumps[pumpId].timeout = setTimeout(() => {
        pumps[pumpId].active = false;
        console.log(`Pump ${pumpId} deactivated.`);
    }, 60 * 60 * 1000); // 1 hour
}

// Start server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});