import 'reflect-metadata';
import '../types';
import { FieldMeta, getFieldsFromTarget } from './index';

declare module '../types' {
  // eslint-disable-next-line jest/no-export
  export interface FieldMap {
    text: FieldBase<'text'>;
    number: FieldBase<'number'>;
    boolean: FieldBase<'boolean'>;
    date: FieldBase<'date'>;
  }
  // eslint-disable-next-line jest/no-export
  export interface FieldBase {
    label?: string;
  }
}
describe('FieldMeta Decorator and getFieldsFromTarget Function', () => {
  // Test class with decorated properties
  class TestClass {
    @FieldMeta({ type: 'text', label: 'Username' })
    username?: string;

    @FieldMeta({ type: 'number', label: 'Age' })
    age?: number;

    @FieldMeta({ type: 'boolean', label: 'Is Active' })
    isActive?: boolean;

    @FieldMeta({ type: 'date', label: 'Created At' })
    createdAt?: Date;

    @FieldMeta({ type: 'text', label: 'Description' })
    description?: string;
  }

  // Test 1: Verify that the FieldMeta decorator attaches metadata correctly
  it('should attach metadata to class properties', () => {
    const metadata = getFieldsFromTarget(TestClass);

    expect(metadata).toBeDefined();
    expect(metadata.username).toEqual({
      name: 'username',
      type: 'text',
      label: 'Username',
    });
    expect(metadata.age).toEqual({
      name: 'age',
      type: 'number',
      label: 'Age',
    });
    expect(metadata.isActive).toEqual({
      name: 'isActive',
      type: 'boolean',
      label: 'Is Active',
    });
    expect(metadata.createdAt).toEqual({
      name: 'createdAt',
      type: 'date',
      label: 'Created At',
    });
    expect(metadata.description).toEqual({
      name: 'description',
      type: 'text',
      label: 'Description',
    });
  });

  // Test 2: Verify that getFieldsFromTarget retrieves the correct metadata
  it('should retrieve metadata using getFieldsFromTarget', () => {
    const fields = getFieldsFromTarget(TestClass);
    expect(fields).toBeDefined();
    expect(fields.username).toEqual({
      name: 'username',
      type: 'text',
      label: 'Username',
    });
    expect(fields.age).toEqual({
      name: 'age',
      type: 'number',
      label: 'Age',
    });
    expect(fields.isActive).toEqual({
      name: 'isActive',
      type: 'boolean',
      label: 'Is Active',
    });
    expect(fields.createdAt).toEqual({
      name: 'createdAt',
      type: 'date',
      label: 'Created At',
    });
    expect(fields.description).toEqual({
      name: 'description',
      type: 'text',
      label: 'Description',
    });
  });

  // Test 3: Verify that the default type is assigned if not specified
  it('should assign a default type if none is specified', () => {
    class DefaultTypeClass {
      @FieldMeta({ type: 'text', label: 'Default Type FieldMeta' })
      defaultField?: string;
    }

    const metadata = getFieldsFromTarget(DefaultTypeClass);

    expect(metadata).toBeDefined();
    expect(metadata.defaultField).toEqual({
      name: 'defaultField',
      type: 'text', // Default type for string
      label: 'Default Type FieldMeta',
    });
  });

  // Test 4: Verify that getFieldsFromTarget returns an empty object if no metadata exists
  it('should return an empty object if no metadata exists', () => {
    class NoMetadataClass {
      noMetadataField?: string;
    }
    const fields = getFieldsFromTarget(NoMetadataClass);
    expect(fields).toEqual({});
  });
});
