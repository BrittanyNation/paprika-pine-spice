# Paprika & Pine Spice Co. — Small-Batch Spices, Ground Fresh in Clarksville

**Live site:** https://brittanynation.github.io/paprika-pine-spice/

A fully functional website for **Paprika & Pine Spice Co.**, a fictional small-batch spice merchant in Clarksville, Tennessee: browse 12 spices rendered from data, filter by spice family, search, sort, open a spice to choose a jar size (Taster 1 oz / Classic 4 oz / Pantry 8 oz) that reprices live, save a wishlist, fill a basket that persists between visits, and check out with full validation, a working promo code, and a real confirmation. The visit page adds shop hours, spice-blending workshops with weekday-checked RSVP, FAQ accordions, and a duplicate-aware newsletter. Every interactive element works — no dead buttons, no placeholder links.

This is an original portfolio concept by Brittany Nation. No affiliation with any real business is claimed. Design workflow: Sketch / Webflow for layout thinking, built with HTML, CSS and JavaScript.

## Course track: complete — combined-skills build

The daily projects followed Dr. Angela Yu's *Full-Stack Web Development Bootcamp* (Udemy) one skill at a time: live APIs + async JavaScript (Solstice Skies), Node.js + Express (Willow Bend Paddle Co.), databases + REST API design (Tinker Commons), authentication (Haven Desk Collective), and React (Saffron & Sage Kitchen, deepened by Fieldnotes Studio). With all five steps complete, this build combines the front-end patterns from across the course in plain JavaScript, with the code commented as study material:

- **Data-driven rendering** — the shelf is an array of objects in `shop.js`; cards, counts and the empty state are all built from data.
- **State + persistence** — basket and wishlist are saved to localStorage on every change and restored on load, so they survive page changes and reloads.
- **Derived state** — the visible list (spice family + search + sort) and every total (subtotal, promo, delivery, 7% tax) are computed from state, never stored.
- **Option-driven pricing** — the detail modal's jar-size selector reprices live: Taster is $4 under Classic, Pantry is $10 over Classic.
- **Validated checkout** — recipient, date (no past dates, no Sundays, same-day delivery closes at 2 PM), name, email, 16-digit card, future MM/YY expiry and CVC are all validated inline before a `PP-XXXXXX` confirmation is generated, the order saved, and the basket cleared.

## What works on the site

- **Shop** — 12 spices from data; spice-family chips (Smoky / Warm / Hot / Herbal / Sweet / Exotic), live search, four sort orders, live result count and an honest empty state; detail modal with jar-size pricing and quantity; wishlist hearts persisted in localStorage.
- **Basket** — slide-in drawer with quantity increase/decrease and remove; the same basket powers the checkout page and persists in localStorage across pages.
- **Checkout** — promo code `SPICE10` takes 10% off; delivery is $6.95 and free once the discounted subtotal reaches $60; pickup is free; gift message with a 200-character counter; tax is 7% as its own line; full inline validation ends in a confirmation with a generated `PP-XXXXXX` reference.
- **Visit & Workshops** — hours table with today highlighted, two blending workshops with a validated RSVP form that checks the date against the workshop's weekday (Saturdays for Blend Your Own Garam Masala, Wednesdays for Chili & Smoke Tasting) and subtracts seats live, ending in a `PP-R-XXXXX` reference, working FAQ accordions, and a validated Spice Rack Letter newsletter signup that recognises repeat subscribers.

## Verified

Automated DOM checks against the built files (see the run log in the goal workspace): 12 cards render from data, the Smoky filter narrows 12 to 2 and All restores 12, search narrows to 1, the modal Pantry price is $10 over Classic, adding to the basket updates the count and persists it, checkout math is exact (Smoked Paprika $9.00 + Madagascar Vanilla Beans $16.00 = $25.00 subtotal; SPICE10 −$2.50; delivery $6.95; tax $2.06; total $31.51), an invalid submit shows field errors, a Sunday date is rejected, a valid submit shows a `PP-XXXXXX` confirmation and clears the basket, the RSVP rejects a wrong weekday and confirms a right one, and the newsletter signup succeeds and recognises a duplicate.

## Palette

Roast brown `#3B2417`, paprika `#B3402A`, saffron `#D9A441`, sand `#F0E2C8`, cream `#FBF3E6`, ink `#2B2320`, olive `#6B7A4F`.

## Files

- `index.html` — shop page shell with Open Graph tags
- `shop.js` — catalogue data, filtering/search/sort, modal, wishlist and basket drawer, commented as study code
- `cart.html` — basket and checkout page
- `cart.js` — derived totals, promo, checkout validation and confirmation, commented as study code
- `visit.html` — visit, workshops, RSVP, FAQs and newsletter
- `visit.js` — hours highlight, workshop RSVP, FAQ accordion, newsletter, commented as study code
- `styles.css` — design system (roast brown / paprika / saffron)
- `images/` — 15 real Pexels photographs (hero, shop, workshop, 12 spices)
- `og-image.png` — branded social preview image, 1200×627
