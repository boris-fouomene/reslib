# Validator - Comprehensive Validation Library

[![npm version](https://img.shields.io/npm/v/reslib.svg)](https://www.npmjs.com/package/reslib)
[![License](https://img.shields.io/npm/l/reslib.svg)](https://github.com/your-org/reslib/blob/main/LICENSE)

A powerful, type-safe validation library with 67+ built-in rules and full TypeScript support.

---

## 🚀 Quick Start

### Installation

```bash
npm install reslib
```

### Basic Usage

```typescript
import { Validator } from 'reslib/validator';

// Validate a value
const result = await Validator.validate({
  value: 'user@example.com',
  rules: ['Required', 'Email'],
});

if (result.success) {
  console.log('✅ Valid email!');
} else {
  console.error('❌ Error:', result.message);
}
```

### Using Decorators

```typescript
import { IsRequired, IsEmail, MinLength } from 'reslib/validator';

class UserRegistration {
  @IsRequired()
  @IsEmail()
  email: string;

  @IsRequired()
  @MinLength(8)
  password: string;
}

const result = await Validator.validateClass(UserRegistration, {
  data: { email: 'user@example.com', password: 'password123' },
});

if (result.success) {
  console.log('✅ Registration valid');
} else {
  console.error('❌ Errors:', result.errors);
}
```

---

## 📚 Documentation

### **Complete documentation is in the [`docs/`](./docs) folder:**

- **[📖 User Guide](./docs/GUIDE.md)** - Complete walkthrough with examples
- **[⚡ Next.js Integration](./docs/NEXTJS_INTEGRATION.md)** - Modern Server Actions guide
- **[📋 Rules Reference](./docs/RULES.md)** - All 67 validation rules
- **[🔧 API Reference](./docs/API_REFERENCE.md)** - Detailed API documentation
- **[🗺️ Documentation Index](./docs/INDEX.md)** - Navigation guide

---

## ✨ Features

- ✅ **67+ Built-in Rules** - Email, URL, phone, dates, files, and more
- ✅ **Type-Safe** - Full TypeScript support
- ✅ **Decorator Support** - Clean, declarative validation
- ✅ **Async Validation** - Built-in async rule support
- ✅ **Custom Rules** - Easy to extend
- ✅ **i18n Ready** - Built-in internationalization
- ✅ **Nested Validation** - Complex object structures
- ✅ **Zero Dependencies** - Lightweight and fast

---

## 🎯 Common Examples

### Email Validation

```typescript
await Validator.validate({
  value: 'user@example.com',
  rules: ['Required', 'Email'],
});
```

### Password Strength

```typescript
class User {
  @AllOf(
    'IsString',
    { MinLength: [8] },
    { Matches: [/.*\d.*/] }, // Has number
    { Matches: [/.*[A-Z].*/] } // Has uppercase
  )
  password: string;
}
```

### File Upload

```typescript
class Upload {
  @IsRequired()
  @IsFile()
  @IsImage()
  @MaxFileSize(5 * 1024 * 1024) // 5MB
  avatar: File;
}
```

---

## 📖 Learn More

**[→ View Complete Documentation](./docs/INDEX.md)**

---

## 🤝 Contributing

Contributions are welcome! See [CONTRIBUTING.md](../../CONTRIBUTING.md)

## 📄 License

MIT License - see [LICENSE](../../LICENSE)

---

**Made with ❤️ by the reslib team**
