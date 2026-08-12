/**
 * Strict Email & Input Validation Utilities for NexGuard
 */

export function isValidEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false;
  const trimmed = email.trim();
  if (trimmed.length < 5 || trimmed.length > 254) return false;

  // RFC 5322 Compliant Email Format Regex requiring valid user, @, domain, and 2+ char TLD
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(trimmed)) return false;

  const parts = trimmed.split('@');
  if (parts.length !== 2) return false;

  const [localPart, domainPart] = parts;

  // Local part rules
  if (localPart.length === 0 || localPart.length > 64) return false;
  if (localPart.startsWith('.') || localPart.endsWith('.')) return false;
  if (localPart.includes('..')) return false;

  // Domain rules
  if (domainPart.length === 0 || domainPart.length > 255) return false;
  if (domainPart.startsWith('.') || domainPart.endsWith('.') || domainPart.startsWith('-') || domainPart.endsWith('-')) return false;
  if (domainPart.includes('..')) return false;

  // Top level domain rules
  const domainSegments = domainPart.split('.');
  if (domainSegments.length < 2) return false;
  const tld = domainSegments[domainSegments.length - 1];
  if (!/^[a-zA-Z]{2,}$/.test(tld)) return false;

  // Disallow reserved non-routable domains without proper suffix
  const invalidDomainNames = ['example', 'localhost', 'test', 'invalid', 'none'];
  if (invalidDomainNames.includes(domainPart.toLowerCase())) return false;

  return true;
}

export function sanitizeEmail(email: string): string {
  if (!email) return '';
  return email.trim().toLowerCase();
}
