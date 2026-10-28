import { describe, it, expect, vi, beforeEach } from 'vitest';
import { sepeteUcur } from './sepete-ucus';

describe('sepeteUcur', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockReturnValue({ matches: false }),
    });
  });

  it('kaynak yoksa yalnizca titrer, hata vermez', () => {
    const titresim = vi.fn();
    Object.defineProperty(navigator, 'vibrate', { value: titresim, configurable: true });
    expect(() => sepeteUcur(null)).not.toThrow();
    expect(titresim).toHaveBeenCalledWith(25);
  });

  it('gorunur hedef yoksa kopya eklemez', () => {
    const img = document.createElement('img');
    (img as any).animate = vi.fn();
    sepeteUcur(img);
    expect(document.querySelectorAll('img').length).toBe(0);
  });
});
