const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.post('/generate-pair', (req, res) => {
  const { number } = req.body;
  if (!number) return res.status(400).json({ error: 'Number is required' });

  const fakeCode = 'PEACE-' + Math.floor(100000 + Math.random() * 900000);
  res.json({ pairCode: fakeCode });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
