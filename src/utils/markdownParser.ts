/**
 * Utility functions for parsing markdown content into structured data
 */

/**
 * Extract a markdown table from content
 * @param content - Full markdown content
 * @param headerPattern - Regex or string to identify the table header
 * @returns Array of objects representing table rows
 */
export function extractMarkdownTable(
  content: string,
  headerPattern: string | RegExp
): Record<string, string>[] {
  const lines = content.split('\n');
  let tableStartIndex = -1;

  // Find the table header
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (
      typeof headerPattern === 'string'
        ? line.includes(headerPattern)
        : headerPattern.test(line)
    ) {
      tableStartIndex = i;
      break;
    }
  }

  if (tableStartIndex === -1) return [];

  // Parse header row
  const headerLine = lines[tableStartIndex];
  const headers = headerLine
    .split('|')
    .map((h) => h.trim())
    .filter((h) => h.length > 0);

  // Skip separator line (---|---|---)
  const dataStartIndex = tableStartIndex + 2;

  // Parse data rows
  const rows: Record<string, string>[] = [];
  for (let i = dataStartIndex; i < lines.length; i++) {
    const line = lines[i].trim();

    // Stop if we hit an empty line, heading, or horizontal rule
    if (!line || line.startsWith('#') || line.startsWith('---')) {
      break;
    }

    // Stop if not a table row
    if (!line.startsWith('|')) {
      break;
    }

    const values = line
      .split('|')
      .map((v) => v.trim())
      .filter((_, idx, arr) => idx > 0 && idx < arr.length - 1); // Remove empty first/last

    if (values.length === 0) continue;

    const row: Record<string, string> = {};
    headers.forEach((header, idx) => {
      row[header] = values[idx] || '';
    });

    rows.push(row);
  }

  return rows;
}

/**
 * Extract a section of content between two headings
 * @param content - Full markdown content
 * @param startHeading - Heading to start extraction (e.g., "## Players")
 * @param endHeading - Optional heading to end extraction
 * @returns Content between the headings
 */
export function extractSection(
  content: string,
  startHeading: string,
  endHeading?: string
): string {
  const lines = content.split('\n');
  let startIndex = -1;
  let endIndex = lines.length;

  // Find start
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim() === startHeading) {
      startIndex = i + 1;
      break;
    }
  }

  if (startIndex === -1) return '';

  // Find end
  if (endHeading) {
    for (let i = startIndex; i < lines.length; i++) {
      if (lines[i].trim() === endHeading) {
        endIndex = i;
        break;
      }
    }
  }

  return lines.slice(startIndex, endIndex).join('\n');
}

/**
 * Extract all checkboxes from content
 * @param content - Markdown content with checkboxes
 * @returns Array of {text, checked} objects
 */
export function extractCheckboxes(content: string): Array<{
  text: string;
  checked: boolean;
}> {
  const checkboxRegex = /^- \[([ x])\] (.+)$/gm;
  const checkboxes: Array<{ text: string; checked: boolean }> = [];

  let match;
  while ((match = checkboxRegex.exec(content)) !== null) {
    checkboxes.push({
      checked: match[1] === 'x',
      text: match[2],
    });
  }

  return checkboxes;
}

/**
 * Parse a markdown link
 * @param linkText - Markdown link like [text](url)
 * @returns {text, url} or null if not a link
 */
export function parseMarkdownLink(
  linkText: string
): { text: string; url: string } | null {
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/;
  const match = linkRegex.exec(linkText);

  if (!match) return null;

  return {
    text: match[1],
    url: match[2],
  };
}

/**
 * Clean markdown formatting from text (bold, italic, links, etc.)
 * @param text - Text with markdown formatting
 * @returns Plain text
 */
export function stripMarkdown(text: string): string {
  return text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Links
    .replace(/\*\*([^*]+)\*\*/g, '$1') // Bold
    .replace(/\*([^*]+)\*/g, '$1') // Italic
    .replace(/_([^_]+)_/g, '$1') // Italic underscore
    .replace(/`([^`]+)`/g, '$1') // Code
    .trim();
}
