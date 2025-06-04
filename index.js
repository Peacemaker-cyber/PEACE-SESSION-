import express from 'express';
import cors from 'cors';
import makeWASocket, { useSingleFileAuthState, fetchLatestBaileysVersion } from '@whiskeysockets/baileys';
import qrcode from 'qrcode';
import { join } from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = join(__filename, '..');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

const SESSION_FOLDER = './sessions';
if (!fs.existsSync(SESSION_FOLDER)) fs.mkdirSync(SESSION_FOLDER);

// Generate QR or pair code
app.get('/generate/:method', async (req, res) => {
  const { method } = req.params;
  const sessionId = 'session-' + Date.now();
  const { state, saveCreds } = useSingleFileAuthState(`${SESSION_FOLDER}/${sessionId}.json`);
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    version,
    auth: state,
    printQRInTerminal: false,
  });

  sock.ev.on('connection.update', async (update) => {
    const { qr, pairingCode, connection } = update;

    if (connection === 'close') return res.status(500).send({ error: 'Connection closed. Try again.' });

    if (qr && method === 'qr') {
      const imageUrl = await qrcode.toDataURL(qr);
      return res.send({ sessionId, qr: imageUrl });
    }

    if (pairingCode && method === 'pair') {
      return res.send({ sessionId, pairingCode });
    }
  });

  sock.ev.on('creds.update', saveCreds);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ PEACE MD backend is running on port ${PORT}`);
});
