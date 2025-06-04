window.onload = async () => {
  const response = await fetch(`/generate/qr`);
  const data = await response.json();
  if (data.qr) {
    document.getElementById("qr-image").src = data.qr;
  } else {
    alert("Failed to generate QR code.");
  }
};
