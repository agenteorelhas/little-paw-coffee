/**
 * Little Paw Coffee — data.js
 * Catálogo confiável (preços em centavos), eventos e acervo inicial da galeria.
 * Os textos ficam em i18n.js (chaves item.<id>.name / item.<id>.desc etc.).
 * Para adicionar um item novo: inclua aqui + chaves de tradução em i18n.js.
 */
'use strict';

const IMG = 'assets/images/';

const MENU_CATEGORIES = [
  { id: 'hot', key: 'menu.cat.hot', icon: '☕' },
  { id: 'cold', key: 'menu.cat.cold', icon: '🧊' },
  { id: 'snacks', key: 'menu.cat.snacks', icon: '🥪' },
  { id: 'desserts', key: 'menu.cat.desserts', icon: '🍫' }
];

const CATALOG = [
  { id: 'latte-raposa', cat: 'hot', price: 1690, img: IMG + 'menu-specialty-latte.png', emoji: '🦊', tags: ['signature'] },
  { id: 'cappuccino-gato', cat: 'hot', price: 1490, img: IMG + 'menu-cappuccino-gato.png', emoji: '🐱', tags: [] },
  { id: 'choco-focinho', cat: 'hot', price: 1390, img: IMG + 'menu-choco-focinho.png', emoji: '🐶', tags: [] },
  { id: 'cha-dragao', cat: 'hot', price: 1190, img: IMG + 'menu-cha-dragao.png', emoji: '🐉', tags: ['vegan'] },
  { id: 'frappe-lobo', cat: 'cold', price: 1890, img: IMG + 'menu-frappe-lobo.png', emoji: '🐺', tags: ['cold'] },
  { id: 'suco-pata', cat: 'cold', price: 1290, img: IMG + 'menu-suco-pata.png', emoji: '🍊', tags: ['vegan', 'cold'] },
  { id: 'cold-brew-cauda', cat: 'cold', price: 1590, img: IMG + 'menu-cold-brew-cauda.png', emoji: '🐿️', tags: ['new', 'cold'] },
  { id: 'sanduiche-toca', cat: 'snacks', price: 2290, img: IMG + 'menu-sanduiche-toca.png', emoji: '🦡', tags: [] },
  { id: 'biscoito-patinha', cat: 'snacks', price: 990, img: IMG + 'menu-biscoito-patinha.png', emoji: '🐾', tags: [] },
  { id: 'pao-queijo-bigode', cat: 'snacks', price: 1190, img: IMG + 'menu-pao-queijo-bigode.png', emoji: '🐭', tags: [] },
  { id: 'paw-brownie', cat: 'desserts', price: 1450, img: IMG + 'menu-paw-brownie.png', emoji: '🐾', tags: ['signature'] },
  { id: 'cupcake-raposa', cat: 'desserts', price: 1290, img: IMG + 'menu-cupcake-raposa.png', emoji: '🦊', tags: ['new'] },
  { id: 'cheesecake-coelho', cat: 'desserts', price: 1690, img: IMG + 'menu-cheesecake-coelho.png', emoji: '🐰', tags: [] }
];

const EVENTS = [
  { id: 'arte-furry', date: '2026-10-17', time: '19:00–23:00', price: 0, spots: 40, icon: '🎨' },
  { id: 'degustacao-pelucias', date: '2026-10-25', time: '15:00–18:00', price: 3500, spots: 25, icon: '🧸' },
  { id: 'encontro-comunidade', date: '2026-11-07', time: '14:00–20:00', price: 0, spots: 80, icon: '🐾' },
  { id: 'workshop-latte', date: '2026-11-21', time: '10:00–12:30', price: 6000, spots: 12, icon: '☕' },
  { id: 'sarau-uivos', date: '2026-12-05', time: '19:30–22:30', price: 0, spots: 50, icon: '🎤' }
];

const DEFAULT_GALLERY = [
  { id: 'art-1', src: IMG + 'gallery-art-1.png', artist: 'Kael Lobato', titleKey: 'gallery.art1.title', descKey: 'gallery.art1.desc', altKey: 'gallery.art1.alt' },
  { id: 'art-2', src: IMG + 'gallery-art-2.png', artist: 'Mel Orelhuda', titleKey: 'gallery.art2.title', descKey: 'gallery.art2.desc', altKey: 'gallery.art2.alt' },
  { id: 'art-3', src: IMG + 'gallery-art-3.png', artist: 'Rafa Fennec', titleKey: 'gallery.art3.title', descKey: 'gallery.art3.desc', altKey: 'gallery.art3.alt' }
];

function findProduct(id) { return CATALOG.find((p) => p.id === id) || null; }
function findEvent(id) { return EVENTS.find((e) => e.id === id) || null; }

/** Próximo evento a partir de hoje (ou o primeiro, se todos passaram). */
function nextEvent() {
  const today = new Date().toISOString().slice(0, 10);
  return EVENTS.find((e) => e.date >= today) || EVENTS[0];
}

/** Cria a mídia de um produto: imagem real ou ilustração em CSS com emoji. */
function productMedia(product, name) {
  if (product.img) {
    return el('img', { src: product.img, alt: name, loading: 'lazy', width: 900, height: 672, className: 'product-media' });
  }
  return el('div', { className: 'product-media product-media--placeholder', dataset: { cat: product.cat }, role: 'img', 'aria-label': name }, [
    el('span', { className: 'product-media__emoji', 'aria-hidden': 'true', text: product.emoji })
  ]);
}

Object.assign(window, { MENU_CATEGORIES, CATALOG, EVENTS, DEFAULT_GALLERY, findProduct, findEvent, nextEvent, productMedia });
