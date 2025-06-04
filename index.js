const express = require("express");
const path = require("path");
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// Handle pair code submission
app.post("/api/pair", (req, res) => {
  const { number } = req.body;
  if (!number) return res.status(400).json({ message: "Number is required" });

  // Simulate storing or pairing
  console.log("Paired:", number);
  return res.json({ message: `Successfully paired: ${number}` });
});

// Simulate QR code
app.get("/api/qr", (req, res) => {
  const qrImage = "https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=PEACE_MD_QR_SESSION";
  res.json({ qr: qrImage });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
