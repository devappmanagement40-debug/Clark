---
name: Page visual styling
description: Homepage and shared page styling after the CATL rebrand.
---

The latest homepage reference supersedes the older home styling: use a clear Dulux banner without a profile block, a three-value account summary, four quick actions, real product cards, and a five-item bottom navigation. Use a pale gray page, white cards, and Dulux navy/blue accents.

**Why:** The user provided a new mobile homepage reference and confirmed the whole layout should follow it, except the profile section at the top.

**How to apply:** Keep all financial and product values database-driven, use the user's supplied Dulux paint images, and send purchase actions through the existing confirmation flow. Do not add sample balances or fake product values.

Use the user's supplied image icons for homepage quick actions and the announcement bell. Reuse matching assets in the account shortcuts and service rows only when their meaning fits the action.

**Why:** The user asked for image icons on the homepage, then requested their reuse in the account shortcuts and matching icons in the account services list.

**How to apply:** Match supplied icons to the relevant labels, preserve actions and layout, use the lock image for password changes and the supplied X image for logout, and keep existing semantic icons where no supplied image fits (such as admin access).

On the withdrawal page, use actual image or SVG assets for icons; do not draw icon artwork with CSS pseudo-elements.

**Why:** the user said the CSS-generated icon decorations looked strange and asked for real icons instead.

**How to apply:** Use a relevant supplied image or semantic SVG icon, and keep CSS limited to layout, sizing, and surface styling.

The latest homepage reference does not include the scrolling activity strip. Do not show the old sample-activity strip on the home page.

**Why:** The user asked the entire homepage to follow the newer reference.

**How to apply:** Keep the homepage focused on the banner, live summary, shortcuts, and product cards. If sample activity is ever reused elsewhere, keep it clearly display-only and separate from the account ledger.

For home product cards, follow the latest Dulux reference: user-supplied Dulux paint images, live product names, price, daily earnings, cycle duration, and total return. The home purchase action should open the existing purchase confirmation for the selected product.

**Why:** The user asked the whole homepage to match the new reference and had already supplied Dulux paint-product images.

**How to apply:** Use current product data from the app rather than fixed amounts or names; keep the purchase confirmation and server validation authoritative.

The purchase confirmation should use the CATL blue palette and clearly summarize the selected product, purchase price, daily and total revenue, and deposit-versus-withdrawable-earnings funding. Keep the confirmation responsive and preserve existing balance calculations and server validation.

**Why:** The user asked for the page and purchase confirmation to be stabilized and for the popup to look professional in the platform's new colors.

**How to apply:** Present financial details in a clear hierarchy with distinct cancel and confirm actions, without changing purchase or balance rules.

After a failed purchase request, keep the confirmation open and show the error there so the user can retry or cancel without losing the product and balance details. Clear stale errors when another product is opened.

**Why:** A rejected or interrupted purchase should not force the user to restart the confirmation flow.

**How to apply:** Keep server validation authoritative and only send another purchase request after the user explicitly retries.

The withdrawal page follows the latest reference: a solid pale-lavender background, navy title bar, white amount and wallet cards, an outlined fee estimate, a blue gradient action, and separate pale instructions with a navy left edge. Use a Roboto-like sans serif for the main UI and serif text for the instruction strips.

**Why:** the user supplied three screenshots of the withdrawal flow and asked to match the layout, colors, and font.

**How to apply:** Keep the page wallpaper-free; continue using configured currency, balance, minimum, fee, hours, and daily limit, and retain the existing server-side withdrawal validation.

The Income tab follows the supplied reference: a navy title strip, solid pale gray-lavender background with no inherited wallpaper, and centered “NO DATA” when there are no income entries. Purchased Dulux products reuse the home offer-card layout without a purchase button. Keep Income separate from payout-account management.

**Why:** the user asked for the Income screen to match the reference and purchased product cards to match the offer cards except for the buy action.

**How to apply:** Exclude the Income route from the global background-image shell and show actual income records when present; do not fabricate entries. Preserve wallet management and withdrawal selection separately from Income navigation.

The Team page uses a white canvas without the app wallpaper; keep its Dulux team banner inside the page content.

**Why:** the user asked to remove the full-page background image from Team, matching the Income page.

**How to apply:** Exclude the Team route from the global background-image shell without removing its in-page Dulux banner.

The Share page follows the supplied reference with the Dulux team photo, navy header, white information panel, copyable referral link and code, and three commission-level cards.

**Why:** the user asked for the Share page to match the reference’s colors and cards.

**How to apply:** Keep visible Share labels and copy messages in French, build the link from the signed-in user’s referral code, read commission percentages from current platform settings, and do not promise a fixed daily income from the reference image.

The Moi page follows the supplied account reference with a Dulux image inside the top account banner, Dulux logo, account phone/ID/VIP, three live balance figures, and a French list of account destinations. Keep the rest of the page free of background images.

**Why:** the user asked for the Moi page to match the provided mobile screenshots, including its icons and Dulux imagery.

**How to apply:** Exclude the Moi route from the global wallpaper while keeping the image scoped to its top banner and avatar logo; source all displayed amounts from the signed-in account, preserve menu destinations, and retain the admin-only entry and sign-out behavior.

The À propos page uses a solid white background with no global wallpaper image.

**Why:** the user explicitly asked to remove the image behind this page and use the app’s white page background.

**How to apply:** Exclude `/about` from the global wallpaper wrapper, keep the page, content panel, and header backgrounds opaque white, and use DULUX DT/Dulux content and assets rather than legacy CATL branding.

Do not use the old CATL image as a full-page wallpaper anywhere in the app. Keep intentional images that are part of page content, such as the Dulux authentication banner or product/team photos.

**Why:** The user asked to remove the image that appears behind pages throughout the app, while retaining images used as actual page content.

**How to apply:** Keep page backgrounds solid and opaque; remove global wallpaper wrappers and any page-specific full-screen wallpaper rules without deleting in-content banners or illustrations.

The personal-information flow follows the supplied three-screen reference: a personal options page, a wallet-binding form, and a password-change form, with the Moi tab retained as active.

**Why:** the user asked to reproduce those screens’ icons, colors, and layout while retaining real account actions.

**How to apply:** Keep the pages in French, reuse the supplied illustration on the personal-information and password screens, use only the signed-in user’s country-configured withdrawal methods, and submit wallet and password changes through existing server endpoints.

The administrator console and its team-detail screen use a solid white background, Dulux navy headers and selected tabs, and no wallpaper images. Keep receipt, product, and other record images that are actual content.

**Why:** the user asked the admin panel to use the site’s white and blue palette and remove background images.

**How to apply:** Keep page surfaces opaque white, use the site’s navy for top bars and active navigation, and remove only decorative page-background imagery rather than content images.