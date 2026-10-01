/**
 * Little Paw Coffee — main.js
 * Inicialização: layout, idioma, consentimento LGPD, contador do carrinho,
 * menu móvel, notificações (toasts) e diálogos acessíveis.
 * Deve ser o ÚLTIMO script carregado. Scripts de página escutam "lpc:ready".
 */
'use strict';

const Toast = {
  region: null,
  ensure() {
    if (this.region) return this.region;
    this.region = el('div', { className: 'toast-region', 'aria-live': 'polite', 'aria-atomic': 'false', role: 'status' });
    document.body.appendChild(this.region);
    return this.region;
  },
  /** type: info | success | error */
  show(message, type = 'info', timeout = 4500) {
    const region = this.ensure();
    const icon = { success: '🐾', error: '⚠️', info: '☕' }[type] || '☕';
    const toast = el('div', { className: 'toast toast--' + type }, [
      el('span', { className: 'toast__icon', 'aria-hidden': 'true', text: icon }),
      el('p', { className: 'toast__msg', text: message }),
      el('button', { type: 'button', className: 'toast__close', 'aria-label': I18n.t('toast.close'), text: '×', onclick: () => dismiss() })
    ]);
    const dismiss = () => { toast.classList.add('is-leaving'); setTimeout(() => toast.remove(), 250); };
    region.appendChild(toast);
    while (region.children.length > 3) region.firstElementChild.remove();
    if (timeout) setTimeout(dismiss, timeout);
  }
};

const Dialog = {
  opener: null,
  open(dialog) {
    if (!dialog) return;
    this.opener = document.activeElement;
    if (typeof dialog.showModal === 'function') dialog.showModal();
    else dialog.setAttribute('open', '');
    const focusTarget = dialog.querySelector('[autofocus], input, button:not([data-close-dialog]), [href]') || dialog;
    focusTarget.focus();
  },
  close(dialog) {
    if (!dialog) return;
    if (typeof dialog.close === 'function') dialog.close();
    else dialog.removeAttribute('open');
  },
  bind() {
    document.querySelectorAll('dialog').forEach((d) => {
      d.addEventListener('close', () => { if (this.opener && this.opener.focus) this.opener.focus(); });
      // Clique no fundo (fora do conteúdo) fecha o diálogo.
      d.addEventListener('click', (e) => { if (e.target === d) this.close(d); });
    });
    document.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-close-dialog]');
      if (btn) this.close(btn.closest('dialog'));
    });
  }
};

function updateCartBadge() {
  const badge = document.getElementById('cart-badge');
  const link = document.getElementById('cart-link');
  if (!badge || !window.cart) return;
  const n = cart.count();
  badge.textContent = n > 99 ? '99+' : String(n);
  badge.classList.toggle('is-empty', n === 0);
  badge.classList.remove('bump');
  void badge.offsetWidth; // reinicia animação
  if (n > 0) badge.classList.add('bump');
  link.setAttribute('aria-label', I18n.t('cart.badgeAria', { n }));
}

function initMobileMenu() {
  const toggle = document.getElementById('nav-toggle');
  const nav = document.getElementById('primary-nav');
  if (!toggle || !nav) return;
  const setOpen = (open) => {
    toggle.setAttribute('aria-expanded', String(open));
    nav.classList.toggle('is-open', open);
  };
  toggle.addEventListener('click', () => setOpen(toggle.getAttribute('aria-expanded') !== 'true'));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && nav.classList.contains('is-open')) { setOpen(false); toggle.focus(); }
  });
  window.matchMedia('(min-width: 900px)').addEventListener('change', (m) => { if (m.matches) setOpen(false); });
}

function initLanguageToggle() {
  const btn = document.getElementById('lang-toggle');
  if (!btn) return;
  btn.addEventListener('click', () => applyLanguage(I18n.lang === 'pt-BR' ? 'en' : 'pt-BR'));
}

function initPageTitle() {
  const key = document.body.dataset.titleKey;
  if (key) document.title = I18n.t(key);
}

document.addEventListener('DOMContentLoaded', () => {
  I18n.load();
  Layout.render();
  I18n.apply();
  initPageTitle();
  initLanguageToggle();
  initMobileMenu();
  Dialog.bind();
  ConsentManager.init();
  updateCartBadge();

  document.addEventListener('lpc:cartchange', updateCartBadge);
  document.addEventListener('lpc:langchange', () => { initPageTitle(); updateCartBadge(); });

  document.dispatchEvent(new CustomEvent('lpc:ready'));
});

window.Toast = Toast;
window.Dialog = Dialog;
