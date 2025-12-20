---
'reslib': patch
---

Fix validator error extraction in BaseException.getValidatorError() to correctly check error.cause instead of non-existent error.validatorError property. Add JSDoc annotations to ValidatorError interface for better documentation.
