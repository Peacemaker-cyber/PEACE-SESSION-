const express = require('express');
const path = require('path');
const app = express();

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// API for generating Paircode (dummy example for now)
app.post('/generate-pair', (req, res) => {
    const number = req.body.number;
    if (!number) return res.status(400).json({ error: 'Number required' });

    // For now just return a fake pair code
    const code = 'PEACE-' + Math.floor(Math.random() * 100000);
    res.json({ pairCode: code });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
