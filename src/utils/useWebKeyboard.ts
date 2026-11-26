import { useEffect, useState } from 'react';
import { Platform } from 'react-native';

// A height loss smaller than this is browser chrome (URL bar collapsing), not a keyboard.
export const KEYBOARD_THRESHOLD = 150;

export interface WebKeyboardState {
  keyboardOpen: boolean;
  // Visible height while the keyboard is open; null when closed or not on web.
  visibleHeight: number | null;
  // How far the visible area is panned below the layout viewport (vv.offsetTop); 0 when closed.
  // Use with position: fixed, which is anchored to the layout viewport.
  visibleTop: number;
}

const CLOSED: WebKeyboardState = { keyboardOpen: false, visibleHeight: null, visibleTop: 0 };

/**
 * Mobile Safari does not resize the page when the on-screen keyboard opens: it covers the
 * bottom of the page and both scrolls the page and pans the visible area, leaving the tab bar
 * and a blank gap above the keyboard. This hook reads the visual viewport so the app can pin
 * itself (position: fixed) to the visible area: height = vv.height, offset = vv.offsetTop.
 * Measured on iOS 26: scrollY=277 and offsetTop=277 at the same time, so page coordinates
 * (pageTop) are not reliable; fixed + offsetTop is. No-op on native.
 */
export function useWebKeyboard(): WebKeyboardState {
  const [state, setState] = useState<WebKeyboardState>(CLOSED);

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined' || typeof document === 'undefined')
      return undefined;
    const vv = window.visualViewport;
    if (!vv) return undefined;

    const update = (): void => {
      const fullHeight = document.documentElement.clientHeight;
      const open = fullHeight - vv.height > KEYBOARD_THRESHOLD;
      const visibleHeight = open ? Math.round(vv.height) : null;
      const visibleTop = open ? Math.max(0, Math.round(vv.offsetTop)) : 0;
      setState((prev) =>
        prev.keyboardOpen === open &&
        prev.visibleHeight === visibleHeight &&
        prev.visibleTop === visibleTop
          ? prev
          : { keyboardOpen: open, visibleHeight, visibleTop }
      );
    };

    vv.addEventListener('resize', update);
    vv.addEventListener('scroll', update);
    update();
    return () => {
      vv.removeEventListener('resize', update);
      vv.removeEventListener('scroll', update);
    };
  }, []);

  return state;
}

const isTextField = (el: EventTarget | null): el is HTMLElement => {
  if (!el || typeof (el as HTMLElement).tagName !== 'string') return false;
  const field = el as HTMLInputElement;
  const tag = field.tagName;
  return (tag === 'TEXTAREA' || tag === 'INPUT') && !field.readOnly && !field.disabled;
};

/**
 * Stops mobile Safari from scrolling the page when a text field is tapped, so the header does
 * not slide up and back while the keyboard opens:
 * - a tap on an unfocused text field focuses it with preventScroll instead of the default focus;
 * - any page scroll is reset, since the app scrolls inside its own ScrollViews, never the page.
 * Returns a cleanup function. No-op on native.
 */
export function installNoPageScroll(): () => void {
  if (Platform.OS !== 'web' || typeof window === 'undefined' || typeof document === 'undefined')
    return () => undefined;

  const onTouchStart = (e: TouchEvent): void => {
    const target = e.target;
    if (!isTextField(target) || document.activeElement === target) return;
    e.preventDefault();
    target.focus({ preventScroll: true });
  };
  const onScroll = (): void => {
    if (window.scrollY !== 0) window.scrollTo(0, 0);
  };

  document.addEventListener('touchstart', onTouchStart, { capture: true, passive: false });
  window.addEventListener('scroll', onScroll);
  return () => {
    document.removeEventListener('touchstart', onTouchStart, { capture: true });
    window.removeEventListener('scroll', onScroll);
  };
}
