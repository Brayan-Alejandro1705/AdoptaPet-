// src/middleware/validations/authValidations.js
const { body, validationResult } = require('express-validator');
const { AppError } = require('../errorHandler');

/**
 * Middleware para manejar errores de validación
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(err => err.msg);
    return next(new AppError(errorMessages.join('. '), 400));
  }
  
  next();
};

/**
 * Validaciones para Registro
 */
exports.registroValidation = [
  body('nombre')  // ← CAMBIADO de 'name' a 'nombre'
    .trim()
    .notEmpty().withMessage('El nombre es obligatorio')
    .isLength({ min: 2, max: 50 }).withMessage('El nombre debe tener entre 2 y 50 caracteres')
    .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/).withMessage('El nombre solo puede contener letras y espacios'),
  
  body('email')
    .trim()
    .notEmpty().withMessage('El email es obligatorio')
    .isEmail().withMessage('Debe ser un email válido')
    .normalizeEmail(),
  
  body('password')
    .notEmpty().withMessage('La contraseña es obligatoria')
    .isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres'),
  
  body('passwordConfirm')
    .notEmpty().withMessage('Debes confirmar la contraseña')
    .custom((value, { req }) => value === req.body.password)
    .withMessage('Las contraseñas no coinciden'),
  
  body('role')
    .optional()
    .isIn(['adopter', 'shelter', 'admin']).withMessage('Rol inválido'),
  
  body('telefono')  // ← CAMBIADO de 'phone' a 'telefono'
    .optional()
    .trim(),
  
  handleValidationErrors
];

/**
 * Validaciones para LOGIN
 */
exports.loginValidation = [
  body('email')
    .trim()
    .notEmpty().withMessage('El email es obligatorio')
    .isEmail().withMessage('Debe ser un email válido')
    .normalizeEmail(),
  
  body('password')
    .notEmpty().withMessage('La contraseña es obligatoria'),
  
  handleValidationErrors
];

/**
 * Validaciones para ACTUALIZAR PERFIL
 */
exports.updateProfileValidation = [
  body('nombre')  // ← CAMBIADO de 'name' a 'nombre'
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 }).withMessage('El nombre debe tener entre 2 y 50 caracteres')
    .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/).withMessage('El nombre solo puede contener letras'),
  
  body('telefono')  // ← CAMBIADO de 'phone' a 'telefono'
    .optional()
    .trim(),
  
  body('bio')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('La biografía no puede exceder 500 caracteres'),
  
  body('avatar')
    .optional()
    .isURL().withMessage('La URL del avatar no es válida'),
  
  body('email').not().exists().withMessage('No puedes actualizar el email desde esta ruta'),
  body('password').not().exists().withMessage('No puedes actualizar la contraseña desde esta ruta'),
  body('role').not().exists().withMessage('No puedes actualizar el rol desde esta ruta'),
  
  handleValidationErrors
];

/**
 * Validaciones para CAMBIAR CONTRASEÑA
 */
exports.changePasswordValidation = [
  body('currentPassword')
    .notEmpty().withMessage('La contraseña actual es obligatoria'),
  
  body('newPassword')
    .notEmpty().withMessage('La nueva contraseña es obligatoria')
    .isLength({ min: 6 }).withMessage('La nueva contraseña debe tener al menos 6 caracteres')
    .custom((value, { req }) => value !== req.body.currentPassword)
    .withMessage('La nueva contraseña debe ser diferente a la actual'),
  
  body('newPasswordConfirm')
    .notEmpty().withMessage('Debes confirmar la nueva contraseña')
    .custom((value, { req }) => value === req.body.newPassword)
    .withMessage('Las contraseñas no coinciden'),
  
  handleValidationErrors
];