/* Paprika & Pine Spice Co. — basket & checkout logic.
   COURSE-TRACK STUDY NOTES (Dr. Angela Yu, Full-Stack Bootcamp):
   - DERIVED STATE: every total on this page is computed from the basket,
     never stored. Change a quantity and the subtotal, promo, delivery,
     tax and grand total all recompute from the same numbers.
   - VALIDATION BEFORE STATE CHANGE: the order is only saved (and the
     basket only cleared) after EVERY field passes. A failed submit
     changes nothing — the basket is still there to fix and retry.
   - The catalogue below is the same data as shop.js, kept in this file
     so the checkout page works on its own (static hosting, no bundler).
*/

"use strict";

/* Same catalogue as shop.js — price is the Classic size. */
const SPICES = [
  { id: "smoked-paprika",   name: "Smoked Paprika",    price: 9,  detail: "Ground",     img: "images/c1.jpg" },
  { id: "chipotle-powder",  name: "Chipotle Powder",   price: 10, detail: "Ground",     img: "images/c2.jpg" },
  { id: "ceylon-cinnamon",  name: "Ceylon Cinnamon",   price: 11, detail: "Sticks",     img: "images/c3.jpg" },
  { id: "whole-nutmeg",     name: "Whole Nutmeg",      price: 12, detail: "Whole",      img: "images/c4.jpg" },
  { id: "cayenne-pepper",   name: "Cayenne Pepper",    price: 8,  detail: "Ground",     img: "images/c5.jpg" },
  { id: "calabrian-chili",  name: "Calabrian Chili Flakes", price: 10, detail: "Flakes", img: "images/c6.jpg" },
  { id: "greek-oregano",    name: "Greek Oregano",     price: 8,  detail: "Dried leaf", img: "images/c7.jpg" },
  { id: "french-thyme",     name: "French Thyme",      price: 9,  detail: "Dried leaf", img: "images/c8.jpg" },
  { id: "vanilla-beans",    name: "Madagascar Vanilla Beans", price: 16, detail: "Whole pods", img: "images/c9.jpg" },
  { id: "green-cardamom",  name: "Green Cardamom Pods", price: 14, detail: "Whole pods", img: "images/c10.jpg" },
  { id: "ground-turmeric",  name: "Ground Turmeric",   price: 8,  detail: "Ground",     img: "images/c11.jpg" },
  { id: "saffron-threads",  name: "Saffron Threads",   price: 24, detail: "Threads",    img: "images/c12.jpg" },
];
const SIZES = [
  { key: "Taster",  offset: -4 },
  { key: "Classic", offset: 0 },
  { key: "Pantry",  offset: 10 },
];

const BASKET_KEY = "paprika-pine-spice-basket";
const ORDERS_KEY = "paprika-pine-spice-orders";
const PROMO_CODE = "SPICE10";
const PROMO_RATE = 0.10;
const DELIVERY_FEE = 6.95;
const FREE_DELIVERY_AT = 60;
const TAX_RATE = 0.07;

const $ = (sel) => document.querySelector(sel);
const money = (n) => "$" + n.toFixed(2);
function spiceById(id) { return SPICES.find((b) => b.id === id); }
function sizePrice(b, sizeKey) {
  const s = SIZES.find((x) => x.key === sizeKey) || SIZES[1];
  return b.price + s.offset;
}
function loadJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (e) { return fallback; }
}
function saveJSON(key, value) { localStorage.setItem(key, JSON.stringify(value)); }

let basket = loadJSON(BASKET_KEY, []);
let promoApplied = false;

/* ------------------------------------------------------------------ */
/* TOTALS — one function owns all the money math, so the summary and   */
/* the confirmation can never disagree. Tax is 7% of the discounted    */
/* goods plus the delivery fee, the same as the shop's other pages.    */
/* Tax is rounded to whole cents FIRST, so the tax line and the grand  */
/* total always add up (an unrounded $1.575 tax once showed as $1.58   */
/* on its line but $24.07 in the total — a one-cent mismatch).         */
/* ------------------------------------------------------------------ */
function totals(fulfilment) {
  const subtotal = basket.reduce((sum, line) => {
    const b = spiceById(line.id);
    return b ? sum + sizePrice(b, line.size) * line.qty : sum;
  }, 0);
  const discount = promoApplied ? subtotal * PROMO_RATE : 0;
  const afterDiscount = subtotal - discount;
  let delivery = 0;
  if (fulfilment === "delivery") {
    delivery = afterDiscount >= FREE_DELIVERY_AT ? 0 : DELIVERY_FEE;
  }
  const tax = Math.round((afterDiscount + delivery) * TAX_RATE * 100) / 100;
  return {
    subtotal: subtotal,
    discount: discount,
    delivery: delivery,
    tax: tax,
    total: afterDiscount + delivery + tax,
  };
}

function fulfilment() {
  const checked = document.querySelector('input[name="fulfilment"]:checked');
  return checked ? checked.value : "delivery";
}

function renderBasketBtn() {
  const count = basket.reduce((sum, l) => sum + l.qty, 0);
  $("#basketBtn").textContent = "Basket (" + count + ")";
}

function renderSummary() {
  const lines = $("#summaryLines");
  if (basket.length === 0) {
    lines.innerHTML = "<p class=\"hint\">Nothing in your basket yet.</p>";
  } else {
    lines.innerHTML = basket.map((line, i) => {
      const b = spiceById(line.id);
      if (!b) return "";
      const unit = sizePrice(b, line.size);
      return (
        '<div class="summary-line">' +
        '<img src="' + b.img + '" alt="">' +
        "<div><strong>" + b.name + "</strong><br>" +
        '<span class="line-sub">' + line.size + " · " + money(unit) + " each</span><br>" +
        '<span class="qty-mini"><button type="button" data-dec="' + i + '" aria-label="One fewer">−</button>' +
        "<span>" + line.qty + "</span>" +
        '<button type="button" data-inc="' + i + '" aria-label="One more">+</button></span> ' +
        '<button class="line-remove" type="button" data-remove="' + i + '">Remove</button>' +
        "</div>" +
        '<div class="line-price">' + money(unit * line.qty) + "</div>" +
        "</div>"
      );
    }).join("");
  }

  const t = totals(fulfilment());
  const deliveryLabel =
    fulfilment() === "pickup"
      ? "Free (pickup)"
      : t.delivery === 0
        ? "Free"
        : money(t.delivery);
  $("#totalsBox").innerHTML =
    "<div><span>Subtotal</span><span>" + money(t.subtotal) + "</span></div>" +
    (t.discount > 0
      ? "<div><span>Promo " + PROMO_CODE + " (−10%)</span><span>−" + money(t.discount) + "</span></div>"
      : "") +
    "<div><span>Delivery</span><span>" + deliveryLabel + "</span></div>" +
    "<div><span>Tax (7%)</span><span>" + money(t.tax) + "</span></div>" +
    '<div class="grand"><span>Total</span><span>' + money(t.total) + "</span></div>";
}

/* ------------------------------------------------------------------ */
/* VALIDATION — each field marks itself; the submit checks all of them */
/* and stops on the first problem, listing it plainly.                 */
/* ------------------------------------------------------------------ */
function setInvalid(input, bad) {
  const field = input.closest(".field");
  if (field) field.classList.toggle("invalid", bad);
  return !bad;
}
function validEmail(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); }
function validDate() {
  const input = $("#orderDate");
  const value = input.value;
  if (!value) { setInvalid(input, true); return "Please choose a date."; }
  // Parse as a local date (YYYY-MM-DD) so timezones never shift the day.
  const parts = value.split("-").map(Number);
  const chosen = new Date(parts[0], parts[1] - 1, parts[2]);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (chosen < today) { setInvalid(input, true); return "That date has passed — pick today or later."; }
  if (chosen.getDay() === 0) { setInvalid(input, true); return "The shop is closed on Sundays — pick another day."; }
  const now = new Date();
  const isToday = chosen.getTime() === today.getTime();
  if (isToday && fulfilment() === "delivery" && now.getHours() >= 14) {
    setInvalid(input, true);
    return "Same-day delivery closes at 2 PM — pick tomorrow or later.";
  }
  if (isToday && fulfilment() === "pickup" && now.getHours() >= 17) {
    setInvalid(input, true);
    return "Pickup closes at 6 PM — pick tomorrow or later.";
  }
  setInvalid(input, false);
  return "";
}

function validateAll() {
  let firstError = "";
  const fail = (msg) => { if (!firstError) firstError = msg; };

  if (!setInvalid($("#recipientName"), $("#recipientName").value.trim() === "")) {
    fail("Please enter the recipient's name.");
  }
  if (fulfilment() === "delivery") {
    if (!setInvalid($("#deliveryAddress"), $("#deliveryAddress").value.trim() === "")) {
      fail("Please enter a delivery address.");
    }
  } else {
    setInvalid($("#deliveryAddress"), false);
  }
  const dateError = validDate();
  if (dateError) fail(dateError);
  if (!setInvalid($("#buyerName"), $("#buyerName").value.trim() === "")) {
    fail("Please enter your name.");
  }
  if (!setInvalid($("#buyerEmail"), !validEmail($("#buyerEmail").value.trim()))) {
    fail("Please enter a valid email address.");
  }
  const digits = $("#cardNumber").value.replace(/\D/g, "");
  if (!setInvalid($("#cardNumber"), digits.length !== 16)) {
    fail("Please enter a 16-digit card number.");
  }
  const exp = $("#cardExpiry").value.trim();
  const m = exp.match(/^(\d{2})\/(\d{2})$/);
  let expOk = false;
  if (m) {
    const month = +m[1];
    const year = 2000 + +m[2];
    const end = new Date(year, month, 0, 23, 59, 59); // last day of that month
    expOk = month >= 1 && month <= 12 && end > new Date();
  }
  if (!setInvalid($("#cardExpiry"), !expOk)) {
    fail("Please enter a future expiry date as MM/YY.");
  }
  const cvc = $("#cardCvc").value.replace(/\D/g, "");
  if (!setInvalid($("#cardCvc"), !(cvc.length === 3 || cvc.length === 4))) {
    fail("Please enter the 3- or 4-digit CVC.");
  }
  if (!setInvalid($("#cardZip"), !/^\d{5}$/.test($("#cardZip").value.trim()))) {
    fail("Please enter a 5-digit ZIP code.");
  }
  return firstError;
}

function placeOrder() {
  const err = validateAll();
  const errBox = $("#formError");
  if (err) {
    errBox.textContent = err;
    errBox.scrollIntoView({ behavior: "smooth", block: "center" });
    return;
  }
  errBox.textContent = "";

  const t = totals(fulfilment());
  const ref = "PP-" + Math.random().toString(36).slice(2, 8).toUpperCase();
  const dateVal = $("#orderDate").value;
  const gift = $("#giftMessage").value.trim();

  // Save the order BEFORE clearing the basket, so a reload can't lose it.
  const orders = loadJSON(ORDERS_KEY, []);
  orders.push({
    ref: ref,
    date: dateVal,
    fulfilment: fulfilment(),
    recipient: $("#recipientName").value.trim(),
    total: +t.total.toFixed(2),
    items: basket.slice(),
    gift: gift,
    placedAt: new Date().toISOString(),
  });
  saveJSON(ORDERS_KEY, orders);
  basket = [];
  saveJSON(BASKET_KEY, basket);

  const dateNice = new Date(dateVal + "T12:00:00").toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric",
  });
  $("#orderRef").textContent = "Order " + ref;
  $("#confirmText").textContent =
    (fulfilment() === "delivery" ? "Delivery" : "Pickup") +
    " for " + $("#recipientName").value.trim() + " on " + dateNice +
    " — total " + money(t.total) +
    ". A confirmation is on its way to " + $("#buyerEmail").value.trim() + ".";
  $("#confirmGift").textContent = gift
    ? "Your gift message: \u201C" + gift + "\u201D"
    : "No gift message — the spice speaks for itself.";
  $("#checkoutView").hidden = true;
  $("#confirmationView").hidden = false;
  renderBasketBtn();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

document.addEventListener("DOMContentLoaded", () => {
  renderBasketBtn();
  if (basket.length === 0) {
    $("#checkoutView").hidden = true;
    $("#emptyView").hidden = false;
  } else {
    renderSummary();
  }

  // Fulfilment switch: delivery needs an address, pickup hides it and
  // reprices (delivery fee drops to $0).
  document.querySelectorAll('input[name="fulfilment"]').forEach((radio) => {
    radio.addEventListener("change", () => {
      $("#addressField").style.display =
        fulfilment() === "delivery" ? "" : "none";
      renderSummary();
    });
  });

  // Summary quantity controls — same basket, same totals, live.
  $("#summaryLines").addEventListener("click", (e) => {
    const inc = e.target.closest("[data-inc]");
    const dec = e.target.closest("[data-dec]");
    const rem = e.target.closest("[data-remove]");
    if (inc) basket[+inc.dataset.inc].qty = Math.min(9, basket[+inc.dataset.inc].qty + 1);
    else if (dec) {
      const line = basket[+dec.dataset.dec];
      line.qty--;
      if (line.qty <= 0) basket.splice(+dec.dataset.dec, 1);
    } else if (rem) basket.splice(+rem.dataset.remove, 1);
    else return;
    saveJSON(BASKET_KEY, basket);
    renderBasketBtn();
    if (basket.length === 0) {
      $("#checkoutView").hidden = true;
      $("#emptyView").hidden = false;
    } else renderSummary();
  });

  // Promo code: one code, case-insensitive, applied once.
  $("#promoBtn").addEventListener("click", () => {
    const msg = $("#promoMsg");
    const code = $("#promoInput").value.trim().toUpperCase();
    if (code === PROMO_CODE) {
      promoApplied = true;
      msg.textContent = "SPICE10 applied — 10% off your order.";
      msg.className = "promo-msg ok";
    } else {
      promoApplied = false;
      msg.textContent = "That code isn't recognised — try SPICE10.";
      msg.className = "promo-msg bad";
    }
    renderSummary();
  });

  // Gift message character counter.
  $("#giftMessage").addEventListener("input", (e) => {
    $("#giftCount").textContent = e.target.value.length + " / 200 characters";
  });

  // Card number: auto-space every 4 digits while typing.
  $("#cardNumber").addEventListener("input", (e) => {
    const d = e.target.value.replace(/\D/g, "").slice(0, 16);
    e.target.value = d.replace(/(\d{4})(?=\d)/g, "$1 ");
  });
  // Expiry: auto-insert the slash after MM.
  $("#cardExpiry").addEventListener("input", (e) => {
    const d = e.target.value.replace(/\D/g, "").slice(0, 4);
    e.target.value = d.length > 2 ? d.slice(0, 2) + "/" + d.slice(2) : d;
  });

  $("#placeOrderBtn").addEventListener("click", placeOrder);
  $("#basketBtn").addEventListener("click", () => {
    const panel = document.querySelector('[aria-label="Order summary"]');
    if (panel) panel.scrollIntoView({ behavior: "smooth" });
  });
});
