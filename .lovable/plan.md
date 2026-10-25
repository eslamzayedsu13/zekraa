# Zekra updates

## 1. Fix checkout not completing
- The server logs show no failed order attempts, so the order request most likely never gets sent. The likely cause is the "Place order" button staying disabled after a check fails without saying so (for example, a phone number typed with Arabic digits, spaces or +20). This still needs confirming.
- First, reproduce the problem in the browser with a signed-in account and a filled form, and confirm the real cause.
- Fix: convert Arabic/Persian digits to Latin ones and strip spaces and the +20/0020 prefix from phone numbers. Show an error under each invalid field and keep the button clickable, so tapping it explains what's missing instead of doing nothing. Show any server error message clearly.
- Check end to end that an order is placed and the order page opens.

## 2. Remove the email-confirmation message
- Turn on auto-confirm for email sign-ups, so new accounts are signed in right away.
- Remove the "check your email" notice and send the user straight on after signing up.

## 3. Mobile header
- On phones, replace the search icon with a polished language switch: a small bordered pill (globe icon + "EN"/"ع") that toggles language with a short fade.
- Search moves into the mobile side menu.

## 4. Mobile side menu redesign
- Header: the logo and a close button.
- A search field at the top.
- Numbered main links (01 Shop, 02 Story, 03 Contact) in large display type, with a fine divider between each.
- Shop categories shown as small chips.
- Account / Wishlist / Bag (with item count) as icon rows; Admin appears only for admins.
- Footer: language toggle (AR | EN segmented) and contact info.
- Links slide in one after another when the menu opens.

## 5. Home page redesign (same quiet-luxury style)
- Hero: full-width image with a large headline, a short line of text and two buttons. Text reveals line by line and the image zooms in slowly.
- A scrolling strip of brand promises (engraving, delivery across Egypt, cash on delivery).
- Collections laid out in a neat grid of three equal cards with clear titles.
- Featured products in a tidy 2-column (phone) / 4-column (desktop) grid.
- Story section: the image beside text.
- Bestsellers, then a "how it works" section (Choose, Engrave, Delivered).
- Elements fade and rise into view as you scroll (respects reduced-motion settings).

## 6. Pop-up notifications at the top
- Move pop-up notifications to the top center of the screen.

## 7. English logo + opening animation
- New wordmark "ZEKRA" in Cormorant Garamond with wide letter spacing and a small rose accent line, shown in both languages.
- Opening screen: an ivory full-screen layer where the letters appear one by one and the line draws underneath, then it fades out. Shown once per visit, about 1.6s, and skipped for reduced motion.

## Technical details
- `supabase--configure_auth` auto-confirm on; edit `auth.tsx` notice logic.
- Phone normalizer in `src/lib/format.ts` + test in `pricing.test.ts`-style file; checkout inline errors via dict keys.
- `Toaster position="top-center"` in `__root.tsx`.
- `Header.tsx` rework; new `Splash.tsx` gated by `sessionStorage` in `useEffect`; IntersectionObserver `Reveal` component; CSS keyframes in `styles.css`; new dict keys ar/en.
