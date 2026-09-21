/**
 * Email Validation Utility
 * Client & Server Email Format, Domain & Disposable filtering logic
 */

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,24}$/;

const BLOCKED_USERNAMES = new Set([
  "test",
  "testing",
  "admin",
  "administrator",
  "fake",
  "dummy",
  "asdf",
  "qwerty",
  "abcd",
  "1234",
  "12345",
  "123456",
  "sample",
  "user",
  "noemail",
  "null",
  "undefined",
  "temp",
  "trash",
  "spam",
  "noreply",
  "example",
  "aaa",
  "bbb",
  "ccc",
  "xxx",
  "yyy",
  "zzz",
  "foo",
  "bar",
  "foobar",
]);

const BLOCKED_DOMAINS = new Set([
  "test.com",
  "test.org",
  "test.net",
  "example.com",
  "example.org",
  "example.net",
  "sample.com",
  "foo.com",
  "bar.com",
  "domain.com",
  "email.com",
  "asdf.com",
  "qwerty.com",
  "fake.com",
  "temp.com",
  "dummy.com",
  "invalid.com",
  "mydomain.com",
  "site.com",
  "abc.com",
  "xyz.com",
  "aaa.com",
  "bbb.com",
  "xxx.com",
]);

const DISPOSABLE_DOMAINS = new Set([
  "tempmail.com",
  "temp-mail.org",
  "mailinator.com",
  "10minutemail.com",
  "dispostable.com",
  "yopmail.com",
  "ex.com", // Added by request to block test emails
  "e1x.com", // User's previous fake domains
  "ex11.com",
  "trashmail.com",
  "guerrillamail.com",
  "sharklasers.com",
  "getnada.com",
  "crazymailing.com",
  "throwawaymail.com",
  "maildrop.cc",
  "fakemailgenerator.com",
  "inboxalias.com",
  "mohmal.com",
  "disposablemail.com",
  "mailnesia.com",
  "dropmail.me",
  "generator.email",
  "emailondeck.com",
  "trashmail.net",
  "tempmail.net",
  "burnermail.io",
  "guerrillamailblock.com",
  "guerrillamail.net",
  "guerrillamail.org",
  "grr.la",
  "guerrillamail.biz",
  "anonymbox.com",
  "boximail.com",
  "deadaddress.com",
  "mytemp.email",
  "mytrashmail.com",
  "tmpmail.org",
  "tmpmail.net",
  "ijkj.com",
]);

const BLOCKED_TLDS = new Set([
  "test",
  "example",
  "invalid",
  "localhost",
  "local",
  "fake",
  "temp",
  "xxx",
  "internal",
]);

export interface EmailValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Format and pattern validator for email strings
 */
export function validateEmailFormat(email: string): EmailValidationResult {
  const trimmed = (email || "").trim().toLowerCase();

  if (!trimmed) {
    return { isValid: false, error: "Email address is required." };
  }

  if (!EMAIL_REGEX.test(trimmed)) {
    return {
      isValid: false,
      error: "Please enter a valid email format (e.g., name@gmail.com).",
    };
  }

  const parts = trimmed.split("@");
  if (parts.length !== 2) {
    return { isValid: false, error: "Email address must contain exactly one '@' symbol." };
  }

  const [username, domain] = parts;

  if (username.length < 2) {
    return { isValid: false, error: "Email username is too short." };
  }
  if (username.length > 64) {
    return { isValid: false, error: "Email username is too long." };
  }

  if (BLOCKED_USERNAMES.has(username)) {
    return {
      isValid: false,
      error: "Please enter a real email address instead of a placeholder.",
    };
  }

  if (/^(.)\1+$/.test(username)) {
    return {
      isValid: false,
      error: "Please enter a valid email address.",
    };
  }

  if (/^[bcdfghjklmnpqrstvwxyz]{5,}$/.test(username)) {
    return {
      isValid: false,
      error: "Please enter a valid email address.",
    };
  }

  const domainParts = domain.split(".");
  const tld = domainParts[domainParts.length - 1];

  if (BLOCKED_TLDS.has(tld)) {
    return {
      isValid: false,
      error: `Invalid email domain extension (.${tld}).`,
    };
  }

  if (BLOCKED_DOMAINS.has(domain)) {
    return {
      isValid: false,
      error: "Please enter a real email address (test/placeholder domains are not allowed).",
    };
  }

  if (DISPOSABLE_DOMAINS.has(domain)) {
    return {
      isValid: false,
      error: "Temporary/disposable email domains are not allowed. Please use your real email.",
    };
  }

  return { isValid: true };
}

/**
 * Direct Verification API Integration (Abstract API / Hunter / ZeroBounce)
 */
export async function verifyEmailWithDirectApi(email: string): Promise<EmailValidationResult | null> {
  const apiKey = process.env.EMAIL_VERIFY_API_KEY;
  if (!apiKey) return null;

  try {
    const response = await fetch(
      `https://emailvalidation.abstractapi.com/v1/?api_key=${apiKey}&email=${encodeURIComponent(email)}`,
      { cache: "no-store" }
    );

    if (!response.ok) return null;

    const data = await response.json();
    if (data.deliverability === "UNDELIVERABLE" || data.is_smtp_valid?.value === false) {
      return {
        isValid: false,
        error: "This email mailbox does not exist or cannot receive messages.",
      };
    }

    if (data.is_disposable_email?.value === true) {
      return {
        isValid: false,
        error: "Disposable email addresses are not accepted.",
      };
    }

    return { isValid: true };
  } catch {
    return null;
  }
}
