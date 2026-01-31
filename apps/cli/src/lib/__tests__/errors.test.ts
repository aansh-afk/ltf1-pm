import { describe, it, expect } from 'vitest';
import { toError, getErrorMessage } from '../errors.js';

describe('toError', () => {
  it('returns the same Error instance when given an Error', () => {
    const original = new Error('original');
    const result = toError(original);
    expect(result).toBe(original);
    expect(result.message).toBe('original');
  });

  it('wraps a string in a new Error', () => {
    const result = toError('something went wrong');
    expect(result).toBeInstanceOf(Error);
    expect(result.message).toBe('something went wrong');
  });

  it('extracts message from an object with a message property', () => {
    const result = toError({ message: 'object message' });
    expect(result).toBeInstanceOf(Error);
    expect(result.message).toBe('object message');
  });

  it('converts null using String()', () => {
    const result = toError(null);
    expect(result).toBeInstanceOf(Error);
    expect(result.message).toBe('null');
  });

  it('converts undefined using String()', () => {
    const result = toError(undefined);
    expect(result).toBeInstanceOf(Error);
    expect(result.message).toBe('undefined');
  });

  it('converts a number using String()', () => {
    const result = toError(42);
    expect(result).toBeInstanceOf(Error);
    expect(result.message).toBe('42');
  });

  it('converts a boolean using String()', () => {
    const result = toError(false);
    expect(result).toBeInstanceOf(Error);
    expect(result.message).toBe('false');
  });

  it('ignores object with non-string message property', () => {
    const result = toError({ message: 123 });
    expect(result).toBeInstanceOf(Error);
    // Falls through to String() path since message is not a string
    expect(result.message).toBe('[object Object]');
  });

  it('handles an empty string', () => {
    const result = toError('');
    expect(result).toBeInstanceOf(Error);
    expect(result.message).toBe('');
  });
});

describe('getErrorMessage', () => {
  it('returns the message from an Error', () => {
    expect(getErrorMessage(new Error('test error'))).toBe('test error');
  });

  it('returns the string directly when given a string', () => {
    expect(getErrorMessage('plain string')).toBe('plain string');
  });

  it('returns the message from an object with a message property', () => {
    expect(getErrorMessage({ message: 'obj msg' })).toBe('obj msg');
  });

  it('returns "null" for null', () => {
    expect(getErrorMessage(null)).toBe('null');
  });

  it('returns "undefined" for undefined', () => {
    expect(getErrorMessage(undefined)).toBe('undefined');
  });

  it('returns stringified number for a number', () => {
    expect(getErrorMessage(404)).toBe('404');
  });

  it('returns the specific message from an Error with a custom message', () => {
    const err = new Error('specific failure reason');
    expect(getErrorMessage(err)).toBe('specific failure reason');
  });
});
