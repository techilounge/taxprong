import { z } from "zod";

/**
 * Shared validation utilities for consistent input validation across the application
 * These schemas help prevent injection attacks and ensure data integrity
 */

// Common field validations
export const nameField = z
  .string()
  .trim()
  .min(1, "Name is required")
  .max(100, "Name must be less than 100 characters")
  .regex(/^[a-zA-Z0-9\s\-'.]+$/, "Name contains invalid characters");

export const emailField = z
  .string()
  .trim()
  .min(1, "Email is required")
  .email("Invalid email address")
  .max(255, "Email must be less than 255 characters")
  .toLowerCase();

export const phoneField = z
  .string()
  .trim()
  .regex(/^[+]?[\d\s\-()]+$/, "Invalid phone number format")
  .min(10, "Phone number must be at least 10 digits")
  .max(20, "Phone number must be less than 20 characters")
  .optional();

export const tinField = z
  .string()
  .trim()
  .regex(/^[\d\-]+$/, "TIN must contain only numbers and dashes")
  .min(8, "TIN must be at least 8 characters")
  .max(20, "TIN must be less than 20 characters")
  .optional();

export const currencyField = (min: number = 0, max: number = 999999999999) =>
  z
    .string()
    .min(1, "Amount is required")
    .regex(/^\d+(\.\d{1,2})?$/, "Invalid amount format")
    .refine((val) => {
      const num = parseFloat(val);
      return !isNaN(num) && num >= min && num <= max;
    }, `Amount must be between ${min} and ${max}`);

export const percentageField = z
  .string()
  .regex(/^\d+(\.\d{1,2})?$/, "Invalid percentage format")
  .refine((val) => {
    const num = parseFloat(val);
    return !isNaN(num) && num >= 0 && num <= 100;
  }, "Percentage must be between 0 and 100")
  .optional();

export const textField = (maxLength: number = 500) =>
  z
    .string()
    .trim()
    .max(maxLength, `Text must be less than ${maxLength} characters`)
    .optional();

export const descriptionField = z
  .string()
  .trim()
  .max(1000, "Description must be less than 1000 characters")
  .optional();

export const dateField = z
  .string()
  .min(1, "Date is required")
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format")
  .refine((date) => {
    const parsed = new Date(date);
    return !isNaN(parsed.getTime());
  }, "Invalid date");

// Sanitization helpers
export function sanitizeHtml(input: string): string {
  // Remove any HTML tags
  return input.replace(/<[^>]*>/g, "");
}

export function sanitizeInput(input: string): string {
  // Remove potentially dangerous characters for SQL injection
  return input
    .replace(/[<>'"]/g, "")
    .trim();
}

// Password validation with strength requirements
export const strongPasswordField = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(100, "Password must be less than 100 characters")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[0-9]/, "Password must contain at least one number")
  .regex(/[!@#$%^&*(),.?":{}|<>]/, "Password must contain at least one special character");

// URL validation
export const urlField = z
  .string()
  .url("Invalid URL format")
  .max(2000, "URL must be less than 2000 characters")
  .optional();
