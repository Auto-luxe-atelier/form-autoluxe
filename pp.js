const WEBHOOK_URL = 'https://n8n-hetzner.duckdns.org/webhook/publier-partout';
const MAX_TRIES = 3;
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
function finish(ok, detail) {
setProgress(100, ok ? 'done' : 'failed');
statusEl.className = ok ? 'status ok' : 'status err';
statusEl.textContent = ok ? '✓ Publié sur Facebook.' : (detail || 'Échec de la publication.');
if (ok) resetForm();
submitBtn.disabled = false;
}
videoInput.addEventListener('change', () => {
const file = videoInput.files[0];
if (file) {
dropZone.classList.add('has-file');
dropLabel.textContent = file.name;
dropSub.textContent = (file.size / (1024 * 1024)).toFixed(1) + ' Mo';
}
});
function send(file, caption, attempt) {
const formData = new FormData();
formData.append('video', file, file.name);
formData.append('caption', caption);
const xhr = new XMLHttpRequest();
xhr.open('POST', WEBHOOK_URL);
xhr.timeout = 600000;
const suffix = attempt > 1 ? ' (essai ' + attempt + ')' : '';
xhr.upload.addEventListener('progress', (ev) => {
if (!ev.lengthComputable) return;
setProgress(Math.round((ev.loaded / ev.total) * 100));
statusEl.textContent = 'Envoi vers le serveur...' + suffix;
});
xhr.upload.addEventListener('load', () => {
setProgress(100);
statusEl.textContent = 'Publication sur Facebook...' + suffix;
});
xhr.addEventListener('load', () => {
let ok = xhr.status >= 200 && xhr.status < 300;
let detail = '';
try {
const data = JSON.parse(xhr.responseText);
const fb = data.facebook_feed || data;
if (fb && fb.error) {
ok = false;
detail = 'Échec — ' + (fb.error.message || '');
}
} catch (err) {
}
finish(ok, detail);
});
function retryOrFail(msg) {
if (attempt < MAX_TRIES) {
statusEl.className = 'status pending';
statusEl.textContent = 'Coupure — nouvel essai...';
setProgress(0);
setTimeout(() => send(file, caption, attempt + 1), 1500);
} else {
finish(false, msg);
}
}
xhr.addEventListener('error', () => retryOrFail('Connexion impossible après ' + MAX_TRIES + ' essais.'));
xhr.addEventListener('timeout', () => retryOrFail('Délai dépassé — fichier trop lourd ?'));
xhr.send(formData);
}
form.addEventListener('submit', (e) => {
e.preventDefault();
const file = videoInput.files[0];
if (!file) return;
submitBtn.disabled = true;
progress.classList.add('visible');
setProgress(0);
statusEl.className = 'status pending';
statusEl.textContent = 'Préparation...';
send(file, captionEl.value, 1);
});
