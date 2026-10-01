/**
 * Little Paw Coffee — eventos e inscrições (RSVP).
 * Inscrições exigem consentimento explícito no formulário; só são gravadas
 * no localStorage se os itens não essenciais forem aceitos (LGPD). Caso
 * contrário, ficam apenas em memória durante a visita.
 */
'use strict';

const EventsPage = {
  KEY: 'lpc_rsvps',
  memory: [],

  init() {
    this.list = document.getElementById('events-list');
    this.form = document.getElementById('rsvp-form');
    this.select = document.getElementById('rsvp-event');
    this.mine = document.getElementById('my-rsvps');
    if (!this.list) return;
    this.form.addEventListener('submit', (e) => this.onSubmit(e));
    document.addEventListener('lpc:langchange', () => this.render());
    document.addEventListener('lpc:consentchange', () => this.renderMine());
    this.render();
  },

  getRsvps() {
    if (!ConsentManager.canStore('preferences')) return this.memory;
    const list = SafeStorage.get(this.KEY, []);
    return Array.isArray(list)
      ? list.filter((r) => r && findEvent(r.eventId) && typeof r.name === 'string' && typeof r.email === 'string').slice(0, 50)
      : [];
  },

  saveRsvps(list) {
    if (ConsentManager.canStore('preferences')) {
      SafeStorage.set(this.KEY, list);
      return true;
    }
    this.memory = list;
    return false;
  },

  render() {
    this.list.replaceChildren(...EVENTS.map((ev) => {
      const name = I18n.t('event.' + ev.id + '.name');
      return el('article', { className: 'card event-card', id: 'event-' + ev.id }, [
        el('div', { className: 'event-card__date', 'aria-hidden': 'true' }, [
          el('span', { className: 'event-card__day', text: I18n.date(ev.date, { day: '2-digit' }) }),
          el('span', { className: 'event-card__month', text: I18n.date(ev.date, { month: 'short' }).replace('.', '') }),
          el('span', { className: 'event-card__icon', text: ev.icon })
        ]),
        el('div', { className: 'card__body' }, [
          el('h2', { className: 'card__title', text: name }),
          el('ul', { className: 'event-meta' }, [
            el('li', {}, [el('time', { datetime: ev.date, text: '📅 ' + I18n.date(ev.date) })]),
            el('li', { text: '🕒 ' + I18n.t('events.time', { time: ev.time }) }),
            el('li', { text: '🎟️ ' + (ev.price ? I18n.t('events.price', { price: I18n.money(ev.price / 100) }) : I18n.t('events.free')) }),
            el('li', { text: '🐾 ' + I18n.t('events.spots', { n: ev.spots }) })
          ]),
          el('p', { text: I18n.t('event.' + ev.id + '.desc') }),
          el('button', {
            type: 'button', className: 'btn btn--primary',
            'aria-label': I18n.t('events.joinAria', { name }),
            text: I18n.t('events.join'),
            onclick: () => this.prefill(ev.id)
          })
        ])
      ]);
    }));

    const current = this.select.value;
    this.select.replaceChildren(
      el('option', { value: '', text: I18n.t('events.form.select') }),
      ...EVENTS.map((ev) => el('option', { value: ev.id, text: I18n.t('event.' + ev.id + '.name') + ' — ' + I18n.date(ev.date, { day: '2-digit', month: '2-digit' }) }))
    );
    this.select.value = current;
    this.renderMine();
  },

  renderMine() {
    const list = this.getRsvps();
    if (!list.length) {
      this.mine.replaceChildren(el('p', { className: 'muted', text: I18n.t('events.none') }));
      return;
    }
    this.mine.replaceChildren(el('ul', { className: 'rsvp-list' }, list.map((r) => {
      const evName = I18n.t('event.' + r.eventId + '.name');
      return el('li', { className: 'rsvp-item' }, [
        el('span', {}, [el('strong', { text: evName }), ' — ' + r.name]),
        el('button', {
          type: 'button', className: 'btn btn--outline btn--small',
          'aria-label': I18n.t('events.cancelAria', { event: evName }),
          text: I18n.t('events.cancel'),
          onclick: () => this.cancel(r.id)
        })
      ]);
    })));
  },

  prefill(eventId) {
    this.select.value = eventId;
    this.form.scrollIntoView({ behavior: 'smooth', block: 'start' });
    document.getElementById('rsvp-name').focus({ preventScroll: true });
  },

  onSubmit(e) {
    e.preventDefault();
    if (!FormValidator.validate(this.form)) return;
    const eventId = InputSanitizer.id(this.select.value);
    if (!eventId || !findEvent(eventId)) { FormValidator.showError(this.select, 'val.required'); return; }
    const name = InputSanitizer.line(document.getElementById('rsvp-name').value, 60);
    const email = InputSanitizer.email(document.getElementById('rsvp-email').value);
    const list = this.getRsvps();
    if (list.some((r) => r.eventId === eventId && r.email === email)) {
      Toast.show(I18n.t('events.duplicate'), 'error');
      return;
    }
    list.push({ id: 'r' + Date.now().toString(36), eventId, name, email, consentAt: new Date().toISOString() });
    const persisted = this.saveRsvps(list);
    this.form.reset();
    this.renderMine();
    Toast.show(persisted
      ? I18n.t('events.toast', { event: I18n.t('event.' + eventId + '.name') })
      : I18n.t('events.toastMemory'), 'success', 6000);
  },

  cancel(id) {
    this.saveRsvps(this.getRsvps().filter((r) => r.id !== id));
    this.renderMine();
    Toast.show(I18n.t('events.cancelled'), 'info');
  }
};

document.addEventListener('lpc:ready', () => EventsPage.init());
