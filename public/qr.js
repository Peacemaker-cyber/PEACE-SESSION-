const qrImage = document.getElementById("qr-image");
const qrStatus = document.getElementById("qr-status");

function loadQR() {
  qrStatus.textContent = "Generating QR...";
  fetch("/api/qr")
    .then(res => res.json())
    .then(data => {
      if (data.qr) {
        qrImage.src = data.qr;
        qrStatus.textContent = "Scan the QR with your WhatsApp app.";
      } else {
        qrStatus.textContent = "Failed to load QR.";
      }
    })
    .catch(() => {
      qrStatus.textContent = "Error fetching QR.";
    });
}

loadQR();
