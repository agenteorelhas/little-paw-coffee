/**
 * Little Paw Coffee — página do carrinho.
 * "Finalizar Pedido" gera apenas um código de retirada. NÃO há campos de
 * pagamento nem coleta de números de cartão, em nenhuma hipótese.
 */
'use strict';

const CartPage = {
  init() {
    this.listBox = document.getElementById('cart-items');
    this.filled = document.getElementById('cart-filled');
    this.empty = document.getElementById('cart-empty');
    this.dialog = document.getElementById('order-dialog');
    if (!this.listBox) return;
    document.getElementById('checkout-btn').addEventListener('click', () => this.checkout());
    document.getElementById('clear-btn').addEventListener('click', () => {
      if (window.confirm(I18n.t('cart.clearConfirm'))) { cart.clear(); Toast.show(I18n.t('cart.cleared'), 'info'); }
    });
    document.addEventListener('lpc:cartchange', () => this.render());
    document.addEventListener('lpc:langchange', () => this.render());
    this.render();
  },

  render() {
    const lines = cart.getLines();
    const hasItems = lines.length > 0;
    this.filled.hidden = !hasItems;
    this.empty.hidden = hasItems;
    if (!hasItems) return;

    this.listBox.replaceChildren(...lines.map((l) => {
      const name = I18n.t('item.' + l.id + '.name');
      const qtyId = 'qty-' + l.id;
      const qtyInput = el('input', {
        type: 'number', id: qtyId, className: 'qty-input', min: 1, max: Cart.MAX_QTY,
        value: l.qty, inputmode: 'numeric'
      });
      qtyInput.addEventListener('change', () => cart.updateQty(l.id, qtyInput.value));

      return el('li', { className: 'cart-item' }, [
        el('div', { className: 'cart-item__media' }, [productMedia(l.product, name)]),
        el('div', { className: 'cart-item__info' }, [
          el('h3', { className: 'cart-item__name', text: name }),
          el('p', { className: 'muted', text: I18n.t('cart.unit', { price: I18n.money(l.unit / 100) }) })
        ]),
        el('div', { className: 'qty-control' }, [
          el('label', { for: qtyId, className: 'sr-only', text: I18n.t('cart.qty') + ' — ' + name }),
          el('button', { type: 'button', className: 'qty-btn', 'aria-label': I18n.t('cart.dec', { name }), text: '−', onclick: () => cart.updateQty(l.id, l.qty - 1) }),
          qtyInput,
          el('button', { type: 'button', className: 'qty-btn', 'aria-label': I18n.t('cart.inc', { name }), text: '+', disabled: l.qty >= Cart.MAX_QTY, onclick: () => cart.updateQty(l.id, l.qty + 1) })
        ]),
        el('p', { className: 'cart-item__total' }, [
          el('span', { className: 'sr-only', text: I18n.t('cart.lineTotal') + ': ' }),
          I18n.money(l.total / 100)
        ]),
        el('button', {
          type: 'button', className: 'btn btn--ghost btn--small cart-item__remove',
          'aria-label': I18n.t('cart.removeAria', { name }),
          text: '✕ ' + I18n.t('cart.remove'),
          onclick: () => { cart.remove(l.id); Toast.show(I18n.t('cart.removed', { name }), 'info'); document.getElementById('cart-title').focus(); }
        })
      ]);
    }));

    document.getElementById('sum-subtotal').textContent = I18n.money(cart.getSubtotal() / 100);
    document.getElementById('sum-fee').textContent = I18n.money(cart.getFee() / 100);
    document.getElementById('sum-total').textContent = I18n.money(cart.getTotal() / 100);
  },

  /** Código de retirada de 4 dígitos com gerador criptográfico. */
  pickupCode() {
    const n = crypto.getRandomValues(new Uint32Array(1))[0] % 9000 + 1000;
    return String(n);
  },

  checkout() {
    if (!cart.count()) return;
    document.getElementById('order-code').textContent = this.pickupCode();
    cart.clear();
    Dialog.open(this.dialog);
  }
};

document.addEventListener('lpc:ready', () => CartPage.init());
