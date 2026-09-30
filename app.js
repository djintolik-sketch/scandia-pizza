/* Scandia Pizza — v5 functional demo
   Design intentionally preserved. Static demo, no Node.js/backend required.
*/
const MENU_URL = './menu.json';
const CART_KEY = 'scandiaCart_v5';
const ORDERS_KEY = 'scandiaOrders_v1';

let products = [];
let category = 'all';
let cart = loadJson(CART_KEY, []);

const cats = {
  all: 'Все',
  'Піца': 'Піца',
  'Піца НОВИНКА': 'Новинки',
  'Фритюр меню': 'Закуски',
  'КОМБО БОКСИ': 'Комбо',
  'Соуси': 'Соуси',
  'Холодні НАПОЇ': 'Напої',
  'Гарячі НАПОЇ': 'Кава та чай',
  '1+1=3': '1+1=3',
  'Цінові знижки %': 'Акції'
};

const $ = (s, root = document) => root.querySelector(s);
const money = n => `${Number(n || 0).toLocaleString('uk-UA', { maximumFractionDigits: 2 })} ₴`;
const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#039;' }[c]));
const loadJson = (key, fallback) => { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } };
const saveJson = (key, value) => localStorage.setItem(key, JSON.stringify(value));

async function init() {
  try {
    const res = await fetch(MENU_URL, { cache: 'no-store' });
    if (!res.ok) throw new Error('Не вдалося завантажити menu.json');
    const data = await res.json();
    products = (data.items || []).filter(x => x.available !== false);
  } catch (err) {
    console.error(err);
    products = [];
  }
  renderFilters();
  renderProducts();
  renderCart();
  bindUI();
}

function renderFilters() {
  const availableCats = [...new Set(products.map(x => x.category))];
  const visibleCats = ['all', ...availableCats];
  $('#filters').innerHTML = visibleCats.map(c => `<button type="button" class="filter ${c === category ? 'active' : ''}" data-cat="${esc(c)}">${esc(c === 'all' ? 'Все' : (cats[c] || c))}</button>`).join('');
}

function renderProducts() {
  const list = category === 'all' ? products : products.filter(x => x.category === category);
  $('#products').innerHTML = list.length ? list.map(productCard).join('') : '<div class="empty-menu">Меню тимчасово недоступне. Відкрийте повне меню ChoiceQR.</div>';
}

function productCard(x) {
  const labels = (x.labels || []).filter((v, i, a) => v && a.indexOf(v) === i).slice(0, 2);
  const promo = x.price && x.price < parseFloat((x.labels || []).find(v => /^\d/.test(v)) || '') ? '' : '';
  return `<article class="product" data-product="${esc(x.id)}" tabindex="0" role="button" aria-label="Відкрити ${esc(x.name)}">
    <div class="product-img">${x.image ? `<img src="${esc(x.image)}" alt="${esc(x.name)}" loading="lazy">` : '<div class="image-placeholder"></div>'}${labels.length ? `<div class="product-badges">${labels.map(t => `<span class="badge">${esc(t)}</span>`).join('')}</div>` : ''}</div>
    <div class="product-body"><div class="product-cat">${esc(cats[x.category] || x.category)}</div><h3>${esc(x.name)}</h3><p>${esc(x.description || labels.find(v => /г|мл|л/.test(v)) || 'Позиція з актуального меню')}</p><div class="product-foot"><span class="price">${x.price != null ? `від ${money(x.price)}` : 'Уточнити'}</span><button class="add" type="button" data-add="${esc(x.id)}">+ Додати</button></div></div>
  </article>`;
}

function renderCart() {
  const count = cart.reduce((sum, x) => sum + x.qty, 0);
  const total = cart.reduce((sum, x) => sum + Number(x.price || 0) * x.qty, 0);
  $('#cart-count').textContent = count;
  $('#cart-total').textContent = money(total);
  $('#cart-items').innerHTML = cart.length ? cart.map(item => `<div class="cart-item">
    <img src="${esc(item.image || '')}" alt="${esc(item.name)}">
    <div class="cart-item-main"><strong>${esc(item.name)}</strong><small>${money(item.price)}</small><div class="qty"><button type="button" data-dec="${esc(item.id)}" aria-label="Зменшити">−</button><b>${item.qty}</b><button type="button" data-inc="${esc(item.id)}" aria-label="Збільшити">+</button><button type="button" class="remove-item" data-remove="${esc(item.id)}">Видалити</button></div></div>
  </div>`).join('') : '<div class="empty">Кошик поки порожній.<br>Але це легко виправити.</div>';
}

function add(id) {
  const p = products.find(x => x.id === id);
  if (!p || p.price == null) return;
  const existing = cart.find(x => x.id === id);
  if (existing) existing.qty += 1;
  else cart.push({ id: p.id, name: p.name, price: Number(p.price), image: p.image || '', qty: 1, category: p.category });
  persistCart();
  openCart();
}

function change(id, delta) {
  const item = cart.find(x => x.id === id);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) cart = cart.filter(x => x.id !== id);
  persistCart();
}

function removeItem(id) {
  cart = cart.filter(x => x.id !== id);
  persistCart();
}

function persistCart() { saveJson(CART_KEY, cart); renderCart(); }
function openCart() { $('#cart').classList.add('open'); $('#cart-overlay').classList.add('show'); document.body.classList.add('no-scroll'); }
function closeCart() { $('#cart').classList.remove('open'); $('#cart-overlay').classList.remove('show'); document.body.classList.remove('no-scroll'); }

function openProduct(id) {
  const p = products.find(x => x.id === id);
  if (!p) return;
  const labels = (p.labels || []).filter((v, i, a) => v && a.indexOf(v) === i);
  $('#product-modal-content').innerHTML = `<div class="product-modal-grid">
    <div>${p.image ? `<img class="product-modal-image" src="${esc(p.image)}" alt="${esc(p.name)}">` : ''}</div>
    <div><div class="eyebrow">${esc(cats[p.category] || p.category)}</div><h3>${esc(p.name)}</h3>${labels.length ? `<div class="modal-tags">${labels.map(t => `<span>${esc(t)}</span>`).join('')}</div>` : ''}<p class="modal-description">${esc(p.description || 'Опис позиції відсутній у збереженому меню.')}</p><div class="modal-price">${p.price != null ? `від ${money(p.price)}` : 'Уточнити ціну'}</div><div class="modal-actions">${p.price != null ? `<button class="btn btn-primary" data-modal-add="${esc(p.id)}">Додати до кошика</button>` : ''}${p.sourceUrl ? `<a class="btn btn-ghost" href="${esc(p.sourceUrl)}" target="_blank" rel="noopener">Відкрити в ChoiceQR ↗</a>` : ''}</div></div>
  </div>`;
  $('#product-modal').classList.add('show'); $('#product-modal').setAttribute('aria-hidden', 'false'); document.body.classList.add('no-scroll');
}
function closeProduct() { $('#product-modal').classList.remove('show'); $('#product-modal').setAttribute('aria-hidden', 'true'); document.body.classList.remove('no-scroll'); }

function openCheckout() {
  if (!cart.length) { alert('Додайте хоча б одну позицію до кошика.'); return; }
  closeCart();
  $('#order-form').hidden = false;
  $('#order-success').hidden = true;
  $('#checkout-summary').innerHTML = `<strong>${cart.reduce((s,x)=>s+x.qty,0)} позицій · ${money(cart.reduce((s,x)=>s+x.price*x.qty,0))}</strong>`;
  updateDeliveryFields();
  $('#checkout-modal').classList.add('show'); $('#checkout-modal').setAttribute('aria-hidden', 'false'); document.body.classList.add('no-scroll');
}
function closeCheckout() { $('#checkout-modal').classList.remove('show'); $('#checkout-modal').setAttribute('aria-hidden', 'true'); document.body.classList.remove('no-scroll'); }
function updateDeliveryFields() { $('#delivery-fields').hidden = $('#order-type').value !== 'delivery'; }

function makeOrder(form) {
  const fd = new FormData(form);
  const total = cart.reduce((s,x)=>s + x.price * x.qty, 0);
  const now = new Date();
  const stamp = now.toISOString();
  const orders = loadJson(ORDERS_KEY, []);
  const seq = orders.length ? Math.max(...orders.map(o => Number(String(o.id).replace(/\D/g,'')) || 0)) + 1 : 1;
  const order = {
    id: `SC-${String(seq).padStart(4,'0')}`,
    createdAt: stamp,
    status: 'NEW',
    customer: { name: fd.get('name').trim(), phone: fd.get('phone').trim() },
    fulfillment: fd.get('type'),
    address: fd.get('address')?.trim() || '',
    apartment: fd.get('apartment')?.trim() || '',
    floor: fd.get('floor')?.trim() || '',
    intercom: fd.get('intercom')?.trim() || '',
    comment: fd.get('comment')?.trim() || '',
    items: cart.map(x => ({ id:x.id, name:x.name, price:x.price, qty:x.qty, image:x.image })),
    subtotal: total,
    deliveryFee: null,
    total,
    source: 'scandia-static-demo'
  };
  orders.unshift(order);
  saveJson(ORDERS_KEY, orders);
  cart = [];
  persistCart();
  form.hidden = true;
  $('#order-success').innerHTML = `<strong>Замовлення ${esc(order.id)} створено.</strong><br>Сума: ${money(order.total)}<br><small>Демо-замовлення збережене в браузері та доступне в <a href="admin.html">адмінці</a>.</small>`;
  $('#order-success').hidden = false;
}

function bindUI() {
  document.addEventListener('click', e => {
    const f = e.target.closest('[data-cat]'); if (f) { category = f.dataset.cat; renderFilters(); renderProducts(); return; }
    const a = e.target.closest('[data-add]'); if (a) { e.stopPropagation(); add(a.dataset.add); return; }
    const inc = e.target.closest('[data-inc]'); if (inc) { change(inc.dataset.inc, 1); return; }
    const dec = e.target.closest('[data-dec]'); if (dec) { change(dec.dataset.dec, -1); return; }
    const rem = e.target.closest('[data-remove]'); if (rem) { removeItem(rem.dataset.remove); return; }
    const card = e.target.closest('[data-product]'); if (card && !e.target.closest('button,a')) { openProduct(card.dataset.product); return; }
    const modalAdd = e.target.closest('[data-modal-add]'); if (modalAdd) { add(modalAdd.dataset.modalAdd); closeProduct(); return; }
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') { closeCart(); closeProduct(); closeCheckout(); } if (e.key === 'Enter' && document.activeElement?.matches('[data-product]')) openProduct(document.activeElement.dataset.product); });
  $('#open-cart').onclick = openCart; $('#close-cart').onclick = closeCart; $('#cart-overlay').onclick = closeCart;
  $('#clear-cart').onclick = () => { if (!cart.length) return; if (confirm('Очистити кошик?')) { cart = []; persistCart(); } };
  $('#checkout-btn').onclick = openCheckout;
  $('#close-modal').onclick = closeCheckout;
  $('#close-product-modal').onclick = closeProduct;
  $('#order-type').onchange = updateDeliveryFields;
  $('#order-form').onsubmit = e => { e.preventDefault(); makeOrder(e.currentTarget); };
  $('#burger').onclick = () => $('#main-nav').classList.toggle('show');
  document.querySelectorAll('#main-nav a').forEach(a => a.addEventListener('click', () => $('#main-nav').classList.remove('show')));
}

init();
