/**
 * Little Paw Coffee — cart.js
 * Carrinho fictício. Armazena SOMENTE {id, qty}; preços vêm sempre do
 * catálogo confiável (data.js), evitando adulteração via localStorage.
 * Não existe nenhum meio de pagamento nem coleta de dados de cartão.
 */
'use strict';

class Cart {
  static KEY = 'lpc_cart';
  static MAX_QTY = 20;
  static MAX_LINES = 50;
  static FEE_RATE = 0.10;

  constructor() {
    this.items = [];
    this.load();
    // Sincroniza entre abas.
    window.addEventListener('storage', (e) => {
      if (e.key === Cart.KEY) { this.load(); this.emit(); }
    });
  }

  load() {
    const raw = SafeStorage.get(Cart.KEY, []);
    const clean = [];
    if (Array.isArray(raw)) {
      raw.forEach((line) => {
        const id = line && InputSanitizer.id(line.id);
        const qty = line && InputSanitizer.int(line.qty, 1, Cart.MAX_QTY);
        if (id && qty && findProduct(id) && !clean.some((l) => l.id === id)) clean.push({ id, qty });
      });
    }
    this.items = clean.slice(0, Cart.MAX_LINES);
  }

  persist() {
    SafeStorage.set(Cart.KEY, this.items); // essencial (execução do pedido)
    this.emit();
  }

  emit() {
    document.dispatchEvent(new CustomEvent('lpc:cartchange', { detail: { count: this.count() } }));
  }

  /** @returns {boolean} false se o limite foi atingido */
  add(id, qty = 1) {
    if (!findProduct(id)) return false;
    const line = this.items.find((l) => l.id === id);
    if (line) {
      if (line.qty >= Cart.MAX_QTY) return false;
      line.qty = Math.min(Cart.MAX_QTY, line.qty + qty);
    } else {
      if (this.items.length >= Cart.MAX_LINES) return false;
      this.items.push({ id, qty: Math.min(Cart.MAX_QTY, Math.max(1, qty)) });
    }
    this.persist();
    return true;
  }

  remove(id) {
    this.items = this.items.filter((l) => l.id !== id);
    this.persist();
  }

  updateQty(id, qty) {
    const n = InputSanitizer.int(qty, 0, Cart.MAX_QTY);
    if (n === null) return;
    if (n === 0) { this.remove(id); return; }
    const line = this.items.find((l) => l.id === id);
    if (line) { line.qty = n; this.persist(); }
  }

  getLines() {
    return this.items.map((l) => {
      const p = findProduct(l.id);
      return { ...l, product: p, unit: p.price, total: p.price * l.qty };
    });
  }

  count() { return this.items.reduce((s, l) => s + l.qty, 0); }

  /** Valores em centavos. */
  getSubtotal() { return this.getLines().reduce((s, l) => s + l.total, 0); }
  getFee() { return Math.round(this.getSubtotal() * Cart.FEE_RATE); }
  getTotal() { return this.getSubtotal() + this.getFee(); }

  clear() {
    this.items = [];
    this.persist();
  }
}

window.Cart = Cart;
window.cart = new Cart();
