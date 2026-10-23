/**
 * Capitalizes the first letter of a string
 * @param str - The string to capitalize
 * @returns The string with the first letter capitalized
 */
export const capitalize = (str: string): string => {
  return str.charAt(0).toUpperCase() + str.slice(1);
};

/**
 * Generates a cryptographically secure random password
 * @param length - The length of the password (default: 16)
 * @param options - Options for password generation
 * @returns A randomly generated password
 */
export const generatePassword = (
  length: number = 16,
  options: {
    includeUppercase?: boolean;
    includeLowercase?: boolean;
    includeNumbers?: boolean;
    includeSymbols?: boolean;
  } = {}
): string => {
  const {
    includeUppercase = true,
    includeLowercase = true,
    includeNumbers = true,
    includeSymbols = true,
  } = options;

  const sets = [
    includeLowercase && "abcdefghijklmnopqrstuvwxyz",
    includeUppercase && "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
    includeNumbers && "0123456789",
    includeSymbols && "!@#$%^&*",
  ].filter((set): set is string => !!set);

  if (sets.length === 0) {
    throw new Error("At least one character type must be included");
  }

  const charset = sets.join("");
  const random = new Uint32Array(Math.max(length, sets.length) * 2);
  crypto.getRandomValues(random);

  // One character from every selected set, so the result always satisfies the password policy.
  const chars = sets.map((set, i) => set[random[i] % set.length]);
  for (let i = chars.length; i < Math.max(length, sets.length); i++) {
    chars.push(charset[random[i] % charset.length]);
  }

  for (let i = chars.length - 1; i > 0; i--) {
    const j = random[chars.length + i] % (i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }

  return chars.join("");
};

/**
 * Generates a random UUID v4. Unlike crypto.randomUUID(), crypto.getRandomValues() also works
 * on plain-http pages (e.g. the app opened over ZeroTier), not only on https or localhost.
 * @returns A UUID string such as "3f2a9c1e-5b7d-4e8a-9c0f-1a2b3c4d5e6f"
 */
export const generateUuid = (): string => {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");

  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
};

/**
 * Generates a random alphanumeric ID
 * @returns A random string of 13 alphanumeric characters
 */
export const generateRandomId = (): string => {
  return Math.random().toString(36).substring(2, 15);
};
