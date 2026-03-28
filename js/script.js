// Script principal: gestion des produits et du panier (localStorage)
const PRODUCTS_PATH = 'data/products.json';
let products = [];
let cart = JSON.parse(localStorage.getItem('cart')) || {};

const $products = document.getElementById('products');
const $cartCount = document.getElementById('cartCount');
const $cartItems = document.getElementById('cartItems');
const $cartTotal = document.getElementById('cartTotal');
const searchInput = document.getElementById('search');

function formatPrice(n){return n.toFixed(2) + ' €'}

async function loadProducts(){
  try{
    const res = await fetch(PRODUCTS_PATH);
    products = await res.json();
  }catch(e){
    console.error('Impossible de charger products.json, utilisation des données locales.', e);
    products = [];
  }
  // also load products added via admin (localStorage)
  const custom = JSON.parse(localStorage.getItem('customProducts')||'[]');
  products = [...custom, ...products];
  renderProducts(products);
  renderCart();
}

function renderProducts(list){
  $products.innerHTML = '';
  if(list.length===0){ $products.innerHTML = '<p>Aucun produit trouvé.</p>'; return }
  list.forEach(p=>{
    const col = document.createElement('div'); col.className='col-12 col-sm-6 col-md-4';
    col.innerHTML = `
      <div class="card h-100">
        <img src="${p.image}" class="card-img-top" alt="${p.name}">
        <div class="card-body d-flex flex-column">
          <h5 class="card-title">${p.name}</h5>
          <p class="card-text text-muted flex-grow-1">${p.description.substring(0,120)}</p>
          <div class="d-flex justify-content-between align-items-center">
            <strong>${formatPrice(p.price)}</strong>
            <div>
              <button class="btn btn-sm btn-outline-primary me-2" data-id="${p.id}" onclick="openModal('${p.id}')">Voir</button>
              <button class="btn btn-sm btn-success" onclick="addToCartId('${p.id}',1)">Ajouter</button>
            </div>
          </div>
        </div>
      </div>`;
    $products.appendChild(col);
  });
}

function openModal(id){
  const p = products.find(x=>x.id==id);
  if(!p) return;
  document.getElementById('modalTitle').innerText = p.name;
  document.getElementById('modalImage').src = p.image;
  document.getElementById('modalDesc').innerText = p.description;
  document.getElementById('modalPrice').innerText = formatPrice(p.price);
  document.getElementById('modalQty').value = 1;
  document.getElementById('addToCartBtn').onclick = ()=>{ addToCartId(id, parseInt(document.getElementById('modalQty').value)||1); const modal = bootstrap.Modal.getInstance(document.getElementById('productModal')); modal.hide(); };
  const modal = new bootstrap.Modal(document.getElementById('productModal'));
  modal.show();
}

function addToCartId(id, qty=1){
  if(!cart[id]) cart[id]=0;
  cart[id] += qty;
  localStorage.setItem('cart', JSON.stringify(cart));
  renderCart();
}

function renderCart(){
  // build items
  $cartItems.innerHTML='';
  let total = 0; let count = 0;
  for(const id in cart){
    const p = products.find(x=>x.id==id) || {name:'Produit inconnu', price:0};
    const qty = cart[id];
    const item = document.createElement('div'); item.className='cart-item d-flex align-items-center';
    item.innerHTML = `
      <div style="width:56px;height:56px;overflow:hidden;margin-right:8px;"><img src="${p.image}" style="width:100%;height:100%;object-fit:cover"></div>
      <div class="flex-grow-1">
        <div><strong>${p.name}</strong></div>
        <div class="text-muted small">${formatPrice(p.price)} x ${qty}</div>
      </div>
      <div class="text-end">
        <div>${formatPrice(p.price*qty)}</div>
        <div class="mt-1"><button class="btn btn-sm btn-link text-danger" onclick="removeFromCart('${id}')">Retirer</button></div>
      </div>`;
    $cartItems.appendChild(item);
    total += p.price*qty; count += qty;
  }
  $cartTotal.innerText = formatPrice(total);
  $cartCount.innerText = count;
}

function removeFromCart(id){
  delete cart[id];
  localStorage.setItem('cart', JSON.stringify(cart));
  renderCart();
}

// Checkout simulation
document.getElementById('checkoutBtn').addEventListener('click', ()=>{
  if(Object.keys(cart).length===0){ alert('Votre panier est vide'); return }
  // simulate processing
  const offcanvas = bootstrap.Offcanvas.getInstance(document.getElementById('offcanvasCart'));
  offcanvas.hide();
  const processing = document.createElement('div'); processing.className='modal fade'; processing.id='procModal'; processing.innerHTML = `
    <div class="modal-dialog modal-dialog-centered"><div class="modal-content"><div class="modal-body text-center p-4"><h5>Traitement du paiement...</h5><p class="small">(simulation)</p></div></div></div>`;
  document.body.appendChild(processing);
  const m = new bootstrap.Modal(processing); m.show();
  setTimeout(()=>{
    m.hide(); processing.remove();
    alert('Paiement simulé effectué — merci pour votre commande !');
    cart = {}; localStorage.setItem('cart', JSON.stringify(cart)); renderCart();
  }, 1500);
});

// Admin local: add product to localStorage customProducts
document.getElementById('btnAdmin').addEventListener('click', ()=>{ const m = new bootstrap.Modal(document.getElementById('adminModal')); m.show(); });

document.getElementById('adminAddBtn').addEventListener('click', ()=>{
  const name = document.getElementById('adminName').value.trim();
  const price = parseFloat(document.getElementById('adminPrice').value)||0;
  const image = document.getElementById('adminImage').value.trim() || 'https://placehold.co/600x400?text=Produit';
  const desc = document.getElementById('adminDesc').value.trim() || '';
  if(!name){ alert('Nom requis'); return }
  const custom = JSON.parse(localStorage.getItem('customProducts')||'[]');
  const id = 'c' + Date.now();
  custom.unshift({id,name,price,description:desc,image});
  localStorage.setItem('customProducts', JSON.stringify(custom));
  // refresh
  loadProducts();
  const modal = bootstrap.Modal.getInstance(document.getElementById('adminModal'));
  modal.hide();
  document.getElementById('adminName').value=''; document.getElementById('adminPrice').value=''; document.getElementById('adminImage').value=''; document.getElementById('adminDesc').value='';
});

// Search
searchInput.addEventListener('input', (e)=>{
  const q = e.target.value.toLowerCase();
  renderProducts(products.filter(p=>p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q)));
});

// helper for add from buttons in card (global)
window.addToCartId = addToCartId;
window.openModal = openModal;

loadProducts();
