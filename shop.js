/* Paprika & Pine Spice Co. — shop page logic.
   COURSE-TRACK STUDY NOTES (Dr. Angela Yu, Full-Stack Bootcamp):
   This file combines the course's front-end patterns in plain JavaScript:
   - DATA-DRIVEN RENDERING: the whole shelf is one array of objects below.
     Cards, the result count and the empty state are all built from that data,
     so adding a spice means adding one object — never editing HTML.
   - STATE + PERSISTENCE: the basket and the wishlist live in localStorage.
     Every change saves them, so they survive page changes and reloads.
   - DERIVED STATE: the visible list (family + search + sort) and every
     price (size option, quantity, basket totals) are COMPUTED from state,
     never stored. If the data changes, the page follows.
   - OPTION-DRIVEN PRICING: the modal's size buttons reprice live —
     Small is $10 under Classic, Large is $14 over Classic.
*/

"use strict";

/* ------------------------------------------------------------------ */
/* 1. DATA — the single source of truth for the whole shop.            */
/*    price = the CLASSIC size. Petite and Grand are derived from it.  */
/* ------------------------------------------------------------------ */
const SPICES = [
  { id: "smoked-paprika",   name: "Smoked Paprika",    family: "Smoky",   price: 9,  detail: "Ground",     img: "images/c1.jpg",  alt: "Smoked paprika powder in a small bowl", desc: "Spanish oak-smoked paprika with a deep red color and a gentle campfire warmth — the one that makes roast potatoes taste like a plan." },
  { id: "chipotle-powder",  name: "Chipotle Powder",   family: "Smoky",   price: 10, detail: "Ground",     img: "images/c2.jpg",  alt: "Chipotle chili powder in a white bowl", desc: "Smoked jalapeño, stone-ground — smoky first, hot second. A pinch turns chili, beans and barbecue sauce into something worth talking about." },
  { id: "ceylon-cinnamon",  name: "Ceylon Cinnamon",   family: "Warm",    price: 11, detail: "Sticks",     img: "images/c3.jpg",  alt: "Ceylon cinnamon sticks in a close-up pile", desc: "True Ceylon cinnamon — sweet, citrusy and delicate, nothing like the harsh cassia in supermarket jars. Grate it fresh over oatmeal and coffee." },
  { id: "whole-nutmeg",     name: "Whole Nutmeg",      family: "Warm",    price: 12, detail: "Whole",      img: "images/c4.jpg",  alt: "Whole nutmeg and whole spices on a wooden board", desc: "Whole Grenadian nutmeg, sold unground so it keeps its oils. One pass of a grater over béchamel, custard or eggnog is all it takes." },
  { id: "cayenne-pepper",   name: "Cayenne Pepper",    family: "Hot",     price: 8,  detail: "Ground",     img: "images/c5.jpg",  alt: "Cayenne pepper powder in a spoon against a dark background", desc: "Clean, bright heat with no smokiness — the cayenne for hot sauce, fried chicken and anything that needs a lift rather than a lecture." },
  { id: "calabrian-chili",  name: "Calabrian Chili Flakes", family: "Hot", price: 10, detail: "Flakes",     img: "images/c6.jpg",  alt: "Calabrian chili flakes and dried red chilies on a dark surface", desc: "Sun-dried Calabrian chilies, crushed with their seeds — fruity, fiery and a little salty. Pizza, pasta and eggs all want some." },
  { id: "greek-oregano",    name: "Greek Oregano",     family: "Herbal",  price: 8,  detail: "Dried leaf", img: "images/c7.jpg",  alt: "Dried oregano leaves on wooden spoons", desc: "Wild Greek oregano, dried on the stem — peppery, earthy and twice as strong as the flat stuff. Rub it between your palms before it hits the pan." },
  { id: "french-thyme",     name: "French Thyme",      family: "Herbal",  price: 9,  detail: "Dried leaf", img: "images/c8.jpg",  alt: "Dried French thyme herbs in a close-up view", desc: "Provençal thyme, dried slowly so the oils stay put. Soups, roasts and roast chickens all start here." },
  { id: "vanilla-beans",    name: "Madagascar Vanilla Beans", family: "Sweet", price: 16, detail: "Whole pods", img: "images/c9.jpg",  alt: "Madagascar vanilla beans on white marble", desc: "Plump Grade A Madagascar pods, oily and fragrant. Split one into cream, sugar or a bottle of bourbon and wait — it is worth it." },
  { id: "green-cardamom",  name: "Green Cardamom Pods", family: "Sweet", price: 14, detail: "Whole pods", img: "images/c10.jpg", alt: "Green cardamom pods in a close-up view", desc: "Bright green 8mm cardamom pods, the small green engine of chai, rice pudding and Swedish buns. Crack a pod open and the smell does the selling." },
  { id: "ground-turmeric",  name: "Ground Turmeric",   family: "Exotic",  price: 8,  detail: "Ground",     img: "images/c11.jpg", alt: "Ground turmeric powder in a close-up view", desc: "Golden turmeric, ground fresh in small batches — earthy, a little bitter, and the color that makes a curry look like a curry." },
  { id: "saffron-threads",  name: "Saffron Threads",   family: "Exotic",  price: 24, detail: "Threads",    img: "images/c12.jpg", alt: "Saffron threads in a wooden spoon", desc: "Grade I Spanish saffron threads — a pinch steeped in warm water turns rice, paella and risotto gold. The most expensive spice in the shop, and the smallest jar." },
];

/* Size options: each size is a price OFFSET from the Classic price.
   Deriving prices this way keeps one number per spice in the data. */
const SIZES = [
  { key: "Taster",  offset: -4,  note: "1 oz · the taster jar" },
  { key: "Classic", offset: 0,   note: "4 oz · the classic jar" },
  { key: "Pantry",  offset: 10,  note: "8 oz · the pantry jar" },
];

const BASKET_KEY = "paprika-pine-spice-basket";
const WISHLIST_KEY = "paprika-pine-spice-wishlist";

/* ------------------------------------------------------------------ */
/* 2. STATE — loaded from localStorage, saved on every change.         */
/* ------------------------------------------------------------------ */
function loadJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (e) {
    return fallback;
  }
}
function saveJSON(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

let basket = loadJSON(BASKET_KEY, []);       // [{id, size, qty}]
let wishlist = loadJSON(WISHLIST_KEY, []);   // [id, id, ...]
let activeFamily = "All";
let searchText = "";
let sortMode = "featured";

/* ------------------------------------------------------------------ */
/* 3. HELPERS                                                          */
/* ------------------------------------------------------------------ */
const $ = (sel) => document.querySelector(sel);
const money = (n) => "$" + n.toFixed(2);
function spiceById(id) { return SPICES.find((b) => b.id === id); }
function sizePrice(spice, sizeKey) {
  const size = SIZES.find((s) => s.key === sizeKey) || SIZES[1];
  return spice.price + size.offset;
}
function basketCount() { return basket.reduce((sum, line) => sum + line.qty, 0); }
function basketSubtotal() {
  return basket.reduce((sum, line) => {
    const b = spiceById(line.id);
    return b ? sum + sizePrice(b, line.size) * line.qty : sum;
  }, 0);
}

/* ------------------------------------------------------------------ */
/* 4. RENDER — the visible list is DERIVED from data + filters.        */
/*    Filter, then search, then sort, then paint. Nothing is stored.   */
/* ------------------------------------------------------------------ */
function visibleSpices() {
  let list = SPICES.slice();
  if (activeFamily !== "All") {
    list = list.filter((b) => b.family === activeFamily);
  }
  const q = searchText.trim().toLowerCase();
  if (q) {
    list = list.filter(
      (b) =>
        b.name.toLowerCase().includes(q) ||
        b.desc.toLowerCase().includes(q) ||
        b.detail.toLowerCase().includes(q)
    );
  }
  if (sortMode === "price-asc") list.sort((a, b) => a.price - b.price);
  else if (sortMode === "price-desc") list.sort((a, b) => b.price - a.price);
  else if (sortMode === "name") list.sort((a, b) => a.name.localeCompare(b.name));
  return list; // "featured" keeps the catalogue order
}

function renderGrid() {
  const grid = $("#spiceGrid");
  const list = visibleSpices();
  $("#resultCount").textContent =
    list.length + (list.length === 1 ? " spice" : " spices");

  if (list.length === 0) {
    grid.innerHTML =
      '<div class="empty-state"><strong>No spices match that search.</strong>' +
      "Try a different spice family, or clear the family filter to see the whole shelf.</div>";
    return;
  }

  grid.innerHTML = list.map((b) => {
    const wished = wishlist.includes(b.id);
    return (
      '<article class="card">' +
      '<img src="' + b.img + '" alt="' + b.alt + '" loading="lazy">' +
      '<div class="card-body">' +
      '<h3>' + b.name + '</h3>' +
      '<p class="card-family">' + b.family + '</p>' +
      '<p class="desc">' + b.desc + '</p>' +
      '<div class="card-meta"><span class="price">' + money(b.price) +
      ' <small>Classic</small></span><span class="detail">' + b.detail + '</span></div>' +
      '<div class="card-actions">' +
      '<button class="btn" type="button" data-view="' + b.id + '">View &amp; choose size</button>' +
      '<button class="heart" type="button" data-wish="' + b.id + '" aria-pressed="' + wished +
      '" aria-label="Save ' + b.name + ' to wishlist">' + (wished ? "♥" : "♡") + '</button>' +
      "</div></div></article>"
    );
  }).join("");
}

/* ------------------------------------------------------------------ */
/* 5. BASKET DRAWER — same state, second view of it.                  */
/* ------------------------------------------------------------------ */
function renderBasketBtn() {
  $("#basketBtn").textContent = "Basket (" + basketCount() + ")";
}

function renderDrawer() {
  const body = $("#drawerBody");
  const foot = $("#drawerFoot");
  if (basket.length === 0) {
    body.innerHTML =
      '<p class="drawer-empty">Your basket is empty.<br>Pick a spice and choose a size to get started.</p>';
    foot.innerHTML = "";
    return;
  }
  body.innerHTML = basket.map((line, i) => {
    const b = spiceById(line.id);
    if (!b) return "";
    const unit = sizePrice(b, line.size);
    return (
      '<div class="basket-line">' +
      '<img src="' + b.img + '" alt="' + b.alt + '">' +
      "<div><h4>" + b.name + "</h4>" +
      '<p class="line-sub">' + line.size + " · " + money(unit) + " each</p>" +
      '<span class="qty-mini"><button type="button" data-dec="' + i + '" aria-label="One fewer">−</button>' +
      "<span>" + line.qty + "</span>" +
      '<button type="button" data-inc="' + i + '" aria-label="One more">+</button></span>' +
      '<br><button class="line-remove" type="button" data-remove="' + i + '">Remove</button>' +
      "</div>" +
      '<div class="line-price">' + money(unit * line.qty) + "</div>" +
      "</div>"
    );
  }).join("");

  foot.innerHTML =
    '<div class="totals"><div><span>Subtotal</span><span>' + money(basketSubtotal()) + "</span></div>" +
    "<div><span>Delivery</span><span>At checkout</span></div></div>" +
    '<a class="btn btn-rose" href="cart.html">Go to checkout</a>';
}

function openDrawer() {
  renderDrawer();
  $("#basketDrawer").classList.add("open");
  $("#drawerBackdrop").classList.add("open");
}
function closeDrawer() {
  $("#basketDrawer").classList.remove("open");
  $("#drawerBackdrop").classList.remove("open");
}

function addToBasket(id, size, qty) {
  const existing = basket.find((l) => l.id === id && l.size === size);
  if (existing) existing.qty += qty;
  else basket.push({ id: id, size: size, qty: qty });
  saveJSON(BASKET_KEY, basket);
  renderBasketBtn();
  renderDrawer();
}

/* ------------------------------------------------------------------ */
/* 6. DETAIL MODAL — size and quantity reprice live (derived state).  */
/* ------------------------------------------------------------------ */
let modalSpice = null;
let modalSize = "Classic";
let modalQty = 1;

function openModal(id) {
  modalSpice = spiceById(id);
  if (!modalSpice) return;
  modalSize = "Classic";
  modalQty = 1;
  $("#modalImg").src = modalSpice.img;
  $("#modalImg").alt = modalSpice.alt;
  $("#modalTitle").textContent = modalSpice.name;
  $("#modalFamily").textContent =
    modalSpice.family + " · " + modalSpice.detail;
  $("#modalDesc").textContent = modalSpice.desc;
  renderSizeRow();
  renderModalTotal();
  $("#modalBackdrop").classList.add("open");
}
function closeModal() {
  $("#modalBackdrop").classList.remove("open");
  modalSpice = null;
}
function renderSizeRow() {
  $("#sizeRow").innerHTML = SIZES.map((s) => {
    const price = modalSpice.price + s.offset;
    return (
      '<button class="size-opt" type="button" data-size="' + s.key +
      '" aria-pressed="' + (modalSize === s.key) + '">' +
      "<strong>" + s.key + " — " + money(price) + "</strong>" +
      "<span>" + s.note + "</span></button>"
    );
  }).join("");
  $("#qtyOut").textContent = modalQty;
}
function renderModalTotal() {
  $("#modalTotal").textContent = money(
    sizePrice(modalSpice, modalSize) * modalQty
  );
  $("#qtyOut").textContent = modalQty;
}

/* ------------------------------------------------------------------ */
/* 7. EVENTS — one delegated listener per area keeps this tidy.        */
/* ------------------------------------------------------------------ */
document.addEventListener("DOMContentLoaded", () => {
  renderGrid();
  renderBasketBtn();

  // Search (live, as you type) and sort.
  $("#searchInput").addEventListener("input", (e) => {
    searchText = e.target.value;
    renderGrid();
  });
  $("#sortSelect").addEventListener("change", (e) => {
    sortMode = e.target.value;
    renderGrid();
  });

  // Family chips — single-select, aria-pressed shows the active one.
  $("#familyChips").addEventListener("click", (e) => {
    const btn = e.target.closest(".chip");
    if (!btn) return;
    activeFamily = btn.dataset.family;
    document.querySelectorAll("#familyChips .chip").forEach((c) =>
      c.setAttribute("aria-pressed", String(c === btn))
    );
    renderGrid();
  });

  // Grid: view buttons and wishlist hearts.
  $("#spiceGrid").addEventListener("click", (e) => {
    const viewBtn = e.target.closest("[data-view]");
    if (viewBtn) { openModal(viewBtn.dataset.view); return; }
    const wishBtn = e.target.closest("[data-wish]");
    if (wishBtn) {
      const id = wishBtn.dataset.wish;
      if (wishlist.includes(id)) wishlist = wishlist.filter((w) => w !== id);
      else wishlist.push(id);
      saveJSON(WISHLIST_KEY, wishlist);
      renderGrid(); // re-render so the heart flips and stays flipped
    }
  });

  // Modal: size, quantity, add, close (button, backdrop, Escape).
  $("#sizeRow").addEventListener("click", (e) => {
    const btn = e.target.closest("[data-size]");
    if (!btn) return;
    modalSize = btn.dataset.size;
    renderSizeRow();
    renderModalTotal();
  });
  $("#qtyMinus").addEventListener("click", () => {
    if (modalQty > 1) { modalQty--; renderModalTotal(); }
  });
  $("#qtyPlus").addEventListener("click", () => {
    if (modalQty < 9) { modalQty++; renderModalTotal(); }
  });
  $("#modalAddBtn").addEventListener("click", () => {
    if (!modalSpice) return;
    addToBasket(modalSpice.id, modalSize, modalQty);
    closeModal();
    openDrawer();
  });
  $("#modalClose").addEventListener("click", closeModal);
  $("#modalBackdrop").addEventListener("click", (e) => {
    if (e.target === $("#modalBackdrop")) closeModal();
  });

  // Basket drawer: open, close, quantity, remove.
  $("#basketBtn").addEventListener("click", openDrawer);
  $("#drawerClose").addEventListener("click", closeDrawer);
  $("#drawerBackdrop").addEventListener("click", closeDrawer);
  $("#drawerBody").addEventListener("click", (e) => {
    const inc = e.target.closest("[data-inc]");
    const dec = e.target.closest("[data-dec]");
    const rem = e.target.closest("[data-remove]");
    if (inc) {
      basket[+inc.dataset.inc].qty = Math.min(9, basket[+inc.dataset.inc].qty + 1);
    } else if (dec) {
      const line = basket[+dec.dataset.dec];
      line.qty--;
      if (line.qty <= 0) basket.splice(+dec.dataset.dec, 1);
    } else if (rem) {
      basket.splice(+rem.dataset.remove, 1);
    } else return;
    saveJSON(BASKET_KEY, basket);
    renderBasketBtn();
    renderDrawer();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") { closeModal(); closeDrawer(); }
  });
});
