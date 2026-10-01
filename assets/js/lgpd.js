/**
 * Little Paw Coffee — lgpd.js
 * ConsentManager: banner de consentimento (LGPD, Lei nº 13.709/2018),
 * aceite/recusa e verificação antes de gravações não essenciais.
 *
 * Categorias:
 *  - essential   → consentimento, carrinho, sessão/senha admin, galeria do admin (sempre permitido)
 *  - preferences → idioma, inscrições em eventos (somente com aceite)
 */
'use strict';

const ConsentManager = {
  KEY: 'lpc_consent',
  VERSION: 1,
  NON_ESSENTIAL_KEYS: ['lpc_lang', 'lpc_rsvps'],
  banner: null,

  get state() {
    const s = SafeStorage.get(this.KEY, null);
    if (!s || s.version !== this.VERSION || !['accepted', 'declined'].includes(s.status)) return null;
    return s;
  },

  hasDecided() { return this.state !== null; },

  canStore(category = 'essential') {
    if (category === 'essential') return true;
    const s = this.state;
    return !!s && s.status === 'accepted';
  },

  init() {
    document.querySelectorAll('[data-action="manage-cookies"]').forEach((btn) => {
      btn.addEventListener('click', (e) => { e.preventDefault(); this.showBanner(); });
    });
    if (!this.hasDecided()) this.showBanner();
  },

  record(status) {
    SafeStorage.set(this.KEY, { version: this.VERSION, status, date: new Date().toISOString() });
  },

  accept() {
    this.record('accepted');
    // Migra preferências temporárias para armazenamento persistente.
    const sessionLang = SafeStorage.get('lpc_lang', null, window.sessionStorage);
    if (sessionLang) SafeStorage.set('lpc_lang', sessionLang);
    this.hideBanner();
    if (window.Toast) Toast.show(I18n.t('lgpd.accepted'), 'success');
    document.dispatchEvent(new CustomEvent('lpc:consentchange', { detail: { status: 'accepted' } }));
  },

  decline() {
    this.record('declined');
    // Remove dados não essenciais já gravados; idioma passa a valer só na sessão.
    const lang = SafeStorage.get('lpc_lang', null);
    this.NON_ESSENTIAL_KEYS.forEach((k) => SafeStorage.remove(k));
    if (lang) SafeStorage.set('lpc_lang', lang, window.sessionStorage);
    this.hideBanner();
    if (window.Toast) Toast.show(I18n.t('lgpd.declined'), 'info');
    document.dispatchEvent(new CustomEvent('lpc:consentchange', { detail: { status: 'declined' } }));
  },

  showBanner() {
    if (this.banner) { this.banner.querySelector('button')?.focus(); return; }
    const titleId = 'lgpd-title';
    const textId = 'lgpd-text';
    const banner = el('section', {
      className: 'cookie-banner',
      role: 'region',
      'aria-labelledby': titleId,
      'aria-describedby': textId,
      'data-i18n-attr': 'aria-label:lgpd.aria'
    }, [
      el('div', { className: 'cookie-banner__inner container' }, [
        el('span', { className: 'cookie-banner__icon', 'aria-hidden': 'true', text: '🍪' }),
        el('div', { className: 'cookie-banner__body' }, [
          el('h2', { id: titleId, className: 'cookie-banner__title', 'data-i18n': 'lgpd.title', text: I18n.t('lgpd.title') }),
          el('p', { id: textId, 'data-i18n': 'lgpd.text', text: I18n.t('lgpd.text') }),
          el('a', { href: 'privacidade.html#cookies', 'data-i18n': 'lgpd.more', text: I18n.t('lgpd.more') })
        ]),
        el('div', { className: 'cookie-banner__actions' }, [
          el('button', { type: 'button', className: 'btn btn--primary', 'data-i18n': 'lgpd.accept', text: I18n.t('lgpd.accept'), onclick: () => this.accept() }),
          el('button', { type: 'button', className: 'btn btn--outline', 'data-i18n': 'lgpd.decline', text: I18n.t('lgpd.decline'), onclick: () => this.decline() })
        ])
      ])
    ]);
    document.body.appendChild(banner);
    this.banner = banner;
    requestAnimationFrame(() => banner.classList.add('is-visible'));
  },

  hideBanner() {
    if (!this.banner) return;
    const b = this.banner;
    this.banner = null;
    b.classList.remove('is-visible');
    setTimeout(() => b.remove(), 300);
  }
};

window.ConsentManager = ConsentManager;
