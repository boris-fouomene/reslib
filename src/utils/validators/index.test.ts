import { isImageSrc } from '@utils/image';
import '../string';
import { isValidEmail } from './index';

describe('Validator Utils', () => {
  describe('isValidEmail', () => {
    it('should return true for valid email addresses', () => {
      expect(isValidEmail('test.name@example.com')).toBe(true);
      expect(isValidEmail('test+name@example.co.uk')).toBe(true);
      expect(isValidEmail('test_name@sub.example.com')).toBe(true);
    });

    it('should return false for invalid email addresses', () => {
      expect(isValidEmail('test@.com')).toBe(false);
      expect(isValidEmail('@example.com')).toBe(false);
      expect(isValidEmail('test@example')).toBe(false);
      expect(isValidEmail('test@.')).toBe(false);
    });

    it('should return false for non-string inputs', () => {
      expect(isValidEmail(null)).toBe(false);
      expect(isValidEmail(undefined)).toBe(false);
      expect(isValidEmail(123)).toBe(false);
      expect(isValidEmail({})).toBe(false);
    });
  });

  describe('isImageSrc', () => {
    it('should return true for valid image URLs', () => {
      expect(isImageSrc('https://example.com/image.jpg')).toBe(true);
      expect(isImageSrc('http://sub.example.com/path/image.png')).toBe(true);
      expect(isImageSrc('blob:http://example.com/image.jpg')).toBe(true);
    });

    it('should return false for invalid valid data URLs', () => {
      expect(isImageSrc('data:image/jpeg;base64,abc123')).toBe(false);
      expect(isImageSrc('data:image/png;base64,xyz789')).toBe(false);
    });

    it('should return false for invalid sources', () => {
      expect(isImageSrc('invalid-url')).toBe(false);
      expect(isImageSrc('')).toBe(false);
      expect(isImageSrc(null)).toBe(false);
      expect(isImageSrc(undefined)).toBe(false);
    });
  });
});
