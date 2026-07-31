const WEBHOOK_URL = 'https://n8n-hetzner.duckdns.org/webhook/publier-partout';
const form = document.getElementById('publishForm');
const videoInput = document.getElementById('videoInput');
const dropZone = document.getElementById('dropZone');
const dropLabel = document.getElementById('dropLabel');
const dropSub = document.getElementById('dropSub');
const statusEl = document.getElementById('status');
const submitBtn = document.getElementById('submitBtn');
const progress = document.getElementById('progress');
const fill = document.getElementById('fill');
const pct = document.getElementById('pct');
const captionEl = document.getElementById('caption');
const DEFAULT_LABEL = 'Choisir une vidéo ou une photo';
const DEFAULT_SUB = 'Depuis la galerie ou la caméra';
function setProgress(value, state) {
fill.style.width = value + '%';
pct.textContent = value + ' %';
fill.className = 'fill' + (state ? ' ' + state : '');
}
function resetForm() {
form.reset();
dropZone.classList.remove('has-file');
dropLabel.textContent = DEFAULT_LABEL;
dropSub.textContent = DEFAULT_SUB;
}
videoInput.addEventListener('change', () => {
const file = videoInput.files[0];
if (file) {
dropZone.classList.add('has-file');
dropLabel.textContent = file.name;
dropSub.textContent = (file.size / (1024 * 1024)).toFixed(1) + ' Mo';
}
});
form.addEventListener('submit', (e) => {
e.preventDefault();
const file = videoInput.files[0];
if (!file) return;
submitBtn.disabled = true;
progress.classList.add('visible');
setProgress(0);
statusEl.className = 'status pending';
statusEl.textContent = 'Préparation...';
const formData = new FormData();
formData.append('video', file, file.name);
formData.append('caption', captionEl.value);
const xhr = new XMLHttpRequest();
xhr.open('POST', WEBHOOK_URL);
xhr.timeout = 600000;
xhr.upload.addEventListener('progress', (ev) => {
if (!ev.lengthComputable) return;
const value = Math.round((ev.loaded / ev.total) * 100);
setProgress(value);
statusEl.textContent = 'Envoi vers le serveur...';
});
xhr.upload.addEventListener('load', () => {
setProgress(100);
statusEl.textContent = 'Publication sur Facebook...';
});
xhr.addEventListener('load', () => {
let ok = xhr.status >= 200 && xhr.status < 300;
let detail = '';
try {
const data = JSON.parse(xhr.responseText);
const fb = data.facebook_feed || data;
if (fb && fb.error) {
ok = false;
detail = fb.error.message || '';
}
} catch (err) {
}
if (ok) {
setProgress(100, 'done');
statusEl.className = 'status ok';
statusEl.textContent = '✓ Publié sur Facebook.';
resetForm();
} else {
setProgress(100, 'failed');
statusEl.className = 'status err';
statusEl.textContent = detail ? 'Échec — ' + detail : 'Échec de la publication.';
}
submitBtn.disabled = false;
});
xhr.addEventListener('error', () => {
setProgress(100, 'failed');
statusEl.className = 'status err';
statusEl.textContent = 'Connexion interrompue — réessaie.';
submitBtn.disabled = false;
});
xhr.addEventListener('timeout', () => {
setProgress(100, 'failed');
statusEl.className = 'status err';
statusEl.textContent = 'Délai dépassé — fichier trop lourd ?';
submitBtn.disabled = false;
});
xhr.send(formData);
});