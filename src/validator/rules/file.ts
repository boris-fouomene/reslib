import {
  ValidatorRuleParamTypes,
  type ValidatorResult,
  type ValidatorValidateOptions,
} from '../types';
import { Validator } from '../validator';

import { isNonNullString } from '@utils/isNonNullString';
import { isNumber } from '@utils/isNumber';
import type { ValidatorRuleParams } from '../types';

/**
 * @summary A validation decorator that ensures a property contains a valid file object.
 * @description
 * Validates that the decorated property represents a file-like object with valid properties:
 * - Size must be a non-negative number
 * - Type must be a non-empty string
 * - Name must be a non-empty string
 * Supports both browser File objects and server-side file representations (e.g., Multer files with mimetype/originalname).
 *
 * @example
 * ```typescript
 * class UploadForm {
 *   @IsFile()
 *   document: File;
 * }
 *
 * const form = new UploadForm();
 * form.document = new File(['content'], 'test.txt'); // ✓ Valid
 * form.document = { name: 'test.txt', size: 1024, type: 'text/plain' }; // ✓ Valid
 * form.document = { name: '', size: 1024, type: 'text/plain' }; // ✗ Invalid (empty name)
 * form.document = 'not a file'; // ✗ Invalid
 * ```
 *
 * @returns A property decorator function for file validation.
 *
 * @public
 */
export const IsFile = Validator.buildRuleDecorator<
  ValidatorRuleParamTypes['File']
>(function IsFile({
  value,
  fieldName,
  fieldLabel,
  translatedPropertyName,
  i18n,
  ...rest
}: ValidatorValidateOptions): ValidatorResult {
  if (isFileLike(value)) {
    return true;
  } else {
    const message = i18n.t('validator.file', {
      field: fieldLabel ?? (translatedPropertyName || fieldName),
      value,
      ...rest,
    });
    return message;
  }
}, 'File');

/**
 * @summary A validation decorator that ensures a file's size does not exceed a maximum limit.
 * @description
 * Validates that the decorated file property has a size (in bytes) that is less than or equal
 * to the specified maximum size. Useful for preventing uploads that are too large.
 *
 * @param maxSize - The maximum allowed file size in bytes.
 *
 * @example
 * ```typescript
 * class UploadForm {
 *   @MaxFileSize(5242880) // 5MB in bytes
 *   document: File;
 * }
 *
 * const form = new UploadForm();
 * form.document = new File(['small content'], 'small.txt'); // ✓ Valid (assuming < 5MB)
 * form.document = new File(['large content'.repeat(100000)], 'large.txt'); // ✗ Invalid (> 5MB)
 * ```
 *
 * @returns A property decorator function for maximum file size validation.
 *
 * @public
 */
export const MaxFileSize = Validator.buildRuleDecorator<
  ValidatorRuleParamTypes['MaxFileSize']
>(function MaxFileSize({
  value,
  ruleParams,
  fieldName,
  translatedPropertyName,
  i18n,
  ...rest
}): ValidatorResult {
  if (!isFileLike(value)) {
    const message = i18n.t('validator.fileSize', {
      field: translatedPropertyName || fieldName,
      value,
      maxSize: ruleParams?.[0] || 0,
      ...rest,
    });
    return message;
  }

  const maxSize = ruleParams?.[0];
  if (typeof maxSize !== 'number' || maxSize < 0) {
    const message = i18n.t('validator.invalidRuleParams', {
      rule: 'MaxFileSize',
      field: translatedPropertyName || fieldName,
      ruleParams,
      ...rest,
    });
    return message;
  }

  const fileSize = value.size || 0;
  if (fileSize <= maxSize) {
    return true;
  } else {
    const message = i18n.t('validator.fileSize', {
      field: translatedPropertyName || fieldName,
      value,
      maxSize,
      actualSize: fileSize,
      ...rest,
    });
    return message;
  }
}, 'MaxFileSize');

/**
 * @summary A validation decorator that ensures a file has an allowed MIME type.
 * @description
 * Validates that the decorated file property has a MIME type that matches one of the
 * specified allowed types. Supports exact matches and wildcard patterns (e.g., 'image/*').
 *
 * @param allowedTypes - Array of allowed MIME types (e.g., ['image/jpeg', 'image/png']).
 *
 * @example
 * ```typescript
 * class ImageUpload {
 *   @IsFileType('image/jpeg', 'image/png', 'image/gif')
 *   image: File;
 * }
 *
 * const upload = new ImageUpload();
 * upload.image = new File(['content'], 'photo.jpg', { type: 'image/jpeg' }); // ✓ Valid
 * upload.image = new File(['content'], 'doc.pdf', { type: 'application/pdf' }); // ✗ Invalid
 * ```
 *
 * @returns A property decorator function for file type validation.
 *
 * @public
 */
export const IsFileType = Validator.buildRuleDecorator<
  ValidatorRuleParamTypes['FileType']
>(function FileType({
  value,
  ruleParams,
  fieldName,
  translatedPropertyName,
  i18n,
  ...rest
}: ValidatorValidateOptions<string[]>): ValidatorResult {
  if (!isFileLike(value)) {
    const message = i18n.t('validator.fileType', {
      field: translatedPropertyName || fieldName,
      value,
      allowedTypes: ruleParams?.join(', ') || '',
      ...rest,
    });
    return message;
  }

  if (!ruleParams || ruleParams.length === 0) {
    const message = i18n.t('validator.invalidRuleParams', {
      rule: 'FileType',
      field: translatedPropertyName || fieldName,
      ruleParams,
      ...rest,
    });
    return message;
  }

  const fileType = value.type || value.mimetype || '';
  const allowedTypes = ruleParams.map((type) => type.toLowerCase());
  const actualType = fileType.toLowerCase();

  if (
    allowedTypes.some(
      (type) => actualType === type || actualType.startsWith(type + '/')
    )
  ) {
    return true;
  } else {
    const message = i18n.t('validator.fileType', {
      field: translatedPropertyName || fieldName,
      value,
      allowedTypes: ruleParams.join(', '),
      actualType: fileType,
      ...rest,
    });
    return message;
  }
}, 'FileType');

/**
 * @summary A validation decorator that ensures a file is an image.
 * @description
 * Validates that the decorated file property has a MIME type that corresponds to a common
 * image format (JPEG, PNG, GIF, WebP, SVG, BMP). Useful for image upload validation.
 *
 * @example
 * ```typescript
 * class ProfilePicture {
 *   @IsImage()
 *   avatar: File;
 * }
 *
 * const profile = new ProfilePicture();
 * profile.avatar = new File(['content'], 'photo.jpg', { type: 'image/jpeg' }); // ✓ Valid
 * profile.avatar = new File(['content'], 'doc.pdf', { type: 'application/pdf' }); // ✗ Invalid
 * ```
 *
 * @returns A property decorator function for image file validation.
 *
 * @public
 */
export const IsImage = Validator.buildRuleDecorator<
  ValidatorRuleParamTypes['Image']
>(function Image({
  value,
  fieldName,
  translatedPropertyName,
  i18n,
  ...rest
}: ValidatorValidateOptions): ValidatorResult {
  if (!isFileLike(value)) {
    const message = i18n.t('validator.image', {
      field: translatedPropertyName || fieldName,
      value,
      ...rest,
    });
    return message;
  }

  const fileType = value.type || value.mimetype || '';
  const imageTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
    'image/bmp',
  ];

  if (imageTypes.some((type) => fileType.toLowerCase() === type)) {
    return true;
  } else {
    const message = i18n.t('validator.image', {
      field: translatedPropertyName || fieldName,
      value,
      actualType: fileType,
      ...rest,
    });
    return message;
  }
}, 'Image');

/**
 * @summary A validation decorator that ensures a file has an allowed extension.
 * @description
 * Validates that the decorated file property has a filename with an extension that matches
 * one of the specified allowed extensions. Extensions are compared case-insensitively and
 * automatically handle leading dots.
 *
 * @param allowedExtensions - Array of allowed file extensions without dots (e.g., ['pdf', 'doc']).
 *
 * @example
 * ```typescript
 * class DocumentUpload {
 *   @IsFileExtension('pdf', 'doc', 'docx')
 *   document: File;
 * }
 *
 * const upload = new DocumentUpload();
 * upload.document = new File(['content'], 'document.pdf'); // ✓ Valid
 * upload.document = new File(['content'], 'script.js'); // ✗ Invalid
 * ```
 *
 * @returns A property decorator function for file extension validation.
 *
 * @public
 */
export const IsFileExtension = Validator.buildRuleDecorator<
  ValidatorRuleParamTypes['FileExtension']
>(function FileExtension({
  value,
  ruleParams,
  fieldName,
  translatedPropertyName,
  i18n,
  ...rest
}: ValidatorValidateOptions<string[]>): ValidatorResult {
  if (!isFileLike(value)) {
    const message = i18n.t('validator.fileExtension', {
      field: translatedPropertyName || fieldName,
      value,
      allowedExtensions: ruleParams?.join(', ') || '',
      ...rest,
    });
    return message;
  }

  if (!ruleParams || ruleParams.length === 0) {
    const message = i18n.t('validator.invalidRuleParams', {
      rule: 'FileExtension',
      field: translatedPropertyName || fieldName,
      ruleParams,
      ...rest,
    });
    return message;
  }

  const fileName = value.name || value.originalname || '';
  const extension = fileName.split('.').pop()?.toLowerCase() || '';
  const allowedExtensions = ruleParams.map((ext) =>
    ext.toLowerCase().replace(/^\./, '')
  );

  if (allowedExtensions.includes(extension)) {
    return true;
  } else {
    const message = i18n.t('validator.fileExtension', {
      field: translatedPropertyName || fieldName,
      value,
      allowedExtensions: ruleParams.join(', '),
      actualExtension: extension,
      ...rest,
    });
    return message;
  }
}, 'FileExtension');

/**
 * @summary A validation decorator that ensures a file meets a minimum size requirement.
 * @description
 * Validates that the decorated file property has a size (in bytes) that is greater than or equal
 * to the specified minimum size. Useful for preventing empty or suspiciously small files.
 *
 * @param minSize - The minimum required file size in bytes.
 *
 * @example
 * ```typescript
 * class UploadForm {
 *   @MinFileSize(1024) // 1KB minimum
 *   document: File;
 * }
 *
 * const form = new UploadForm();
 * form.document = new File(['sufficient content'], 'file.txt'); // ✓ Valid (>= 1KB)
 * form.document = new File(['tiny'], 'empty.txt'); // ✗ Invalid (< 1KB)
 * ```
 *
 * @returns A property decorator function for minimum file size validation.
 *
 * @public
 */
export const MinFileSize = Validator.buildRuleDecorator<
  ValidatorRuleParamTypes['MinFileSize']
>(function MinFileSize({
  value,
  ruleParams,
  fieldName,
  translatedPropertyName,
  i18n,
  ...rest
}: ValidatorValidateOptions<[minSize: number]>): ValidatorResult {
  if (!isFileLike(value)) {
    const message = i18n.t('validator.minFileSize', {
      field: translatedPropertyName || fieldName,
      value,
      minSize: ruleParams?.[0] || 0,
      ...rest,
    });
    return message;
  }
  const minSize = ruleParams?.[0];
  if (typeof minSize !== 'number' || minSize < 0) {
    const message = i18n.t('validator.invalidRuleParams', {
      rule: 'MinFileSize',
      field: translatedPropertyName || fieldName,
      ruleParams,
      ...rest,
    });
    return message;
  }

  const fileSize = value.size || 0;
  if (fileSize >= minSize) {
    return true;
  } else {
    const message = i18n.t('validator.minFileSize', {
      field: translatedPropertyName || fieldName,
      value,
      minSize,
      actualSize: fileSize,
      ...rest,
    });
    return message;
  }
}, 'MinFileSize');

declare module '../types' {
  export interface ValidatorRuleParamTypes {
    /**
     * @summary Validates that the field contains a valid file object.
     * @description
     * Ensures the input represents a file-like object with valid properties:
     * - Size must be a non-negative number
     * - Type must be a non-empty string
     * - Name must be a non-empty string
     * Accepts both browser File objects and server-side file representations (e.g., Multer files with mimetype/originalname).
     *
     * @example
     * ```typescript
     * // Valid file objects
     * await Validator.validate({
     *   value: { name: 'test.txt', size: 1024, type: 'text/plain' },
     *   rules: ['File']
     * }); // ✓ Valid
     *
     * await Validator.validate({
     *   value: new File(['content'], 'test.txt'),
     *   rules: ['File']
     * }); // ✓ Valid
     *
     * // Invalid inputs
     * await Validator.validate({
     *   value: { name: '', size: 1024, type: 'text/plain' },
     *   rules: ['File']
     * }); // ✗ Invalid (empty name)
     *
     * await Validator.validate({
     *   value: 'not a file',
     *   rules: ['File']
     * }); // ✗ Invalid
     *
     * await Validator.validate({
     *   value: null,
     *   rules: ['File']
     * }); // ✗ Invalid
     * ```
     *
     * @public
     */
    File: ValidatorRuleParams<[]>;

    /**
     * @summary Validates that the file size does not exceed a maximum limit.
     * @description
     * Checks that the file's size in bytes is less than or equal to the specified maximum size.
     * Useful for preventing uploads that exceed storage or bandwidth limits.
     *
     * @param size - The maximum allowed file size in bytes.
     *
     * @example
     * ```typescript
     * // Valid examples (file size <= limit)
     * await Validator.validate({
     *   value: { name: 'small.txt', size: 1024, type: 'text/plain' },
     *   rules: [{MaxFileSize:[2048]}]
     * }); // ✓ Valid (1KB <= 2KB)
     *
     * // Invalid examples (file size > limit)
     * await Validator.validate({
     *   value: { name: 'large.txt', size: 5242880, type: 'text/plain' },
     *   rules: [{MaxFileSize:[2048]}]
     * }); // ✗ Invalid (5MB > 2KB)
     *
     * await Validator.validate({
     *   value: 'not a file',
     *   rules: [{MaxFileSize:[2048]}]
     * }); // ✗ Invalid (not a file)
     * ```
     *
     * @public
     */
    MaxFileSize: ValidatorRuleParams<[size: number]>;

    /**
     * @summary Validates that the file has an allowed MIME type.
     * @description
     * Checks that the file's MIME type matches one of the specified allowed types.
     * Supports exact matches and wildcard patterns for broader type categories.
     *
     * @param allowedTypes - Array of allowed MIME types (e.g., ['image/jpeg', 'application/pdf']).
     *
     * @example
     * ```typescript
     * // Valid examples (matching MIME types)
     * await Validator.validate({
     *   value: { name: 'photo.jpg', size: 1024, type: 'image/jpeg' },
     *   rules: [{'FileType:["image/jpeg","image/png"]}]
     * }); // ✓ Valid
     *
     * await Validator.validate({
     *   value: { name: 'doc.pdf', size: 1024, type: 'application/pdf' },
     *   rules: [{FileType:['application/pdf']}]
     * }); // ✓ Valid
     *
     * // Invalid examples (non-matching types)
     * await Validator.validate({
     *   value: { name: 'script.js', size: 1024, type: 'application/javascript' },
     *   rules: [{FileType:["image/jpeg","image/png"]}]
     * }); // ✗ Invalid
     * ```
     *
     * @public
     */
    FileType: ValidatorRuleParams<string[]>;

    /**
     * @summary Validates that the file is an image based on MIME type.
     * @description
     * Checks that the file's MIME type corresponds to a supported image format.
     * Supports common image types including JPEG, PNG, GIF, WebP, SVG, and BMP.
     *
     * @example
     * ```typescript
     * // Valid examples (image MIME types)
     * await Validator.validate({
     *   value: { name: 'photo.jpg', size: 1024, type: 'image/jpeg' },
     *   rules: ['Image']
     * }); // ✓ Valid
     *
     * await Validator.validate({
     *   value: { name: 'pic.png', size: 1024, type: 'image/png' },
     *   rules: ['Image']
     * }); // ✓ Valid
     *
     * // Invalid examples (non-image types)
     * await Validator.validate({
     *   value: { name: 'doc.pdf', size: 1024, type: 'application/pdf' },
     *   rules: ['Image']
     * }); // ✗ Invalid
     *
     * await Validator.validate({
     *   value: 'not a file',
     *   rules: ['Image']
     * }); // ✗ Invalid
     * ```
     *
     * @public
     */
    Image: ValidatorRuleParams<[]>;

    /**
     * @summary Validates that the file has an allowed extension.
     * @description
     * Checks that the file's name ends with one of the specified extensions.
     * Extensions are compared case-insensitively and leading dots are handled automatically.
     *
     * @param allowedExtensions - Array of allowed file extensions without dots (e.g., ['pdf', 'jpg']).
     *
     * @example
     * ```typescript
     * // Valid examples (matching extensions)
     * await Validator.validate({
     *   value: { name: 'document.pdf', size: 1024, type: 'application/pdf' },
     *   rules: [{FileExtension:["pdf","doc","docx"]}]
     * }); // ✓ Valid
     *
     * await Validator.validate({
     *   value: { name: 'script.JS', size: 1024, type: 'application/javascript' },
     *   rules: ['FileExtension[js,ts]']
     * }); // ✓ Valid (case-insensitive)
     *
     * // Invalid examples (non-matching extensions)
     * await Validator.validate({
     *   value: { name: 'image.exe', size: 1024, type: 'application/octet-stream' },
     *   rules: [{FileExtension:["pdf","doc","docx"]}]
     * }); // ✗ Invalid
     * ```
     *
     * @public
     */
    FileExtension: ValidatorRuleParams<string[]>;

    /**
     * @summary Validates that the file size meets a minimum requirement.
     * @description
     * Checks that the file's size in bytes is greater than or equal to the specified minimum size.
     * Useful for ensuring files are not empty or suspiciously small.
     *
     * @param minSize - The minimum required file size in bytes.
     *
     * @example
     * ```typescript
     * // Valid examples (file size >= minimum)
     * await Validator.validate({
     *   value: { name: 'file.txt', size: 2048, type: 'text/plain' },
     *   rules: [{MinFileSize:[1024]}]
     * }); // ✓ Valid (2KB >= 1KB)
     *
     * // Invalid examples (file size < minimum)
     * await Validator.validate({
     *   value: { name: 'small.txt', size: 512, type: 'text/plain' },
     *   rules: [{MinFileSize:[1024]}]
     * }); // ✗ Invalid (512B < 1KB)
     *
     * await Validator.validate({
     *   value: 'not a file',
     *   rules: [{MinFileSize:[1024]}]
     * }); // ✗ Invalid (not a file)
     * ```
     *
     * @public
     */
    MinFileSize: ValidatorRuleParams<[minSize: number]>;
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function isFileLike(value: any): value is FileLike {
  try {
    if (typeof File !== 'undefined' && File && value instanceof File) {
      return true;
    }
    // eslint-disable-next-line no-empty
  } catch {}

  if (!value || typeof value !== 'object') return false;

  // Count how many file-like properties are present
  let score = 0;
  if (isNumber(value.size) && value.size >= 0) score++;
  if (isNonNullString(value.type) || isNonNullString(value.mimetype)) score++;
  if (isNonNullString(value.name) || isNonNullString(value.originalname))
    score++;

  // Require at least 3 out of 3 core properties for strict validation
  return score >= 3;
}

// Type definitions for file objects
interface FileLike {
  size?: number;
  type?: string;
  name?: string;
  mimetype?: string; // Alternative property name
  originalname?: string; // Multer property
}
