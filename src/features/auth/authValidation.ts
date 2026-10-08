export type AuthMode = "login" | "register";
export type AuthField = "name" | "phone" | "password";
export type AuthFieldErrors = Partial<Record<AuthField, string>>;

const phoneCharacters = /^\+?[\d\s().-]+$/;
const letter = /[A-Za-z]/;
const digit = /\d/;

export function normalizePhone(value: string) {
  return value.replace(/\D/g, "");
}

export function validatePhone(value: string) {
  const trimmed = value.trim();
  const normalized = normalizePhone(trimmed);
  if (!trimmed) return "Enter your phone number.";
  if (
    !phoneCharacters.test(trimmed) ||
    normalized.length < 8 ||
    normalized.length > 15
  ) {
    return "Enter a valid phone number with 8 to 15 digits.";
  }
  return undefined;
}

export function validatePassword(value: string, mode: AuthMode) {
  if (!value) return "Enter your password.";
  if (value.length < 6) return "Password must be at least 6 characters.";
  if (value.length > 128) return "Password must be 128 characters or fewer.";
  if (mode === "register" && (!letter.test(value) || !digit.test(value))) {
    return "Use at least 8 characters, including a letter and a number.";
  }
  if (mode === "register" && value.length < 8) {
    return "Use at least 8 characters, including a letter and a number.";
  }
  return undefined;
}

export function validateAuthInput(
  mode: AuthMode,
  input: { name: string; phone: string; password: string },
): AuthFieldErrors {
  const errors: AuthFieldErrors = {};
  if (mode === "register") {
    if (!input.name.trim()) errors.name = "Enter your name.";
    else if (input.name.trim().length < 2)
      errors.name = "Name must be at least 2 characters.";
    else if (input.name.trim().length > 60)
      errors.name = "Name must be 60 characters or fewer.";
  }
  const phoneError = validatePhone(input.phone);
  const passwordError = validatePassword(input.password, mode);
  if (phoneError) errors.phone = phoneError;
  if (passwordError) errors.password = passwordError;
  return errors;
}
