/**
 * Little Paw Coffee — privacidade (LGPD): solicitações do titular,
 * exportação (portabilidade) e eliminação dos dados locais.
 */
'use strict';

const PrivacyPage = {
  KEY: 'lpc_dsr_requests',
  ALL_KEYS: ['lpc_cart', 'lpc_lang', 'lpc_rsvps', 'lpc_dsr_requests', 'lpc_consent'],
  TYPES: ['access', 'fix', 'delete', 'portability', 'revoke'],

  init() {
    this.form = document.getElementById('dsr-form');
    if (!this.form) return;
    this.form.addEventListener('submit', (e) => this.onSubmit(e));
    document.getElementById('export-btn').addEventListener('click', () => this.exportData());
    document.getElementById('erase-btn').addEventListener('click', () => this.eraseData());
  },

  onSubmit(e) {
    e.preventDefault();
    if (!FormValidator.validate(this.form)) return;
    const type = document.getElementById('dsr-type').value;
    if (!this.TYPES.includes(type)) return;
    const protocol = 'LGPD-' + new Date().getFullYear() + '-' +
      String(crypto.getRandomValues(new Uint32Array(1))[0] % 1000000).padStart(6, '0');
    const entry = {
      protocol,
      type,
      name: InputSanitizer.line(document.getElementById('dsr-name').value, 80),
      email: InputSanitizer.email(document.getElementById('dsr-email').value),
      message: InputSanitizer.text(document.getElementById('dsr-message').value, 500),
      date: new Date().toISOString()
    };
    // Base legal: cumprimento de obrigação legal (art. 7º, II) — registro essencial.
    const list = SafeStorage.get(this.KEY, []);
    const safeList = Array.isArray(list) ? list.slice(-19) : [];
    safeList.push(entry);
    SafeStorage.set(this.KEY, safeList);
    this.form.reset();
    const status = document.getElementById('dsr-status');
    status.textContent = I18n.t('privacy.form.success', { p: protocol });
    Toast.show(I18n.t('privacy.form.success', { p: protocol }), 'success', 8000);
  },

  collect() {
    const data = { site: 'Little Paw Coffee', exportedAt: new Date().toISOString(), localStorage: {}, sessionStorage: {} };
    this.ALL_KEYS.forEach((k) => {
      const v = SafeStorage.get(k, undefined);
      if (v !== undefined) data.localStorage[k] = v;
    });
    const lang = SafeStorage.get('lpc_lang', undefined, window.sessionStorage);
    if (lang !== undefined) data.sessionStorage.lpc_lang = lang;
    return data;
  },

  exportData() {
    const blob = new Blob([JSON.stringify(this.collect(), null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = el('a', { href: url, download: 'little-paw-coffee-meus-dados.json' });
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    Toast.show(I18n.t('privacy.tools.exported'), 'success');
  },

  eraseData() {
    if (!window.confirm(I18n.t('privacy.tools.eraseConfirm'))) return;
    this.ALL_KEYS.forEach((k) => SafeStorage.remove(k));
    SafeStorage.remove('lpc_lang', window.sessionStorage);
    cart.load();
    cart.emit();
    Toast.show(I18n.t('privacy.tools.erased'), 'success');
    ConsentManager.showBanner();
  }
};

document.addEventListener('lpc:ready', () => PrivacyPage.init());
