export type ValidationRule = {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: RegExp;
  patternMessage?: string;
  custom?: (value: unknown) => string | null;
};

export type ValidationSchema = Record<string, ValidationRule>;

export type ValidationErrors = Record<string, string>;

export function validate(data: Record<string, unknown>, schema: ValidationSchema): ValidationErrors {
  const errors: ValidationErrors = {};

  for (const [field, rules] of Object.entries(schema)) {
    const value = data[field];

    if (rules.required && (value === undefined || value === null || value === "")) {
      errors[field] = `${field.charAt(0).toUpperCase() + field.slice(1)} is required`;
      continue;
    }

    if (value === undefined || value === null || value === "") continue;

    const strVal = String(value);
    const numVal = typeof value === "number" ? value : Number(value);

    if (rules.minLength !== undefined && strVal.length < rules.minLength) {
      errors[field] = `Must be at least ${rules.minLength} characters`;
    }

    if (rules.maxLength !== undefined && strVal.length > rules.maxLength) {
      errors[field] = `Must be no more than ${rules.maxLength} characters`;
    }

    if (rules.min !== undefined && !isNaN(numVal) && numVal < rules.min) {
      errors[field] = `Must be at least ${rules.min}`;
    }

    if (rules.max !== undefined && !isNaN(numVal) && numVal > rules.max) {
      errors[field] = `Must be no more than ${rules.max}`;
    }

    if (rules.pattern && !rules.pattern.test(strVal)) {
      errors[field] = rules.patternMessage ?? "Invalid format";
    }

    if (rules.custom) {
      const customError = rules.custom(value);
      if (customError) errors[field] = customError;
    }
  }

  return errors;
}

export function hasErrors(errors: ValidationErrors): boolean {
  return Object.keys(errors).length > 0;
}
