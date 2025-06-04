function submitPairCode() {
  const number = document.getElementById("whatsappNumber").value.trim();
  const result = document.getElementById("pair-result");

  if (!number.startsWith("+") || number.length < 10) {
    result.textContent = "Please enter a valid WhatsApp number starting with +";
    result.style.color = "red";
    return;
  }

  // Simulate session generation
  fetch("/api/pair", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ number }),
  })
    .then((res) => res.json())
    .then((data) => {
      result.textContent = data.message || "Session paired successfully!";
      result.style.color = "limegreen";
    })
    .catch(() => {
      result.textContent = "Something went wrong!";
      result.style.color = "red";
    });
}
