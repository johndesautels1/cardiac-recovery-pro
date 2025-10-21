// Robust photo uploader: attaches safe listeners and uses hidden input

function displayUserPhoto(photoData) {
  const photoElement = document.getElementById('userPhoto');
  if (photoElement && photoData) {
    photoElement.style.backgroundImage = `url(${photoData})`;
    photoElement.style.backgroundSize = 'cover';
    photoElement.style.backgroundPosition = 'center';
  }
}

function bindPhotoUploader() {
  const photoElement = document.getElementById('userPhoto');
  const input = document.getElementById('userPhotoInput');
  if (!photoElement || !input) return;

  // Load existing
  try {
    const existing = localStorage.getItem('userPhotoV2') || localStorage.getItem('userPhoto');
    if (existing) displayUserPhoto(existing);
  } catch {}

  photoElement.addEventListener('click', () => input.click());
  photoElement.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    try {
      localStorage.removeItem('userPhotoV2');
      localStorage.removeItem('userPhoto');
    } catch {}
    photoElement.style.backgroundImage = '';
    if (window.showNotification) window.showNotification('Photo removed', 'success');
    return false;
  });

  input.addEventListener('change', (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target.result;
      try { localStorage.setItem('userPhotoV2', dataUrl); } catch {}
      displayUserPhoto(dataUrl);
      if (window.showNotification) window.showNotification('Photo updated', 'success');
    };
    reader.readAsDataURL(file);
  });
}

// Run after DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bindPhotoUploader);
} else {
  bindPhotoUploader();
}

