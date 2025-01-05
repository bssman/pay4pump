const express = require("express");
const cors = require("cors");
const app = express();
const PORT = process.env.PORT || 5000;

// Sample pump state (you should replace this with a real database or memory storage)
let pumpStates = {
  pump1: false,
  pump2: false,
  pump3: false,
  pump4: false,
};

// Middleware
app.use(cors());
app.use(express.json());

// Payment verification endpoint (updated to activate pumps)
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

      // Activate pump for 1 hour
      pumpStates[`pump${pumpId}`] = true;
      setTimeout(() => {
        pumpStates[`pump${pumpId}`] = false;
      }, 3600000); // 1 hour in milliseconds

      console.log(`Pump ${pumpId} activated for 1 hour`);
      res.json({ message: `Pump ${pumpId} activated` });
    } else {
      res.status(400).json({ error: "Payment failed" });
    }
  } catch (error) {
    console.error("Error verifying payment:", error.message);
    res.status(500).json({ error: "Verification failed" });
  }
});

// Pump status endpoint
app.get("/api/pump-status", (req, res) => {
  res.json(pumpStates);
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
