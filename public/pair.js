document.getElementById("submit-number").addEventListener("click", async () => {
  const number = document.getElementById("whatsapp-number").value.trim();
  if (!number) return alert("Please enter your number");

  const response = await fetch(`/generate/pair`);
  const data = await response.json();
  if (data.pairingCode) {
    document.getElementById("result").innerHTML = `Your Pairing Code: <b>${data.pairingCode}</b>`;
  } else {
    alert("Failed to generate pairing code.");
  }
});
