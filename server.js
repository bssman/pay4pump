// Import dependencies
const express = require('express');
const axios = require('axios');
const cors = require('cors'); // Import cors module
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Enable CORS
app.use(cors({
    origin: 'http://127.0.0.1:5500', // Allow requests from your frontend origin
    methods: ['GET', 'POST'],       // Specify allowed methods
    allowedHeaders: ['Content-Type', 'Authorization'] // Specify allowed headers
}));

// Other middlewares
app.use(express.json());
app.use(bodyParser.json());

// Start server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});

// Store pump states
const pumps = {
    1: { active: false, timeout: null },
    2: { active: false, timeout: null },
    3: { active: false, timeout: null },
    4: { active: false, timeout: null }
};

// Paystack API details
const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
const CALLBACK_URL = 'http://127.0.0.1:5500/success.html'; // Update with your frontend success page

if (!PAYSTACK_SECRET_KEY) {
    console.error('Error: PAYSTACK_SECRET_KEY is not set in the environment variables.');
    process.exit(1);
}

// Endpoint to handle payment
app.post('/api/pay', async (req, res) => {
    const { pumpId, email } = req.body;

    if (!pumpId || !pumps[pumpId]) {
        return res.status(400).json({ success: false, message: 'Invalid pump ID' });
    }

    const userEmail = email || 'garpiyan@gmail.com'; // Default email if not provided

    try {
        // Initiate transaction
        const response = await axios.post(
            'https://api.paystack.co/transaction/initialize',
            {
                email: userEmail,
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
        //Log paystack error
        console.log('Paystack response:', error.response?.data);
        console.error('Error initiating payment:', error.response?.data || error.message);
        res.status(500).json({ success: false, message: 'Payment initialization failed' });
    }
});

// Endpoint to verify payment
app.get('/api/verify', async (req, res) => {
    const { reference } = req.query;

    if (!reference) {
        return res.status(400).json({ success: false, message: 'Transaction reference is required' });
    }

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
            res.redirect('/success.html'); // Redirect to your frontend success page
        } else {
            res.status(400).json({ success: false, message: 'Invalid transaction data' });
        }
    } catch (error) {
        console.error('Error verifying payment:', error.response?.data || error.message);
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
