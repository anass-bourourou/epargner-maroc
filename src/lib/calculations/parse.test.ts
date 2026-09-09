import { describe, it, expect } from 'vitest';
import { parseLocalNumber, parseWithDefault } from './parse';

describe('parseLocalNumber', () => {
  it('parses plain integers', () => {
    expect(parseLocalNumber('10000')).toBe(10000);
  });
  it('parses grouped numbers with spaces', () => {
    expect(parseLocalNumber('10 000')).toBe(10000);
    expect(parseLocalNumber('10 000')).toBe(10000);
  });
  it('parses French decimal comma', () => {
    expect(parseLocalNumber('2,5')).toBe(2.5);
  });
  it('parses dotted decimal', () => {
    expect(parseLocalNumber('2.5')).toBe(2.5);
  });
  it('strips currency unit', () => {
    expect(parseLocalNumber('10 000 DH')).toBe(10000);
    expect(parseLocalNumber('12,50 MAD')).toBe(12.5);
    expect(parseLocalNumber('12,50 dhs')).toBe(12.5);
  });
  it('returns null on empty / invalid input', () => {
    expect(parseLocalNumber('')).toBe(null);
    expect(parseLocalNumber('   ')).toBe(null);
    expect(parseLocalNumber('abc')).toBe(null);
    expect(parseLocalNumber(null)).toBe(null);
    expect(parseLocalNumber(undefined)).toBe(null);
  });
  it('returns null on double dots', () => {
    expect(parseLocalNumber('2.5.6')).toBe(null);
  });
  it('parseWithDefault falls back on invalid', () => {
    expect(parseWithDefault('abc', 42)).toBe(42);
    expect(parseWithDefault('7,5', 42)).toBe(7.5);
    expect(parseWithDefault('', 0)).toBe(0);
  });
});
