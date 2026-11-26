import { renderHook, act } from '@testing-library/react-native';
import { Platform } from 'react-native';
import { installNoPageScroll, useWebKeyboard, KEYBOARD_THRESHOLD } from '@utils/useWebKeyboard';

type Listener = () => void;

const FULL_HEIGHT = 800;

function setupViewport(): {
  vv: { height: number; offsetTop: number; fire: () => void };
  listenerCount: () => number;
} {
  const listeners: Record<string, Set<Listener>> = { resize: new Set(), scroll: new Set() };
  const vv = {
    height: FULL_HEIGHT,
    offsetTop: 0,
    addEventListener: (type: string, fn: Listener) => listeners[type].add(fn),
    removeEventListener: (type: string, fn: Listener) => listeners[type].delete(fn),
    fire: () => listeners.resize.forEach((fn) => fn()),
  };
  const g = global as unknown as Record<string, unknown>;
  g.window = { visualViewport: vv };
  g.document = { documentElement: { clientHeight: FULL_HEIGHT } };
  return {
    vv,
    listenerCount: () => listeners.resize.size + listeners.scroll.size,
  };
}

describe('useWebKeyboard', () => {
  const g = global as unknown as Record<string, unknown>;
  const origWindow = g.window;
  const origDocument = g.document;
  const origOS = Platform.OS;

  beforeEach(() => {
    Object.defineProperty(Platform, 'OS', { value: 'web', configurable: true });
  });

  afterEach(() => {
    g.window = origWindow;
    g.document = origDocument;
    Object.defineProperty(Platform, 'OS', { value: origOS, configurable: true });
  });

  it('reports closed when the visible area is the full page', () => {
    setupViewport();
    const { result } = renderHook(() => useWebKeyboard());
    expect(result.current).toEqual({ keyboardOpen: false, visibleHeight: null, visibleTop: 0 });
  });

  it('reports open with the visible height when the keyboard covers the page', () => {
    const { vv } = setupViewport();
    const { result } = renderHook(() => useWebKeyboard());
    act(() => {
      vv.height = 450;
      vv.fire();
    });
    expect(result.current).toEqual({ keyboardOpen: true, visibleHeight: 450, visibleTop: 0 });
  });

  it('follows the visible area when iOS pans it down the page', () => {
    const { vv } = setupViewport();
    const { result } = renderHook(() => useWebKeyboard());
    act(() => {
      vv.height = 450;
      vv.offsetTop = 200;
      vv.fire();
    });
    expect(result.current).toEqual({ keyboardOpen: true, visibleHeight: 450, visibleTop: 200 });
  });

  it('resets the offset when the keyboard closes', () => {
    const { vv } = setupViewport();
    const { result } = renderHook(() => useWebKeyboard());
    act(() => {
      vv.height = 450;
      vv.offsetTop = 200;
      vv.fire();
    });
    act(() => {
      vv.height = FULL_HEIGHT;
      vv.offsetTop = 0;
      vv.fire();
    });
    expect(result.current.visibleTop).toBe(0);
  });

  it('ignores small height changes from the browser toolbar collapsing', () => {
    const { vv } = setupViewport();
    const { result } = renderHook(() => useWebKeyboard());
    act(() => {
      vv.height = FULL_HEIGHT - KEYBOARD_THRESHOLD + 10;
      vv.fire();
    });
    expect(result.current.keyboardOpen).toBe(false);
  });

  it('reports closed again when the keyboard is dismissed', () => {
    const { vv } = setupViewport();
    const { result } = renderHook(() => useWebKeyboard());
    act(() => {
      vv.height = 450;
      vv.fire();
    });
    act(() => {
      vv.height = FULL_HEIGHT;
      vv.fire();
    });
    expect(result.current).toEqual({ keyboardOpen: false, visibleHeight: null, visibleTop: 0 });
  });

  it('removes its listeners on unmount', () => {
    const { listenerCount } = setupViewport();
    const { unmount } = renderHook(() => useWebKeyboard());
    expect(listenerCount()).toBe(2);
    unmount();
    expect(listenerCount()).toBe(0);
  });

  it('does nothing on native', () => {
    Object.defineProperty(Platform, 'OS', { value: 'ios', configurable: true });
    const { listenerCount } = setupViewport();
    const { result } = renderHook(() => useWebKeyboard());
    expect(listenerCount()).toBe(0);
    expect(result.current.keyboardOpen).toBe(false);
  });
});

describe('installNoPageScroll', () => {
  const g = global as unknown as Record<string, unknown>;
  const origWindow = g.window;
  const origDocument = g.document;
  const origOS = Platform.OS;

  type Handler = (e: unknown) => void;
  let docHandlers: Record<string, Handler | undefined>;
  let winHandlers: Record<string, Handler | undefined>;
  let win: { scrollY: number; scrollTo: jest.Mock };
  let doc: { activeElement: unknown };

  beforeEach(() => {
    Object.defineProperty(Platform, 'OS', { value: 'web', configurable: true });
    docHandlers = {};
    winHandlers = {};
    win = {
      scrollY: 0,
      scrollTo: jest.fn(),
      addEventListener: (t: string, fn: Handler) => (winHandlers[t] = fn),
      removeEventListener: (t: string) => (winHandlers[t] = undefined),
    };
    doc = {
      activeElement: null,
      addEventListener: (t: string, fn: Handler) => (docHandlers[t] = fn),
      removeEventListener: (t: string) => (docHandlers[t] = undefined),
    };
    g.window = win;
    g.document = doc;
  });

  afterEach(() => {
    g.window = origWindow;
    g.document = origDocument;
    Object.defineProperty(Platform, 'OS', { value: origOS, configurable: true });
  });

  const field = (
    tagName: string,
    extra: Record<string, unknown> = {}
  ): { tagName: string; focus: jest.Mock } => ({ tagName, focus: jest.fn(), ...extra });
  const touch = (target: unknown): { target: unknown; preventDefault: jest.Mock } => ({
    target,
    preventDefault: jest.fn(),
  });

  it('focuses a tapped text field without letting Safari scroll the page', () => {
    installNoPageScroll();
    const textarea = field('TEXTAREA');
    const e = touch(textarea);
    docHandlers.touchstart?.(e);
    expect(e.preventDefault).toHaveBeenCalled();
    expect(textarea.focus).toHaveBeenCalledWith({ preventScroll: true });
  });

  it('leaves taps on an already-focused field alone so the caret can move', () => {
    installNoPageScroll();
    const textarea = field('TEXTAREA');
    doc.activeElement = textarea;
    const e = touch(textarea);
    docHandlers.touchstart?.(e);
    expect(e.preventDefault).not.toHaveBeenCalled();
  });

  it('leaves taps on buttons and other elements alone', () => {
    installNoPageScroll();
    const e = touch({ tagName: 'DIV' });
    docHandlers.touchstart?.(e);
    expect(e.preventDefault).not.toHaveBeenCalled();
  });

  it('leaves read-only fields alone', () => {
    installNoPageScroll();
    const e = touch(field('INPUT', { readOnly: true }));
    docHandlers.touchstart?.(e);
    expect(e.preventDefault).not.toHaveBeenCalled();
  });

  it('resets any page scroll back to the top', () => {
    installNoPageScroll();
    win.scrollY = 277;
    winHandlers.scroll?.({});
    expect(win.scrollTo).toHaveBeenCalledWith(0, 0);
  });

  it('removes its listeners on cleanup', () => {
    const cleanup = installNoPageScroll();
    cleanup();
    expect(docHandlers.touchstart).toBeUndefined();
    expect(winHandlers.scroll).toBeUndefined();
  });

  it('does nothing on native', () => {
    Object.defineProperty(Platform, 'OS', { value: 'ios', configurable: true });
    installNoPageScroll();
    expect(docHandlers.touchstart).toBeUndefined();
  });
});
