/**
 * The last element that had focus. Loaded with the cart provider (not with the lazily loaded
 * mini-cart), so it has already seen the click on "Add to cart" when the drawer finally opens:
 * by then that button was disabled for the request and focus had dropped to the page.
 */
let last: HTMLElement | null = null;

if (typeof document !== 'undefined')
  document.addEventListener(
    'focusin',
    (e) => {
      if (e.target instanceof HTMLElement && e.target !== document.body) last = e.target;
    },
    true,
  );

export const lastFocused = () => last;
