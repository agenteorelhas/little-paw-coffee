/** Little Paw Coffee — cardápio temático renderizado a partir do catálogo. */
'use strict';

const MenuPage = {
  init() {
    this.root = document.getElementById('menu-root');
    this.jump = document.getElementById('menu-jump');
    if (!this.root) return;
    this.render();
    document.addEventListener('lpc:langchange', () => this.render());
    if (location.hash) {
      const target = document.getElementById(location.hash.slice(1));
      if (target) setTimeout(() => target.scrollIntoView({ block: 'center' }), 50);
    }
  },

  render() {
    this.jump.replaceChildren(...MENU_CATEGORIES.map((c) => el('li', {}, [
      el('a', { href: '#cat-' + c.id, className: 'chip', text: c.icon + ' ' + I18n.t(c.key) })
    ])));

    this.root.replaceChildren(...MENU_CATEGORIES.map((cat) => {
      const headingId = 'cat-' + cat.id + '-title';
      return el('section', { className: 'menu-section', id: 'cat-' + cat.id, 'aria-labelledby': headingId }, [
        el('h2', { id: headingId, className: 'section-title' }, [
          el('span', { 'aria-hidden': 'true', text: cat.icon + ' ' }), I18n.t(cat.key)
        ]),
        el('div', { className: 'grid grid--menu' }, CATALOG.filter((p) => p.cat === cat.id).map((p) => this.card(p)))
      ]);
    }));
  },

  card(p) {
    const name = I18n.t('item.' + p.id + '.name');
    const btn = el('button', {
      type: 'button', className: 'btn btn--primary btn--block add-to-cart',
      'aria-label': I18n.t('menu.addAria', { name }),
      text: I18n.t('menu.add')
    });
    btn.addEventListener('click', () => this.add(p, name, btn));

    return el('article', { className: 'card menu-card', id: 'item-' + p.id }, [
      productMedia(p, name),
      el('div', { className: 'card__body' }, [
        p.tags.length ? el('ul', { className: 'tag-list' }, p.tags.map((t) => el('li', { className: 'tag tag--' + t, text: I18n.t('tag.' + t) }))) : null,
        el('h3', { className: 'card__title', text: name }),
        el('p', { className: 'card__desc', text: I18n.t('item.' + p.id + '.desc') }),
        el('div', { className: 'card__footer' }, [
          el('p', { className: 'price', text: I18n.money(p.price / 100) }),
          btn
        ])
      ])
    ]);
  },

  add(p, name, btn) {
    if (!cart.add(p.id)) {
      Toast.show(I18n.t('menu.limit', { n: Cart.MAX_QTY }), 'error');
      return;
    }
    btn.textContent = I18n.t('menu.added');
    btn.classList.add('is-added');
    Toast.show(I18n.t('menu.toast', { name }), 'success', 2500);
    clearTimeout(btn._t);
    btn._t = setTimeout(() => {
      btn.textContent = I18n.t('menu.add');
      btn.classList.remove('is-added');
    }, 1600);
  }
};

document.addEventListener('lpc:ready', () => MenuPage.init());
