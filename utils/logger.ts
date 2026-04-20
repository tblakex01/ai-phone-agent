
/**
 * Secure logging utility to prevent leakage of sensitive information.
 */

// Keys that likely contain sensitive data.
// We match these by checking if the key *contains* these strings, but we should be careful about false positives.
// Refined list to avoid things like "keyboard" or "publicKey" triggering "key".
const SENSITIVE_PATTERNS = [
  /api[-_]?key/i,
  /auth(orization)?/i,
  /pass(word|phrase)?/i,
  /secret/i,
  /token/i,
  /credential/i,
  /private[-_]?key/i,
];

// Patterns for sensitive values that might appear in strings (e.g. error messages)
const SENSITIVE_VALUE_PATTERNS = [
  /AIza[0-9A-Za-z\-_]{35}/g, // Google API Key
];

const isSensitiveKey = (key: string): boolean => {
  return SENSITIVE_PATTERNS.some(pattern => pattern.test(key));
};

const sanitizeString = (str: string): string => {
  let sanitized = str;
  SENSITIVE_VALUE_PATTERNS.forEach(pattern => {
    sanitized = sanitized.replace(pattern, '***REDACTED***');
  });
  return sanitized;
};

const sanitize = (data: any, seen = new WeakSet()): any => {
  if (data === null || data === undefined) {
    return data;
  }

  if (typeof data === 'string') {
    return sanitizeString(data);
  }

  if (typeof data === 'function' || typeof data === 'symbol') {
      return data.toString();
  }

  if (typeof data === 'object') {
    if (seen.has(data)) {
        return '[Circular]';
    }
    seen.add(data);

    if (Array.isArray(data)) {
      return data.map(item => sanitize(item, seen));
    }

    // Handle Error objects
    if (data instanceof Error) {
        const errorObj: Record<string, any> = {
            message: sanitizeString(data.message), // Ensure message is also sanitized for values
            name: data.name,
            stack: data.stack,
        };
        for (const key of Object.getOwnPropertyNames(data)) {
            if (!['message', 'name', 'stack'].includes(key)) {
                if (isSensitiveKey(key)) {
                    errorObj[key] = '***REDACTED***';
                } else {
                    errorObj[key] = sanitize((data as any)[key], seen);
                }
            }
        }
        return errorObj;
    }

    // Handle DOM Events or other complex objects that might be huge
    // Just a simple check for common DOM properties to avoid traversing entire DOM
    if (typeof (data as any).preventDefault === 'function' && typeof (data as any).stopPropagation === 'function') {
         // It's likely an Event object. We probably just want the type and maybe target info?
         // But let's just sanitize what we can.
         // Actually, DOM nodes are circular hell.
    }

    const sanitized: Record<string, any> = {};
    for (const key in data) {
      if (Object.prototype.hasOwnProperty.call(data, key)) {
        if (isSensitiveKey(key)) {
          sanitized[key] = '***REDACTED***';
        } else {
          sanitized[key] = sanitize(data[key], seen);
        }
      }
    }
    return sanitized;
  }

  return data;
};

export const logger = {
  log: (...args: any[]) => {
    console.log(...args.map(arg => sanitize(arg)));
  },
  error: (...args: any[]) => {
    console.error(...args.map(arg => sanitize(arg)));
  },
  warn: (...args: any[]) => {
    console.warn(...args.map(arg => sanitize(arg)));
  },
  info: (...args: any[]) => {
    console.info(...args.map(arg => sanitize(arg)));
  },
};
