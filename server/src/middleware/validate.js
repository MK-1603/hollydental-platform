/**
 * Validation helper — wraps express-validator's validationResult so every
 * route that uses it gets the same consistent 422 error shape.
 *
 * Usage:
 *   import { validate } from '../middleware/validate.js';
 *   import { body } from 'express-validator';
 *
 *   router.post('/',
 *     body('email').isEmail().normalizeEmail(),
 *     body('name').trim().notEmpty(),
 *     validate,
 *     handler
 *   );
 */
import { validationResult } from "express-validator";

export function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      success: false,
      message: "Validation failed.",
      errors: errors.array().map((e) => ({
        field: e.path,
        message: e.msg,
        value: e.value,
      })),
    });
  }
  next();
}
