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
      browser: ["Windows", "Chrome", "114.0.5735.198"],
      getMessage: async () => ({ conversation: "PEACE MD" }),
    });

    sock.ev.on('creds.update', saveCreds);

    // ⏳ Wait for WhatsApp to open connection
    const waitForOpen = new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Timeout waiting for WhatsApp')), 30000);

      sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;

        if (connection === 'open') {
          clearTimeout(timeout);
          console.log('✅ WhatsApp connection established');
          resolve();
        }

        if (connection === 'close') {
          const reason = lastDisconnect?.error?.output?.statusCode;
          console.log('❌ Disconnected:', reason);
          if (reason !== DisconnectReason.loggedOut) {
            reject(new Error('WhatsApp disconnected'));
          }
        }
      });
    });

    await waitForOpen;

    // ✅ Now safe to generate pair code
    const code = await sock.requestPairingCode(jid);

    if (code) {
      console.log('Generated Pair Code:', code);

      // Optional: Try to trigger notification
      try {
        await sock.presenceSubscribe(jid);
        await sock.sendPresenceUpdate('available');
        await sock.sendMessage(jid, { text: '.' });
        console.log('🔔 Triggered notification');
      } catch (notifyErr) {
        console.warn('⚠️ Could not send notification:', notifyErr.message);
      }

      return res.json({ code });
    } else {
      return res.status(500).json({ error: 'Failed to generate pairing code' });
    }

  } catch (err) {
    console.error('❌ Error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ======== QR Code Generator (unchanged) ========
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
