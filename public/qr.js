// qr.js

const qrContainer = document.getElementById('qr-container'); const statusText = document.getElementById('status-text');

async function fetchQRCode() { try { statusText.textContent = 'Fetching QR Code...';

const response = await fetch('/generate-qr');
if (!response.ok) throw new Error('Failed to fetch QR');

const data = await response.json();

if (data.qr) {
  const img = document.createElement('img');
  img.src = data.qr;
  img.alt = 'QR Code';
  img.style.maxWidth = '300px';
  img.style.border = '4px solid white';
  img.style.borderRadius = '12px';

  qrContainer.innerHTML = '';
  qrContainer.appendChild(img);
  statusText.textContent = 'Scan this QR code with WhatsApp';
} else {
  throw new Error('QR not found');
}

} catch (error) { console.error(error); statusText.textContent = 'Error loading QR Code. Please try again later.'; } }

fetchQRCode();

