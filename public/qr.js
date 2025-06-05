// public/qr.js
const qrImage = document.getElementById("qrImage");

async function fetchQR() {
  try {
    const res = await fetch("/api/qr");
    const data = await res.json();
    if (data.qr) {
      qrImage.src = data.qr;
    } else {
      qrImage.alt = "QR not available";
    }
  } catch {
    qrImage.alt = "Error loading QR";
  }
}

fetchQR();
setInterval(fetchQR, 5000);
