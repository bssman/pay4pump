const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors'); // Import CORS
const axios = require('axios');
require('dotenv').config();

const app = express();

// Configure CORS
const corsOptions = {
  origin: 'https://suites11.com.ng', // Allow requests only from this frontend
  methods: ['GET', 'POST'],
};
app.use(cors(corsOptions)); // Apply CORS middleware

app.use(bodyParser.json());

const PORT = process.env.PORT || 3000;

// Endpoint to initialize payment
app.post('/api/pay', async (req, res) => {
  const { pumpId } = req.body;

  if (!pumpId) {
    return res.status(400).json({ error: 'Pump ID is required' });
  }

  try {
    const response = await axios.post(
      'https://api.paystack.co/transaction/initialize',
      {
        email: 'garpiyan@gmail.com',
        amount: 5000, // Amount in kobo (50 NGN)
        callback_url: `${process.env.CALLBACK_URL}/api/verify`,
        metadata: { pumpId },
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        },
      }
    );

    res.json({
      authorization_url: response.data.data.authorization_url,
      reference: response.data.data.reference,
    });
  } catch (error) {
    res.status(500).json({ error: 'Payment initialization failed' });
  }
});

// Endpoint to verify payment
app.get('/api/verify', async (req, res) => {
  const { reference } = req.query;

  if (!reference) {
    return res.status(400).json({ error: 'Reference is required' });
  }

  try {
    const response = await axios.get(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        },
      }
    );

    const { status, metadata } = response.data.data;
    if (status === 'success') {
      console.log(`Pump ${metadata.pumpId} activated for 1 hour`);
      res.send('Payment verified and pump activated');
    } else {
      res.status(400).send('Payment not successful');
    }
  } catch (error) {
    res.status(500).send('Verification failed');
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
