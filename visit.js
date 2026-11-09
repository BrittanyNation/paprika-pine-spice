/* Paprika & Pine Spice Co. — visit & workshops page logic.
   COURSE-TRACK STUDY NOTES: small, honest state machines.
   - The hours table highlights today by comparing the row's data-day
     (0 = Sunday … 6 = Saturday) with the real day of the week.
   - The RSVP validates the date against the WORKSHOP'S weekday:
     Blend Your Own Garam Masala only runs on Saturdays, the Chili & Smoke Tasting only on
     Wednesdays. A wrong weekday is a plain, specific error.
   - Seats left are state, not decoration: a confirmed RSVP subtracts
     its seats and the number on the card updates immediately.
   - The newsletter remembers subscribers in localStorage and greets
     repeat signups instead of pretending they are new.
*/

"use strict";

const BASKET_KEY = "paprika-pine-spice-basket";
const RSVP_KEY = "paprika-pine-spice-rsvps";
const NEWS_KEY = "paprika-pine-spice-newsletter";

const $ = (sel) => document.querySelector(sel);
const money = (n) => "$" + n.toFixed(2);

function loadJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (e) { return fallback; }
}
function saveJSON(key, value) { localStorage.setItem(key, JSON.stringify(value)); }

/* Workshop catalogue: weekday (6 = Saturday, 3 = Wednesday),
   price, and seats left — seats are state that RSVPs change. */
const WORKSHOPS = {
  w1: { name: "Saturday Morning Blend Your Own Garam Masala", weekday: 6, price: 42, seatsLeft: 8, seatsEl: "seats-w1" },
  w2: { name: "Wednesday Evening Chili & Smoke Tasting", weekday: 3, price: 28, seatsLeft: 5, seatsEl: "seats-w2" },
};
const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

/* Basket is shared with the shop page; this page only reads it, so the
   drawer can show it. (Full basket editing lives on the shop page and
   at checkout.) */
function spiceName(id) {
const names = {
    "smoked-paprika": "Smoked Paprika", "chipotle-powder": "Chipotle Powder",
    "ceylon-cinnamon": "Ceylon Cinnamon", "whole-nutmeg": "Whole Nutmeg",
    "cayenne-pepper": "Cayenne Pepper", "calabrian-chili": "Calabrian Chili Flakes",
    "greek-oregano": "Greek Oregano", "french-thyme": "French Thyme",
    "vanilla-beans": "Madagascar Vanilla Beans", "green-cardamom": "Green Cardamom Pods",
    "ground-turmeric": "Ground Turmeric", "saffron-threads": "Saffron Threads",
  };
  return names[id] || id;
}
function basketCount() {
  const basket = loadJSON(BASKET_KEY, []);
  return basket.reduce((sum, l) => sum + l.qty, 0);
}

function renderSeats() {
  Object.values(WORKSHOPS).forEach((w) => {
    const el = document.getElementById(w.seatsEl);
    if (el) {
      el.textContent = w.seatsLeft > 0
        ? w.seatsLeft + (w.seatsLeft === 1 ? " seat left" : " seats left")
        : "Fully booked for now — check back next week";
    }
  });
}

function setInvalid(input, bad) {
  const field = input.closest(".field");
  if (field) field.classList.toggle("invalid", bad);
  return !bad;
}
function validEmail(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); }

function reserveSeat() {
  const errBox = $("#rsvpError");
  errBox.textContent = "";
  let firstError = "";
  const fail = (msg) => { if (!firstError) firstError = msg; };

  if (!setInvalid($("#rsvpName"), $("#rsvpName").value.trim() === "")) {
    fail("Please enter your name.");
  }
  if (!setInvalid($("#rsvpEmail"), !validEmail($("#rsvpEmail").value.trim()))) {
    fail("Please enter a valid email address.");
  }

  const ws = WORKSHOPS[$("#rsvpWorkshop").value];
  const dateVal = $("#rsvpDate").value;
  const dateInput = $("#rsvpDate");
  let dateOk = true;
  if (!dateVal) {
    dateOk = false;
    fail("Please choose a date for the workshop.");
  } else {
    const parts = dateVal.split("-").map(Number);
    const chosen = new Date(parts[0], parts[1] - 1, parts[2]);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (chosen <= today) {
      dateOk = false;
      fail("Please choose a future date.");
    } else if (chosen.getDay() !== ws.weekday) {
      dateOk = false;
      $("#rsvpDateError").textContent =
        ws.name + " runs on " + WEEKDAYS[ws.weekday] + "s — please pick a " + WEEKDAYS[ws.weekday] + ".";
      fail("That date is not a " + WEEKDAYS[ws.weekday] + ".");
    }
  }
  setInvalid(dateInput, !dateOk);

  const seats = parseInt($("#rsvpSeats").value, 10);
  if (!setInvalid($("#rsvpSeats"), !(seats >= 1 && seats <= 4))) {
    fail("Please reserve between 1 and 4 seats.");
  }
  if (seats > ws.seatsLeft) {
    setInvalid($("#rsvpSeats"), true);
    fail("Only " + ws.seatsLeft + " seat" + (ws.seatsLeft === 1 ? "" : "s") + " left for that workshop.");
  }

  if (firstError) {
    errBox.textContent = firstError;
    return;
  }

  // Success: subtract the seats, save the RSVP, show the reference.
  ws.seatsLeft -= seats;
  renderSeats();
  const ref = "PP-R-" + Math.random().toString(36).slice(2, 7).toUpperCase();
  const rsvps = loadJSON(RSVP_KEY, []);
  rsvps.push({
    ref: ref,
    workshop: ws.name,
    date: dateVal,
    seats: seats,
    name: $("#rsvpName").value.trim(),
    email: $("#rsvpEmail").value.trim(),
  });
  saveJSON(RSVP_KEY, rsvps);

  const dateNice = new Date(dateVal + "T12:00:00").toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric",
  });
  $("#rsvpMsg").textContent =
    "You're in, " + $("#rsvpName").value.trim() + "! " + seats +
    (seats === 1 ? " seat" : " seats") + " for " + ws.name + " on " + dateNice +
    " — " + money(ws.price * seats) + " total, payable at the shop. Your reference is " + ref + ".";
  $("#rsvpSuccess").hidden = false;
  $("#rsvpBtn").disabled = true;
  $("#rsvpBtn").textContent = "Reserved ✓";
}

document.addEventListener("DOMContentLoaded", () => {
  // Highlight today's row in the hours table.
  const today = new Date().getDay();
  document.querySelectorAll("#hoursTable tr").forEach((row) => {
    if (+row.dataset.day === today) row.classList.add("today");
  });
  renderSeats();
  $("#basketBtn").textContent = "Basket (" + basketCount() + ")";

  // FAQ accordion — one open at a time, aria-expanded kept honest.
  $("#faqAccordion").addEventListener("click", (e) => {
    const btn = e.target.closest(".acc-btn");
    if (!btn) return;
    const item = btn.closest(".acc-item");
    const wasOpen = item.classList.contains("open");
    document.querySelectorAll("#faqAccordion .acc-item").forEach((it) => {
      it.classList.remove("open");
      it.querySelector(".acc-btn").setAttribute("aria-expanded", "false");
    });
    if (!wasOpen) {
      item.classList.add("open");
      btn.setAttribute("aria-expanded", "true");
    }
  });

  // RSVP.
  $("#rsvpBtn").addEventListener("click", reserveSeat);

  // Newsletter with duplicate recognition.
  $("#newsletterForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const email = $("#newsletterEmail").value.trim().toLowerCase();
    const msg = $("#newsletterMsg");
    if (!validEmail(email)) {
      msg.textContent = "Please enter a valid email address.";
      msg.className = "form-msg bad";
      return;
    }
    const subs = loadJSON(NEWS_KEY, []);
    if (subs.includes(email)) {
      msg.textContent = "You're already on the list — see you Sunday!";
    } else {
      subs.push(email);
      saveJSON(NEWS_KEY, subs);
      msg.textContent = "Welcome to The Spice Rack Letter! Your first issue arrives Sunday.";
    }
    msg.className = "form-msg ok";
    $("#newsletterEmail").value = "";
  });

  // Basket drawer (read-only view on this page).
  const openDrawer = () => {
    const basket = loadJSON(BASKET_KEY, []);
    const body = $("#drawerBody");
    const foot = $("#drawerFoot");
    if (basket.length === 0) {
      body.innerHTML = '<p class="drawer-empty">Your basket is empty.<br><a href="index.html">Browse spices</a> to add one.</p>';
      foot.innerHTML = "";
    } else {
      body.innerHTML = basket.map((line) =>
        "<p><strong>" + spiceName(line.id) + "</strong> — " + line.size +
        " × " + line.qty + "</p>"
      ).join("");
      foot.innerHTML = '<a class="btn btn-rose" href="cart.html">Go to checkout</a>';
    }
    $("#basketDrawer").classList.add("open");
    $("#drawerBackdrop").classList.add("open");
  };
  const closeDrawer = () => {
    $("#basketDrawer").classList.remove("open");
    $("#drawerBackdrop").classList.remove("open");
  };
  $("#basketBtn").addEventListener("click", openDrawer);
  $("#drawerClose").addEventListener("click", closeDrawer);
  $("#drawerBackdrop").addEventListener("click", closeDrawer);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeDrawer();
  });
});
