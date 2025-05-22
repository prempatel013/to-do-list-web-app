/**
 * Sanitizes user input by removing potentially harmful characters and normalizing whitespace
 * @param input The user input to sanitize
 * @returns Sanitized input string
 */
export function sanitizeInput(input: string): string {
  // Remove HTML tags
  const withoutHtml = input.replace(/<[^>]*>/g, '');
  
  // Remove special characters that could be used for injection
  const withoutSpecialChars = withoutHtml.replace(/[<>{}[\]\\]/g, '');
  
  // Normalize whitespace (replace multiple spaces/tabs with single space)
  const normalized = withoutSpecialChars.replace(/\s+/g, ' ').trim();
  
  return normalized;
} 