const express = require("express");
const axios = require("axios");
const bodyParser = require("body-parser");
require("dotenv").config();

const app = express();
app.use(bodyParser.json());

// Home route
app.get("/", (req, res) => {
  res.send("Pay4Pump Backend is Running!");
});

// Initialize payment
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
        callback_url: `${process.env.CALLBACK_URL}`,
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

// Verify payment
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
      res.status(200).json({ message: `Pump ${pumpId} activated` });
    } else {
      res.status(400).json({ error: "Payment not successful" });
    }
  } catch (error) {
    console.error("Error verifying payment:", error.message);
    res.status(500).json({ error: "Payment verification failed" });
  }
});

// Start the server with dynamic port
const PORT = process.env.PORT || 3000; // Default to 3000 for local testing
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
