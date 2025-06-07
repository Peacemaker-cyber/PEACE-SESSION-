import express from 'express';
import { Boom } from '@hapi/boom';
import {
  makeWASocket,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  DisconnectReason
} from '@whiskeysockets/baileys';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
global.crypto = crypto;

const app = express();
const PORT = process.env.PORT || 3000;
const __dirname = path.resolve();

app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

let currentQR = '';

// ======== Pair Code Generation ========
app.post('/generate-id', async (req, res) => {
  try {
    let { number } = req.body;
    if (!number) return res.status(400).json({ error: 'Phone number is required' });

    number = number.replace(/\D/g, '');
    const jid = number + '@s.whatsapp.net';
    const authDir = `auth_${number}`;
    const { state, saveCreds } = await useMultiFileAuthState(authDir);
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
      version,
      auth: state,
      printQRInTerminal: false,
      browser: ["Windows", "Chrome", "114.0.5735.198"]
    });

    sock.ev.on('creds.update', saveCreds);

    let responded = false;

    sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect } = update;

      if (connection === 'open' && !responded) {
        console.log('✅ WhatsApp connected, requesting pair code...');
        try {
          const code = await sock.requestPairingCode(jid);
          if (code) {
            console.log('✅ Pair code generated:', code);
            responded = true;
            return res.json({ code });
          } else {
            console.error('❌ Failed to receive pair code');
            responded = true;
            return res.status(500).json({ error: 'Failed to generate pairing code' });
          }
        } catch (err) {
          console.error('❌ Error generating pair code:', err);
          responded = true;
          return res.status(500).json({ error: 'Error generating pairing code' });
        }
      }

      if (connection === 'close') {
        const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
        if (shouldReconnect) {
          console.log('🔁 Reconnecting...');
        }
      }
    });

    // Timeout in case 'open' is never reached
    setTimeout(() => {
      if (!responded) {
        console.error('⏰ Timeout waiting for connection.');
        return res.status(500).json({ error: 'Timeout waiting for WhatsApp connection' });
      }
    }, 15000); // 15 seconds max wait

  } catch (error) {
    console.error('❌ Error generating ID:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ======== QR Code Generation ========
app.get('/generate-qr', async (req, res) => {
  try {
    const { state, saveCreds } = await useMultiFileAuthState('auth_qr');
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
      version,
      auth: state,
      printQRInTerminal: false,
      browser: ["Ubuntu", "Chrome", "114.0.5735.198"]
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', async ({ qr }) => {
      if (qr) {
        currentQR = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qr)}`;
        console.log('QR Code Generated');
      }
    });

    setTimeout(() => {
      if (currentQR) {
        res.json({ qr: currentQR });
      } else {
        res.status(500).json({ error: 'QR not available' });
      }
    }, 5000);
  } catch (error) {
    console.error('Error generating QR:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ======== Serve index.html fallback ========
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
