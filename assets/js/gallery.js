/**
 * Little Paw Coffee — gallery.js
 * GalleryManager: autenticação do admin (SHA-256 + sal via Web Crypto),
 * limite de tentativas, sessão com expiração, upload (reprocessado em canvas
 * para remover metadados/EXIF), exclusão e persistência em localStorage.
 *
 * Observação de segurança: em um site 100% estático, a autenticação no
 * cliente é uma barreira de conveniência. Em produção, mova-a para um
 * servidor (ver README.md).
 */
'use strict';

const GalleryManager = {
  HASH_KEY: 'lpc_admin_hash',
  LOCK_KEY: 'lpc_admin_lock',
  SESSION_KEY: 'lpc_admin_session',
  UPLOADS_KEY: 'lpc_gallery',
  HIDDEN_KEY: 'lpc_gallery_hidden',
  // Hash de "lpc-salt-v1::littlepaw2024" — a senha em texto puro não fica no código.
  DEFAULT_SALT: 'lpc-salt-v1',
  DEFAULT_HASH: '3d1d4a918a16adb72b877cf8a53b876389bb6c05cb5cd6e2db788ee51cf8ea2e',
  MAX_ATTEMPTS: 5,
  LOCK_MS: 5 * 60 * 1000,
  SESSION_MS: 30 * 60 * 1000,
  MAX_FILE_BYTES: 5 * 1024 * 1024,
  MAX_DIMENSION: 1024,
  ALLOWED_TYPES: ['image/png', 'image/jpeg', 'image/webp', 'image/gif'],

  /* ---------------- Autenticação ---------------- */
  getCredential() {
    const c = SafeStorage.get(this.HASH_KEY, null);
    if (c && /^[a-f0-9]{64}$/.test(c.hash) && typeof c.salt === 'string') return c;
    const def = { salt: this.DEFAULT_SALT, hash: this.DEFAULT_HASH };
    SafeStorage.set(this.HASH_KEY, def);
    return def;
  },

  hashPassword(salt, password) { return sha256Hex(salt + '::' + password); },

  lockInfo() {
    const l = SafeStorage.get(this.LOCK_KEY, { fails: 0, until: 0 });
    return { fails: Number(l.fails) || 0, until: Number(l.until) || 0 };
  },

  /** @returns {{ok:boolean, reason?:string, left?:number, minutes?:number}} */
  async login(password) {
    if (!window.crypto || !crypto.subtle) return { ok: false, reason: 'unsupported' };
    const lock = this.lockInfo();
    const now = Date.now();
    if (lock.until > now) return { ok: false, reason: 'locked', minutes: Math.ceil((lock.until - now) / 60000) };

    const cred = this.getCredential();
    const hash = await this.hashPassword(cred.salt, String(password).slice(0, 128));
    if (constantTimeEqual(hash, cred.hash)) {
      SafeStorage.remove(this.LOCK_KEY);
      const token = Array.from(crypto.getRandomValues(new Uint8Array(16)), (b) => b.toString(16).padStart(2, '0')).join('');
      SafeStorage.set(this.SESSION_KEY, { token, expires: now + this.SESSION_MS }, window.sessionStorage);
      return { ok: true };
    }
    const fails = lock.fails + 1;
    if (fails >= this.MAX_ATTEMPTS) {
      SafeStorage.set(this.LOCK_KEY, { fails: 0, until: now + this.LOCK_MS });
      return { ok: false, reason: 'locked', minutes: Math.ceil(this.LOCK_MS / 60000) };
    }
    SafeStorage.set(this.LOCK_KEY, { fails, until: 0 });
    return { ok: false, reason: 'wrong', left: this.MAX_ATTEMPTS - fails };
  },

  isAdmin() {
    const s = SafeStorage.get(this.SESSION_KEY, null, window.sessionStorage);
    if (!s || typeof s.token !== 'string' || s.token.length !== 32 || !(s.expires > Date.now())) {
      if (s) SafeStorage.remove(this.SESSION_KEY, window.sessionStorage);
      return false;
    }
    return true;
  },

  /** Renova a expiração da sessão (janela deslizante). */
  touch() {
    const s = SafeStorage.get(this.SESSION_KEY, null, window.sessionStorage);
    if (s && this.isAdmin()) {
      s.expires = Date.now() + this.SESSION_MS;
      SafeStorage.set(this.SESSION_KEY, s, window.sessionStorage);
    }
  },

  logout() { SafeStorage.remove(this.SESSION_KEY, window.sessionStorage); },

  async changePassword(newPassword) {
    if (!this.isAdmin()) return false;
    const salt = Array.from(crypto.getRandomValues(new Uint8Array(16)), (b) => b.toString(16).padStart(2, '0')).join('');
    const hash = await this.hashPassword(salt, newPassword);
    return SafeStorage.set(this.HASH_KEY, { salt, hash });
  },

  /* ---------------- Dados ---------------- */
  getUploads() {
    const list = SafeStorage.get(this.UPLOADS_KEY, []);
    if (!Array.isArray(list)) return [];
    return list.filter((a) => a && InputSanitizer.id(a.id) &&
      typeof a.src === 'string' && /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(a.src))
      .map((a) => ({
        id: a.id,
        src: a.src,
        title: InputSanitizer.line(a.title, 80),
        artist: InputSanitizer.line(a.artist, 60),
        desc: InputSanitizer.text(a.desc, 300),
        date: typeof a.date === 'string' ? a.date.slice(0, 30) : ''
      }));
  },

  getHidden() {
    const h = SafeStorage.get(this.HIDDEN_KEY, []);
    return Array.isArray(h) ? h.filter((id) => InputSanitizer.id(id)) : [];
  },

  /** Lista combinada para exibição. */
  load() {
    const hidden = this.getHidden();
    const defaults = DEFAULT_GALLERY.filter((a) => !hidden.includes(a.id)).map((a) => ({
      id: a.id, src: a.src, artist: a.artist, uploaded: false,
      title: I18n.t(a.titleKey), desc: I18n.t(a.descKey), alt: I18n.t(a.altKey)
    }));
    const uploads = this.getUploads().map((a) => ({ ...a, uploaded: true, alt: a.title }));
    return [...uploads.reverse(), ...defaults];
  },

  delete(id) {
    if (!this.isAdmin()) return false;
    if (DEFAULT_GALLERY.some((a) => a.id === id)) {
      const hidden = this.getHidden();
      if (!hidden.includes(id)) hidden.push(id);
      return SafeStorage.set(this.HIDDEN_KEY, hidden);
    }
    return SafeStorage.set(this.UPLOADS_KEY, this.getUploads().filter((a) => a.id !== id));
  },

  restoreDefaults() {
    if (!this.isAdmin()) return;
    SafeStorage.remove(this.HIDDEN_KEY);
  },

  /* ---------------- Upload ---------------- */
  async verifyMagicBytes(file) {
    const b = new Uint8Array(await file.slice(0, 12).arrayBuffer());
    const hex = Array.from(b, (x) => x.toString(16).padStart(2, '0')).join('');
    if (hex.startsWith('89504e47')) return 'image/png';
    if (hex.startsWith('ffd8ff')) return 'image/jpeg';
    if (hex.startsWith('47494638')) return 'image/gif';
    if (hex.startsWith('52494646') && hex.slice(16, 24) === '57454250') return 'image/webp';
    return null;
  },

  /** Valida e reprocessa a imagem; retorna data URL JPEG sem metadados. */
  async processFile(file) {
    if (!file) throw new Error('gallery.upload.noFile');
    if (!this.ALLOWED_TYPES.includes(file.type)) throw new Error('gallery.upload.errType');
    if (file.size > this.MAX_FILE_BYTES) throw new Error('gallery.upload.errSize');
    const realType = await this.verifyMagicBytes(file);
    if (!realType || !this.ALLOWED_TYPES.includes(realType)) throw new Error('gallery.upload.errType');

    const dataUrl = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error('gallery.upload.errRead'));
      reader.readAsDataURL(file);
    });

    const img = await new Promise((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = () => reject(new Error('gallery.upload.errRead'));
      i.src = dataUrl;
    });

    const scale = Math.min(1, this.MAX_DIMENSION / Math.max(img.naturalWidth, img.naturalHeight));
    const w = Math.max(1, Math.round(img.naturalWidth * scale));
    const h = Math.max(1, Math.round(img.naturalHeight * scale));
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#FDF6E3';
    ctx.fillRect(0, 0, w, h);
    ctx.drawImage(img, 0, 0, w, h);
    return canvas.toDataURL('image/jpeg', 0.82);
  },

  async upload(file, meta) {
    if (!this.isAdmin()) throw new Error('gallery.sessionExpired');
    const src = await this.processFile(file);
    const entry = {
      id: 'up-' + Date.now().toString(36) + '-' + crypto.getRandomValues(new Uint32Array(1))[0].toString(36),
      src,
      title: InputSanitizer.line(meta.title, 80),
      artist: InputSanitizer.line(meta.artist, 60),
      desc: InputSanitizer.text(meta.desc, 300),
      date: new Date().toISOString()
    };
    const list = this.getUploads();
    list.push(entry);
    if (!SafeStorage.set(this.UPLOADS_KEY, list)) throw new Error('gallery.upload.errQuota');
    return entry;
  }
};

/* ---------------- Interface da página galeria.html ---------------- */
const GalleryUI = {
  init() {
    this.grid = document.getElementById('gallery-grid');
    this.panel = document.getElementById('admin-panel');
    this.adminBtn = document.getElementById('admin-btn');
    this.logoutBtn = document.getElementById('logout-btn');
    this.status = document.getElementById('admin-status');
    this.loginDialog = document.getElementById('login-dialog');
    if (!this.grid) return;

    this.adminBtn.addEventListener('click', () => {
      if (GalleryManager.isAdmin()) { this.panel.querySelector('input')?.focus(); return; }
      document.getElementById('login-error').textContent = '';
      document.getElementById('login-form').reset();
      Dialog.open(this.loginDialog);
    });
    this.logoutBtn.addEventListener('click', () => { GalleryManager.logout(); this.refresh(); this.adminBtn.focus(); });
    document.getElementById('login-form').addEventListener('submit', (e) => this.onLogin(e));
    document.getElementById('upload-form').addEventListener('submit', (e) => this.onUpload(e));
    document.getElementById('password-form').addEventListener('submit', (e) => this.onChangePassword(e));
    document.getElementById('restore-btn').addEventListener('click', () => {
      if (!this.guard()) return;
      GalleryManager.restoreDefaults();
      this.renderGrid();
      Toast.show(I18n.t('gallery.restored'), 'success');
    });
    ['click', 'keydown'].forEach((ev) => this.panel.addEventListener(ev, () => GalleryManager.touch()));
    document.addEventListener('lpc:langchange', () => this.renderGrid());
    this.refresh();
  },

  guard() {
    if (GalleryManager.isAdmin()) return true;
    Toast.show(I18n.t('gallery.sessionExpired'), 'error');
    this.refresh();
    return false;
  },

  refresh() {
    const admin = GalleryManager.isAdmin();
    this.panel.hidden = !admin;
    this.logoutBtn.hidden = !admin;
    this.status.hidden = !admin;
    this.adminBtn.setAttribute('aria-pressed', String(admin));
    document.body.classList.toggle('is-admin', admin);
    this.renderGrid();
  },

  renderGrid() {
    const admin = GalleryManager.isAdmin();
    const items = GalleryManager.load();
    if (!items.length) {
      this.grid.replaceChildren(el('p', { className: 'empty-note', text: I18n.t('gallery.empty') }));
      return;
    }
    this.grid.replaceChildren(...items.map((art) => {
      const caption = el('figcaption', { className: 'art-card__body' }, [
        art.uploaded ? el('span', { className: 'tag tag--new', text: I18n.t('gallery.uploadedBadge') }) : null,
        el('h3', { className: 'art-card__title', text: art.title }),
        el('p', { className: 'art-card__artist', text: I18n.t('gallery.by', { artist: art.artist }) }),
        art.desc ? el('p', { className: 'art-card__desc', text: art.desc }) : null,
        admin ? el('button', {
          type: 'button', className: 'btn btn--danger btn--small',
          'aria-label': I18n.t('gallery.deleteAria', { title: art.title }),
          text: '🗑 ' + I18n.t('gallery.delete'),
          onclick: () => this.onDelete(art)
        }) : null
      ]);
      return el('figure', { className: 'art-card' }, [
        el('div', { className: 'art-card__frame' }, [el('img', { src: art.src, alt: art.alt, loading: 'lazy' })]),
        caption
      ]);
    }));
  },

  async onLogin(e) {
    e.preventDefault();
    const input = document.getElementById('admin-password');
    const err = document.getElementById('login-error');
    const btn = e.target.querySelector('button[type="submit"]');
    btn.disabled = true;
    try {
      const res = await GalleryManager.login(input.value);
      input.value = '';
      if (res.ok) {
        Dialog.close(this.loginDialog);
        this.refresh();
        Toast.show(I18n.t('gallery.login.success'), 'success');
        this.panel.focus();
      } else if (res.reason === 'locked') {
        err.textContent = I18n.t('gallery.login.locked', { m: res.minutes });
      } else if (res.reason === 'unsupported') {
        err.textContent = I18n.t('gallery.login.unsupported');
      } else {
        err.textContent = I18n.t('gallery.login.error', { n: res.left });
      }
    } finally {
      btn.disabled = false;
    }
  },

  async onUpload(e) {
    e.preventDefault();
    if (!this.guard()) return;
    const form = e.target;
    if (!FormValidator.validate(form)) return;
    const fileInput = document.getElementById('upload-file');
    const file = fileInput.files && fileInput.files[0];
    const btn = form.querySelector('button[type="submit"]');
    const status = document.getElementById('upload-status');
    btn.disabled = true;
    status.textContent = I18n.t('gallery.upload.processing');
    try {
      await GalleryManager.upload(file, {
        title: document.getElementById('upload-title').value,
        artist: document.getElementById('upload-artist').value,
        desc: document.getElementById('upload-desc').value
      });
      form.reset();
      status.textContent = '';
      this.renderGrid();
      Toast.show(I18n.t('gallery.upload.success'), 'success');
    } catch (err) {
      const key = err && /^gallery\./.test(err.message) ? err.message : 'gallery.upload.errRead';
      status.textContent = I18n.t(key);
      Toast.show(I18n.t(key), 'error');
    } finally {
      btn.disabled = false;
    }
  },

  onDelete(art) {
    if (!this.guard()) return;
    if (!window.confirm(I18n.t('gallery.deleteConfirm', { title: art.title }))) return;
    GalleryManager.delete(art.id);
    this.renderGrid();
    Toast.show(I18n.t('gallery.deleted'), 'info');
    this.adminBtn.focus();
  },

  async onChangePassword(e) {
    e.preventDefault();
    if (!this.guard()) return;
    const form = e.target;
    if (!FormValidator.validate(form)) return;
    const pw = document.getElementById('new-password');
    const confirmPw = document.getElementById('confirm-password');
    const status = document.getElementById('password-status');
    if (pw.value.length < 10 || !/[a-z]/i.test(pw.value) || !/\d/.test(pw.value)) {
      status.textContent = I18n.t('gallery.pw.weak'); pw.focus(); return;
    }
    if (pw.value !== confirmPw.value) {
      status.textContent = I18n.t('gallery.pw.mismatch'); confirmPw.focus(); return;
    }
    await GalleryManager.changePassword(pw.value);
    form.reset();
    status.textContent = I18n.t('gallery.pw.success');
    Toast.show(I18n.t('gallery.pw.success'), 'success');
  }
};

document.addEventListener('lpc:ready', () => GalleryUI.init());

window.GalleryManager = GalleryManager;
