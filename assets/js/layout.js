/**
 * Little Paw Coffee — layout.js
 * Cabeçalho e rodapé compartilhados. Para adicionar uma página nova ao menu,
 * basta incluir um objeto em NAV_ITEMS e as chaves de tradução em i18n.js.
 */
'use strict';

const NAV_ITEMS = [
  { id: 'home', href: 'index.html', key: 'nav.home' },
  { id: 'menu', href: 'cardapio.html', key: 'nav.menu' },
  { id: 'gallery', href: 'galeria.html', key: 'nav.gallery' },
  { id: 'events', href: 'eventos.html', key: 'nav.events' },
  { id: 'cart', href: 'carrinho.html', key: 'nav.cart' }
];

const Layout = {
  render() {
    const page = document.body.dataset.page || '';
    const header = document.getElementById('site-header');
    const footer = document.getElementById('site-footer');
    if (header) header.replaceChildren(this.header(page));
    if (footer) footer.replaceChildren(this.footer());
  },

  header(page) {
    const t = (k) => I18n.t(k);
    const links = NAV_ITEMS.map((item) => el('li', {}, [
      el('a', {
        href: item.href,
        className: 'nav-link',
        'aria-current': item.id === page ? 'page' : null,
        'data-i18n': item.key,
        text: t(item.key)
      })
    ]));

    return el('div', { className: 'container header-inner' }, [
      el('a', { href: 'index.html', className: 'brand', 'data-i18n-attr': 'aria-label:brand.home', 'aria-label': t('brand.home') }, [
        el('img', { src: 'assets/images/logo.png', alt: '', width: 56, height: 56, className: 'brand__logo' }),
        el('span', { className: 'brand__text' }, [
          el('span', { className: 'brand__name', text: 'Little Paw Coffee' }),
          el('span', { className: 'brand__tagline', 'data-i18n': 'brand.tagline', text: t('brand.tagline') })
        ])
      ]),
      el('button', {
        type: 'button', className: 'nav-toggle', id: 'nav-toggle',
        'aria-expanded': 'false', 'aria-controls': 'primary-nav',
        'data-i18n-attr': 'aria-label:nav.toggle', 'aria-label': t('nav.toggle')
      }, [el('span', { className: 'nav-toggle__bar', 'aria-hidden': 'true' }), el('span', { className: 'nav-toggle__bar', 'aria-hidden': 'true' }), el('span', { className: 'nav-toggle__bar', 'aria-hidden': 'true' })]),
      el('nav', { id: 'primary-nav', className: 'primary-nav', 'data-i18n-attr': 'aria-label:nav.main', 'aria-label': t('nav.main') }, [
        el('ul', { className: 'nav-list' }, links)
      ]),
      el('div', { className: 'header-actions' }, [
        el('button', {
          type: 'button', className: 'lang-toggle', id: 'lang-toggle',
          'data-i18n': 'lang.label', text: t('lang.label'),
          'data-i18n-attr': 'aria-label:lang.aria', 'aria-label': t('lang.aria')
        }),
        el('a', { href: 'carrinho.html', className: 'cart-link', id: 'cart-link', 'aria-label': I18n.t('cart.badgeAria', { n: 0 }) }, [
          el('span', { className: 'cart-link__icon', 'aria-hidden': 'true', text: '🛒' }),
          el('span', { className: 'cart-badge', id: 'cart-badge', 'aria-hidden': 'true', text: '0' })
        ])
      ])
    ]);
  },

  footer() {
    const t = (k) => I18n.t(k);
    const social = [
      ['instagram', 'IG'], ['twitter', 'X'], ['telegram', 'TG'], ['bluesky', 'BS']
    ].map(([id, label]) => el('li', {}, [
      el('span', { className: 'social-icon', role: 'img', 'data-i18n-attr': 'aria-label:social.' + id, 'aria-label': t('social.' + id) }, [
        el('span', { 'aria-hidden': 'true', text: label })
      ])
    ]));

    return el('div', { className: 'container footer-inner' }, [
      el('div', { className: 'footer-col footer-col--brand' }, [
        el('img', { src: 'assets/images/logo.png', alt: 'Little Paw Coffee', width: 88, height: 88, className: 'footer-logo', loading: 'lazy' }),
        el('p', { 'data-i18n': 'footer.about', text: t('footer.about') })
      ]),
      el('div', { className: 'footer-col' }, [
        el('h2', { className: 'footer-title', 'data-i18n': 'footer.visit', text: t('footer.visit') }),
        el('address', {}, [
          el('p', { 'data-i18n': 'footer.address', text: t('footer.address') }),
          el('p', { 'data-i18n': 'footer.hours', text: t('footer.hours') })
        ])
      ]),
      el('div', { className: 'footer-col' }, [
        el('h2', { className: 'footer-title', 'data-i18n': 'footer.links', text: t('footer.links') }),
        el('ul', { className: 'footer-links' }, [
          el('li', {}, [el('a', { href: 'privacidade.html', 'data-i18n': 'footer.privacy', text: t('footer.privacy') })]),
          el('li', {}, [el('button', { type: 'button', className: 'link-button', 'data-action': 'manage-cookies', 'data-i18n': 'footer.cookies', text: t('footer.cookies') })]),
          ...NAV_ITEMS.slice(1, 4).map((n) => el('li', {}, [el('a', { href: n.href, 'data-i18n': n.key, text: t(n.key) })]))
        ])
      ]),
      el('div', { className: 'footer-col' }, [
        el('h2', { className: 'footer-title', 'data-i18n': 'footer.social', text: t('footer.social') }),
        el('ul', { className: 'social-list' }, social),
        el('p', { className: 'footer-small', 'data-i18n': 'footer.socialSoon', text: t('footer.socialSoon') })
      ]),
      el('p', { className: 'footer-rights', 'data-i18n': 'footer.rights', text: t('footer.rights') })
    ]);
  }
};

window.NAV_ITEMS = NAV_ITEMS;
window.Layout = Layout;
