# Zekra (ذِكرى): Bilingual Online Gift Store

## Design direction
- Editorial, quiet luxury. Think of a printed stationery catalogue more than a template storefront.
- Palette: warm ivory background, charcoal text, dusty rose as the main accent, muted sage as the second accent, and thin hairline borders. No gradients and no frosted-glass effects. Corners are small (2–4px).
- Type: Cormorant Garamond for display headings and Manrope for body text in English. Arabic uses Amiri for headings and IBM Plex Sans Arabic for body text.
- Layouts are asymmetric and magazine-style. Section labels are numbered (01 / Collections), images have captions, and there is generous whitespace.
- Motion stays small: images fade in, underlines draw on links, and the cart drawer slides open.
- Product and editorial photos are generated in one consistent art direction: soft daylight, linen, dried flowers, ivory paper.

## Pages
- **Home:** split editorial hero, three curated collections ("For the Engagement", "Keepsakes", "Everyday Romance"), featured products, bestsellers, brand story, gifting promise, newsletter.
- **Shop:** category filters, price range, search, sorting (newest, price, bestselling). Filters are saved in the page link so they can be shared.
- **Product page:** image gallery with thumbnails, variants (colour, size, engraving text), quantity, add to cart, wishlist, related products.
- **Cart drawer and cart page:** quantity controls and remove buttons. Subtotal and shipping are shown in EGP.
- **Checkout:** contact, address (Egyptian governorates), shipping method, payment choice (cash on delivery now; Paymob/Fawry slots ready). Placing an order saves it as "Pending". There is no fake payment success screen.
- **Account:** sign in and sign up, profile, saved addresses, order history, order tracking timeline.
- **Wishlist page.**
- **Contact, FAQ, Shipping, Returns, About.** Each is its own page.
- **Admin dashboard** (admins only): overview stats, products (create, edit, stock, images), categories, orders (change status), customers.

## Language and currency
- Arabic is the default, with full right-to-left layout. English uses left-to-right. A switcher in the header changes the language, and the choice is remembered.
- All text lives in translation files. Product names and descriptions are stored in both languages.
- Prices are formatted for Egypt in each language, for example "١٬٢٥٠ ج.م" in Arabic and "EGP 1,250" in English.

## Sample catalogue
About 16 realistic products, priced roughly 350–4,500 EGP: engraved ring dish, couple's journal, custom star map print, pressed-flower frame, silk scrunchie set, scented candle duo, leather keepsake box, initial necklace, and more.

## Technical details
- Lovable Cloud provides sign-in, the database, and image storage.
- Database tables: categories, products, product_variants, product_images, profiles, user_roles (admin role checked server-side), addresses, wishlists, orders, order_items, order_status_events. Every table has RLS and GRANTs. Sample rows are seeded in the migration.
- The cart lives on the device (localStorage) and syncs nothing until checkout. The wishlist is stored per user, with a local fallback for guests.
- Placing an order runs on the server: it checks prices and stock against the database and inserts the order. Payment is a provider adapter so Paymob or Fawry can plug in later. Shipping is a provider interface too, with flat rates for each governorate for now.
- A small context switches language and text direction (lang/dir on the html tag). Fonts are loaded in the root head. Design tokens use oklch in styles.css.
- Reusable pieces: ProductCard, Price, SectionHeader, Gallery, VariantPicker, QuantityStepper, Drawer, and an AdminTable family.
- Every page gets its own title and description. Tests cover price formatting, cart totals, and shipping fees.
