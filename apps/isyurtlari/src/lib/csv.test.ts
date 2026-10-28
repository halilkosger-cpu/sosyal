import { describe, it, expect } from 'vitest';
import { csvOlustur } from './csv';

describe('csvOlustur', () => {
  it('formül gibi başlayan metin hücrelerini etkisizleştirir, sayılara dokunmaz', () => {
    const csv = csvOlustur([['=HYPERLINK("x")', '+90 555', '@SUM(A1)', 'Ali', -5]]);
    const satir = csv.replace(/^﻿/, '').trim();
    expect(satir).toBe(`"'=HYPERLINK(""x"")";'+90 555;'@SUM(A1);Ali;-5`);
  });
});
