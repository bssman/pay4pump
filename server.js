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

// Store pump statuses (default: all off)
let pumpStatus = {
  pump1: false,
  pump2: false,
  pump3: false,
  pump4: false,
};

// Simulate pump activation for 1 hour after payment
app.post("/api/activate-pump", (req, res) => {
  const { pumpId } = req.body;

  if (pumpId >= 1 && pumpId <= 4) {
    // Turn on the pump
    pumpStatus[`pump${pumpId}`] = true;

    // Turn off the pump automatically after 1 hour
    setTimeout(() => {
      pumpStatus[`pump${pumpId}`] = false;
    }, 3600000); // 1 hour in milliseconds

    res.status(200).json({ message: `Pump ${pumpId} activated for 1 hour` });
  } else {
    res.status(400).json({ error: "Invalid pump ID" });
  }
});

// Provide current pump statuses
app.get("/api/pump-status", (req, res) => {
  res.status(200).json(pumpStatus);
});

app.post("/api/pay", async (req, res) => {
  const { pumpId } = req.body;
  const email = "garpiyan@gmail.com";
  const amount = 20000;

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
