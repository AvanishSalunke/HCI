// Shared helpers for the events + feedback feature.

// Must end in ".vjti.ac.in" (e.g. name@it.vjti.ac.in). Mirrors the backend check.
const VJTI_EMAIL = /^[^\s@]+@([a-z0-9-]+\.)+vjti\.ac\.in$/i;
export const isVjtiEmail = (email) => VJTI_EMAIL.test(String(email).trim());

export const formatDate = (isoDate) => {
  if (!isoDate) return '';
  const d = new Date(`${isoDate}T00:00:00`);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

// Single day -> "5 Oct 2026"; multi-day -> "5 Oct 2026 – 7 Oct 2026"
export const formatDateRange = (start, end) =>
  end && end !== start ? `${formatDate(start)} – ${formatDate(end)}` : formatDate(start);

// "14:30" -> "2:30 PM"
export const formatTime = (hhmm) => {
  if (!hhmm) return '';
  const [h, m] = hhmm.split(':').map(Number);
  const suffix = h >= 12 ? 'PM' : 'AM';
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, '0')} ${suffix}`;
};

// Downscale an image file to a JPEG data URL so posters stay small.
export const imageToDataUrl = (file, maxWidth = 900, quality = 0.8) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Could not read the image'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('That file is not a valid image'));
      img.onload = () => {
        const scale = Math.min(1, maxWidth / img.width);
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
