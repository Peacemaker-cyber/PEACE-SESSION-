export function showToast(message, type = 'success') {
  const toast = document.createElement('div');
  toast.textContent = message;
  toast.style.position = 'fixed';
  toast.style.bottom = '20px';
  toast.style.left = '50%';
  toast.style.transform = 'translateX(-50%)';
  toast.style.padding = '12px 20px';
  toast.style.borderRadius = '6px';
  toast.style.backgroundColor = type === 'error' ? '#ff4d4d' : '#4CAF50';
  toast.style.color = 'white';
  toast.style.fontWeight = 'bold';
  toast.style.boxShadow = '0 2px 6px rgba(0,0,0,0.3)';
  toast.style.zIndex = 9999;

  document.body.appendChild(toast);

  setTimeout(() => {
    toast.remove();
  }, 3000);
}
