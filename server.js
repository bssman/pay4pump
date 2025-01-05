// Backend: server.js 5 january recovery
const express = require("express");
const cors = require("cors");
const axios = require("axios");
const bodyParser = require("body-parser");
require("dotenv").config();

// Initialize Express App
const app = express();

// Middleware
app.use(cors({
  origin: "https://suites11.com.ng", // Replace with your frontend URL
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type"],
}));
app.use(bodyParser.json());

// Routes
app.get("/", (req, res) => {
  res.send("Pay4Pump Backend is Running!");
});

app.post("/api/pay", async (req, res) => {
  const { pumpId } = req.body;
  const email = "test@example.com";
  const amount = 5000;

  try {
    const response = await axios.post(
      "https://api.paystack.co/transaction/initialize",
      {
        email,
        amount,
        callback_url: process.env.CALLBACK_URL,
        metadata: { pumpId },
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        },
      }
    );
    res.status(200).json({ authorization_url: response.data.data.authorization_url });
  } catch (error) {
    console.error("Error initializing payment:", error.message);
    res.status(500).json({ error: "Payment initialization failed" });
  }
});

app.get("/api/verify", async (req, res) => {
  const { reference } = req.query;

  try {
    const response = await axios.get(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        },
      }
    );

    if (response.data.data.status === "success") {
      const pumpId = response.data.data.metadata.pumpId;

      console.log(`Pump ${pumpId} activated for 1 hour`);

      // Redirect to the correct frontend URL
      res.redirect(
        `https://suites11.com.ng/pumps.html?pump=${pumpId}&message=Pump ${pumpId} activated`
      );
    } else {
      res.redirect(`https://suites11.com.ng/pumps.html?error=Payment failed`);
    }
  } catch (error) {
    console.error("Error verifying payment:", error.message);
    res.redirect(`https://suites11.com.ng/pumps.html?error=Verification failed`);
  }
});

// Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
