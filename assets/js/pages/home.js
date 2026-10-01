/** Little Paw Coffee — página inicial: destaques dinâmicos. */
'use strict';

const HomePage = {
  FEATURED: ['paw-brownie', 'latte-raposa'],

  init() {
    this.box = document.getElementById('featured-grid');
    if (!this.box) return;
    this.render();
    document.addEventListener('lpc:langchange', () => this.render());
  },

  render() {
    const cards = this.FEATURED.map((id) => {
      const p = findProduct(id);
      const name = I18n.t('item.' + id + '.name');
      return el('article', { className: 'card feature-card' }, [
        productMedia(p, name),
        el('div', { className: 'card__body' }, [
          el('span', { className: 'tag tag--signature', text: I18n.t('tag.signature') }),
          el('h3', { className: 'card__title', text: name }),
          el('p', { text: I18n.t('item.' + id + '.desc') }),
          el('p', { className: 'price', text: I18n.money(p.price / 100) }),
          el('a', { className: 'btn btn--outline', href: 'cardapio.html#item-' + id, text: I18n.t('home.featured.seeMenu') })
        ])
      ]);
    });

    const ev = nextEvent();
    const evName = I18n.t('event.' + ev.id + '.name');
    cards.push(el('article', { className: 'card feature-card feature-card--event' }, [
      el('div', { className: 'event-visual', role: 'img', 'aria-label': I18n.t('home.featured.eventAlt') }, [
        el('span', { className: 'event-visual__icon', 'aria-hidden': 'true', text: ev.icon }),
        el('span', { className: 'event-visual__date', 'aria-hidden': 'true', text: I18n.date(ev.date, { day: '2-digit', month: 'short' }) })
      ]),
      el('div', { className: 'card__body' }, [
        el('span', { className: 'tag tag--event', text: I18n.t('home.featured.eventLabel') }),
        el('h3', { className: 'card__title', text: evName }),
        el('p', { className: 'event-date', text: '📅 ' + I18n.date(ev.date) }),
        el('p', { text: I18n.t('event.' + ev.id + '.desc') }),
        el('a', { className: 'btn btn--outline', href: 'eventos.html#event-' + ev.id, text: I18n.t('home.featured.seeEvent') })
      ])
    ]));
    this.box.replaceChildren(...cards);
  }
};

document.addEventListener('lpc:ready', () => HomePage.init());
