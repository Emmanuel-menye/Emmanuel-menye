const PRODUCTS_URL = '/assets/data/products.json';
const currency = '€';

function qs(sel){return document.querySelector(sel)}
function qsa(sel){return document.querySelectorAll(sel)}

let products = [];
let cart = JSON.parse(localStorage.getItem('shop_cart_v1')||'{}');

function saveCart(){localStorage.setItem('shop_cart_v1', JSON.stringify(cart))}
function cartCount(){return Object.values(cart).reduce((s,c)=>s+c.qty,0)}
function cartTotal(){return Object.values(cart).reduce((s,c)=>s + c.qty * c.price,0)}

function renderProducts(){
  const root = qs('#products');
  root.innerHTML = '';
  products.forEach(p=>{
    const el = document.createElement('article');
    el.className = 'product';
    el.innerHTML = `
      <img src="${p.image}" alt="${p.name}">
      <h3>${p.name}</h3>
      <p>${p.description}</p>
      <div class="price">${p.price.toFixed(2)} ${currency}</div>
      <div style="display:flex;gap:.5rem">
        <button class="btn add" data-id="${p.id}">Ajouter</button>
        <button class="btn" data-id="${p.id}" onclick="window.location='#'">Voir</button>
      </div>
    `;
    root.appendChild(el);
  });
  qsa('.add').forEach(b=>b.addEventListener('click', e=>{
    const id = e.currentTarget.dataset.id;
    addToCart(id);
  }));
}

function renderCart(){
  const cartEl = qs('#cart-items');
  cartEl.innerHTML = '';
  Object.values(cart).forEach(item=>{
    const div = document.createElement('div');
    div.className = 'cart-item';
    div.innerHTML = `
      <img src="${item.image}" alt="${item.name}">
      <div style="flex:1">
        <div><strong>${item.name}</strong></div>
        <div style="color:#666">${(item.price).toFixed(2)} ${currency}</div>
        <div class="qty">
          <button class="btn dec" data-id="${item.id}">−</button>
          <span style="padding:0 .5rem">${item.qty}</span>
          <button class="btn inc" data-id="${item.id}">+</button>
        </div>
      </div>
      <div style="text-align:right">${(item.price*item.qty).toFixed(2)} ${currency}</div>
    `;
    cartEl.appendChild(div);
  });
  qs('#cart-count').textContent = cartCount();
  qs('#cart-total').textContent = cartTotal().toFixed(2) + ' ' + currency;
  qsa('.inc').forEach(b=>b.addEventListener('click',e=>changeQty(e.currentTarget.dataset.id,1)));
  qsa('.dec').forEach(b=>b.addEventListener('click',e=>changeQty(e.currentTarget.dataset.id,-1)));
}

function changeQty(id,delta){
  if(!cart[id]) return;
  cart[id].qty += delta;
  if(cart[id].qty <= 0) delete cart[id];
  saveCart(); renderCart();
}

function addToCart(id){
  const p = products.find(x=>String(x.id) === String(id));
  if(!p) return;
  if(!cart[id]) cart[id] = {...p, qty:0};
  cart[id].qty += 1;
  saveCart();
  renderCart();
  // quick feedback
  qs('#cart-toggle').classList.add('pulse');
  setTimeout(()=>qs('#cart-toggle').classList.remove('pulse'),350);
}

function clearCart(){
  cart = {}; saveCart(); renderCart();
}

function toggleCart(show){
  const cartPane = qs('#cart');
  if(show === undefined) show = cartPane.hasAttribute('hidden');
  if(show){ cartPane.removeAttribute('hidden'); qs('#cart-toggle').setAttribute('aria-expanded','true')}
  else { cartPane.setAttribute('hidden',''); qs('#cart-toggle').setAttribute('aria-expanded','false')}
}

async function loadProducts(){
  try{
    const res = await fetch(PRODUCTS_URL);
    products = await res.json();
  }catch(e){
    // fallback sample if fetch fails
    products = [
      {"id":1,"name":"Produit A","price":19.99,"description":"Exemple produit A","image":"https://picsum.photos/seed/p1/600/400"},
      {"id":2,"name":"Produit B","price":29.00,"description":"Exemple produit B","image":"https://picsum.photos/seed/p2/600/400"},
      {"id":3,"name":"Produit C","price":9.50,"description":"Exemple produit C","image":"https://picsum.photos/seed/p3/600/400"},
      {"id":4,"name":"Produit D","price":49.99,"description":"Exemple produit D","image":"https://picsum.photos/seed/p4/600/400"},
      {"id":5,"name":"Produit E","price":14.00,"description":"Exemple produit E","image":"https://picsum.photos/seed/p5/600/400"},
      {"id":6,"name":"Produit F","price":79.00,"description":"Exemple produit F","image":"https://picsum.photos/seed/p6/600/400"}
    ];
  }
  renderProducts();
  renderCart();
}

document.addEventListener('click', (e)=>{
  if(e.target && e.target.id === 'cart-toggle') toggleCart();
  if(e.target && e.target.id === 'clear-cart') clearCart();
  if(e.target && e.target.id === 'checkout') handleCheckout();
});

async function handleCheckout(){
  // Demo behavior: open a mailto with order summary OR integrate Stripe.
  // For Stripe Checkout you would:
  // 1) Create a server endpoint that creates a Stripe Checkout session with line items and returns a sessionId.
  // 2) Here call fetch('/create-checkout-session', {method:'POST', body: JSON.stringify({cart})})
  // 3) Then stripe.redirectToCheckout({sessionId})
  // For now we show a simple confirmation:
  if(cartCount() === 0){ alert('Votre panier est vide'); return; }
  const summary = Object.values(cart).map(i=>`${i.qty}× ${i.name} — ${(i.price*i.qty).toFixed(2)} ${currency}`).join('\n');
  const total = cartTotal().toFixed(2);
  if(confirm(`Confirmer la commande ?\n\n${summary}\n\nTotal: ${total} ${currency}\n\n(Appel de paiement non configuré)`)){
    // simulate checkout
    clearCart();
    alert('Merci ! La commande a été enregistrée en mode démo.');
  }
}

loadProducts();