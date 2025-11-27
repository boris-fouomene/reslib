import { Validator, ensureRulesRegistered } from '../../index';
import {
  IsFile,
  IsFileExtension,
  IsFileType,
  IsImage,
  MaxFileSize,
  MinFileSize,
} from '../index';

// Ensure rules are registered
ensureRulesRegistered();

describe('File Validation Rules', () => {
  // Mock file objects for testing
  const createMockFile = (name: string, size: number, type: string) => ({
    name,
    size,
    type,
    lastModified: Date.now(),
  });

  const textFile = createMockFile('test.txt', 1024, 'text/plain');
  const imageFile = createMockFile('test.jpg', 2048, 'image/jpeg');
  const pdfFile = createMockFile('test.pdf', 3072, 'application/pdf');
  const largeFile = createMockFile('large.txt', 1024 * 1024 * 5, 'text/plain'); // 5MB
  const smallFile = createMockFile('small.txt', 100, 'text/plain');

  describe('IsFile', () => {
    it('should pass for valid file objects', async () => {
      const result = await Validator.validate({
        value: textFile,
        rules: ['File'],
      });
      expect(result.success).toBe(true);
    });

    it('should fail for non-file objects', async () => {
      const invalidValues = [
        null,
        undefined,
        'string',
        123,
        {},
        [],
        { name: 'test' }, // Missing size and type
        { size: 1024, type: 'text/plain' }, // Missing name
        { name: 'test', type: 'text/plain' }, // Missing size
        { name: 'test', size: 1024 }, // Missing type
      ];

      for (const value of invalidValues) {
        const result = await Validator.validate({
          value,
          rules: ['File'],
        });
        expect(result.success).toBe(false);
        expect((result as any).error?.message).toContain('file');
      }
    });

    it('should fail for invalid file properties', async () => {
      const invalidFiles = [
        { name: '', size: 1024, type: 'text/plain' }, // Empty name
        { name: 'test', size: -1, type: 'text/plain' }, // Negative size
        { name: 'test', size: 1024, type: '' }, // Empty type
        { name: 'test', size: NaN, type: 'text/plain' }, // NaN size
      ];

      for (const file of invalidFiles) {
        const result = await Validator.validate({
          value: file,
          rules: ['File'],
        });
        expect(result.success).toBe(false);
        expect((result as any).error?.message).toContain('file');
      }
    });

    // Decorator test
    it('should work with decorator for valid file', async () => {
      class TestClass {
        @IsFile()
        uploadedFile: any;
      }

      const instance = new TestClass();
      instance.uploadedFile = textFile;

      const result = await Validator.validateTarget(TestClass, {
        data: instance,
      });
      expect(result.success).toBe(true);
    });

    it('should fail with decorator for invalid file', async () => {
      class TestClass {
        @IsFile()
        uploadedFile: any;
      }

      const instance = new TestClass();
      instance.uploadedFile = 'not a file';

      const result = await Validator.validateTarget(TestClass, {
        data: instance,
      });
      expect(result.success).toBe(false);
      expect((result as any).errors?.[0].message).toContain('file');
    });
  });

  describe('MaxFileSize', () => {
    it('should pass when file size is below max size', async () => {
      const result = await Validator.validate({
        value: textFile,
        rules: [{ MaxFileSize: [2048] }], // 2KB limit
      });
      expect(result.success).toBe(true);
    });

    it('should pass when file size equals max size', async () => {
      const exactSizeFile = createMockFile('exact.txt', 1024, 'text/plain');
      const result = await Validator.validate({
        value: exactSizeFile,
        rules: [{ MaxFileSize: [1024] }],
      });
      expect(result.success).toBe(true);
    });

    it('should fail when file size exceeds max size', async () => {
      const result = await Validator.validate({
        value: largeFile,
        rules: [{ MaxFileSize: [1024] }], // 1KB limit
      });
      expect(result.success).toBe(false);
      expect((result as any).error?.message).toContain('maxFileSize');
    });

    it('should fail for invalid parameters', async () => {
      const result = await Validator.validate({
        value: textFile,
        rules: [{ MaxFileSize: [-1] }],
      });
      expect(result.success).toBe(false);
      expect((result as any).error?.message).toContain('invalidRuleParams');
    });

    it('should fail for non-file objects', async () => {
      const result = await Validator.validate({
        value: 'not a file',
        rules: [{ MaxFileSize: [1024] }],
      });
      expect(result.success).toBe(false);
      expect((result as any).error?.message).toContain('file');
    });

    // Decorator test
    it('should work with decorator', async () => {
      class TestClass {
        @IsFile()
        @MaxFileSize(2048)
        uploadedFile: any;
      }

      const instance = new TestClass();
      instance.uploadedFile = textFile;

      const result = await Validator.validateTarget(TestClass, {
        data: instance,
      });
      expect(result.success).toBe(true);
    });

    it('should fail with decorator when file too large', async () => {
      class TestClass {
        @IsFile()
        @MaxFileSize(1024)
        uploadedFile: any;
      }

      const instance = new TestClass();
      instance.uploadedFile = largeFile;

      const result = await Validator.validateTarget(TestClass, {
        data: instance,
      });
      expect(result.success).toBe(false);
      expect((result as any).errors?.[0].message).toContain('maxFileSize');
    });
  });

  describe('MinFileSize', () => {
    it('should pass when file size is above min size', async () => {
      const result = await Validator.validate({
        value: textFile,
        rules: [{ MinFileSize: [512] }], // 512B minimum
      });
      expect(result.success).toBe(true);
    });

    it('should pass when file size equals min size', async () => {
      const exactSizeFile = createMockFile('exact.txt', 1024, 'text/plain');
      const result = await Validator.validate({
        value: exactSizeFile,
        rules: [{ MinFileSize: [1024] }],
      });
      expect(result.success).toBe(true);
    });

    it('should fail when file size is below min size', async () => {
      const result = await Validator.validate({
        value: smallFile,
        rules: [{ MinFileSize: [512] }], // 512B minimum
      });
      expect(result.success).toBe(false);
      expect((result as any).error?.message).toContain('minFileSize');
    });

    it('should fail for invalid parameters', async () => {
      const result = await Validator.validate({
        value: textFile,
        rules: [{ MinFileSize: [-1] }],
      });
      expect(result.success).toBe(false);
      expect((result as any).error?.message).toContain('invalidRuleParams');
    });

    // Decorator test
    it('should work with decorator', async () => {
      class TestClass {
        @IsFile()
        @MinFileSize(512)
        uploadedFile: any;
      }

      const instance = new TestClass();
      instance.uploadedFile = textFile;

      const result = await Validator.validateTarget(TestClass, {
        data: instance,
      });
      expect(result.success).toBe(true);
    });

    it('should fail with decorator when file too small', async () => {
      class TestClass {
        @IsFile()
        @MinFileSize(512)
        uploadedFile: any;
      }

      const instance = new TestClass();
      instance.uploadedFile = smallFile;

      const result = await Validator.validateTarget(TestClass, {
        data: instance,
      });
      expect(result.success).toBe(false);
      expect((result as any).errors?.[0].message).toContain('minFileSize');
    });
  });

  describe('IsFileType', () => {
    it('should pass when file type matches allowed types', async () => {
      const result = await Validator.validate({
        value: textFile,
        rules: [{ FileType: ['text/plain', 'text/html'] }],
      });
      expect(result.success).toBe(true);
    });

    it('should fail when file type does not match allowed types', async () => {
      const result = await Validator.validate({
        value: imageFile,
        rules: [{ FileType: ['text/plain'] }],
      });
      expect(result.success).toBe(false);
      expect((result as any).error?.message).toContain('fileType');
    });

    it('should work with multiple allowed types', async () => {
      const result = await Validator.validate({
        value: pdfFile,
        rules: [{ FileType: ['image/jpeg', 'application/pdf', 'text/plain'] }],
      });
      expect(result.success).toBe(true);
    });

    it('should fail for empty allowed types array', async () => {
      const result = await Validator.validate({
        value: textFile,
        rules: [{ FileType: [] }],
      });
      expect(result.success).toBe(false);
      expect((result as any).error?.message).toContain('invalidRuleParams');
    });

    it('should fail for non-file objects', async () => {
      const result = await Validator.validate({
        value: 'not a file',
        rules: [{ FileType: ['text/plain'] }],
      });
      expect(result.success).toBe(false);
      expect((result as any).error?.message).toContain('file');
    });

    // Decorator test
    it('should work with decorator', async () => {
      class TestClass {
        @IsFile()
        @IsFileType('text/plain', 'application/pdf')
        uploadedFile: any;
      }

      const instance = new TestClass();
      instance.uploadedFile = textFile;

      const result = await Validator.validateTarget(TestClass, {
        data: instance,
      });
      expect(result.success).toBe(true);
    });

    it('should fail with decorator for wrong type', async () => {
      class TestClass {
        @IsFile()
        @IsFileType('image/jpeg')
        uploadedFile: any;
      }

      const instance = new TestClass();
      instance.uploadedFile = textFile;

      const result = await Validator.validateTarget(TestClass, {
        data: instance,
      });
      expect(result.success).toBe(false);
      expect((result as any).errors?.[0].message).toContain('fileType');
    });
  });

  describe('IsImage', () => {
    it('should pass for image files', async () => {
      const imageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      for (const type of imageTypes) {
        const imageFile = createMockFile('test.jpg', 1024, type);
        const result = await Validator.validate({
          value: imageFile,
          rules: ['Image'],
        });
        expect(result.success).toBe(true);
      }
    });

    it('should fail for non-image files', async () => {
      const result = await Validator.validate({
        value: textFile,
        rules: ['Image'],
      });
      expect(result.success).toBe(false);
      expect((result as any).error?.message).toContain('image');
    });

    it('should fail for non-file objects', async () => {
      const result = await Validator.validate({
        value: 'not a file',
        rules: ['Image'],
      });
      expect(result.success).toBe(false);
      expect((result as any).error?.message).toContain('file');
    });

    // Decorator test
    it('should work with decorator for image file', async () => {
      class TestClass {
        @IsFile()
        @IsImage()
        uploadedFile: any;
      }

      const instance = new TestClass();
      instance.uploadedFile = imageFile;

      const result = await Validator.validateTarget(TestClass, {
        data: instance,
      });
      expect(result.success).toBe(true);
    });

    it('should fail with decorator for non-image file', async () => {
      class TestClass {
        @IsFile()
        @IsImage()
        uploadedFile: any;
      }

      const instance = new TestClass();
      instance.uploadedFile = textFile;

      const result = await Validator.validateTarget(TestClass, {
        data: instance,
      });
      expect(result.success).toBe(false);
      expect((result as any).errors?.[0].message).toContain('image');
    });
  });

  describe('IsFileExtension', () => {
    it('should pass when file extension matches allowed extensions', async () => {
      const result = await Validator.validate({
        value: textFile,
        rules: [{ FileExtension: ['txt', 'md'] }],
      });
      expect(result.success).toBe(true);
    });

    it('should pass for files with uppercase extensions', async () => {
      const upperCaseFile = createMockFile('test.TXT', 1024, 'text/plain');
      const result = await Validator.validate({
        value: upperCaseFile,
        rules: [{ FileExtension: ['txt'] }],
      });
      expect(result.success).toBe(true);
    });

    it('should fail when file extension does not match allowed extensions', async () => {
      const result = await Validator.validate({
        value: imageFile,
        rules: [{ FileExtension: ['txt', 'pdf'] }],
      });
      expect(result.success).toBe(false);
      expect((result as any).error?.message).toContain('fileExtension');
    });

    it('should work with multiple allowed extensions', async () => {
      const result = await Validator.validate({
        value: pdfFile,
        rules: [{ FileExtension: ['jpg', 'pdf', 'txt'] }],
      });
      expect(result.success).toBe(true);
    });

    it('should fail for files without extensions', async () => {
      const noExtFile = createMockFile('test', 1024, 'text/plain');
      const result = await Validator.validate({
        value: noExtFile,
        rules: [{ FileExtension: ['txt'] }],
      });
      expect(result.success).toBe(false);
      expect((result as any).error?.message).toContain('fileExtension');
    });

    it('should fail for empty allowed extensions array', async () => {
      const result = await Validator.validate({
        value: textFile,
        rules: [{ FileExtension: [] }],
      });
      expect(result.success).toBe(false);
      expect((result as any).error?.message).toContain('invalidRuleParams');
    });

    it('should fail for non-file objects', async () => {
      const result = await Validator.validate({
        value: 'not a file',
        rules: [{ FileExtension: ['txt'] }],
      });
      expect(result.success).toBe(false);
      expect((result as any).error?.message).toContain('file');
    });

    // Decorator test
    it('should work with decorator', async () => {
      class TestClass {
        @IsFile()
        @IsFileExtension('txt', 'pdf')
        uploadedFile: any;
      }

      const instance = new TestClass();
      instance.uploadedFile = textFile;

      const result = await Validator.validateTarget(TestClass, {
        data: instance,
      });
      expect(result.success).toBe(true);
    });

    it('should fail with decorator for wrong extension', async () => {
      class TestClass {
        @IsFile()
        @IsFileExtension('jpg')
        uploadedFile: any;
      }

      const instance = new TestClass();
      instance.uploadedFile = textFile;

      const result = await Validator.validateTarget(TestClass, {
        data: instance,
      });
      expect(result.success).toBe(false);
      expect((result as any).errors?.[0].message).toContain('fileExtension');
    });
  });

  // Combination tests
  describe('File Rule Combinations', () => {
    it('should combine multiple file rules', async () => {
      class TestClass {
        @IsFile()
        @IsImage()
        @MaxFileSize(4096)
        @MinFileSize(512)
        uploadedFile: any;
      }

      const instance = new TestClass();
      instance.uploadedFile = imageFile;

      const result = await Validator.validateTarget(TestClass, {
        data: instance,
      });
      expect(result.success).toBe(true);
    });

    it('should fail when any file rule fails', async () => {
      class TestClass {
        @IsFile()
        @IsImage()
        @MaxFileSize(1024) // Too small for imageFile (2048)
        uploadedFile: any;
      }

      const instance = new TestClass();
      instance.uploadedFile = imageFile;

      const result = await Validator.validateTarget(TestClass, {
        data: instance,
      });
      expect(result.success).toBe(false);
      expect((result as any).errors?.length).toBeGreaterThan(0);
    });
  });
});
