import type { Tournament } from '../../types';
import { extractMarkdownTable, stripMarkdown } from '../../utils/markdownParser';

export interface TournamentsData {
  tournaments: Tournament[];
}

/**
 * Parse tournaments.md file content
 */
export function parseTournamentsFile(content: string): TournamentsData {
  const tournaments = parseTournaments(content);

  return {
    tournaments,
  };
}

function parseTournaments(content: string): Tournament[] {
  const tournaments: Tournament[] = [];

  // Parse "Weekend / Local" tournaments
  const localRows = extractMarkdownTable(content, '| Date | Tournament | Location | Players |');
  localRows.forEach((row) => {
    if (!row.Date || !row.Tournament) return;

    tournaments.push({
      id: `${row.Date}-${row.Tournament}`.toLowerCase().replace(/\s+/g, '-'),
      date: row.Date,
      name: row.Tournament,
      location: row.Location || '',
      city: row.Location || '',
      players: parsePlayersList(row.Players),
      type: 'local',
      status: parseStatus(row.Status),
      registrationDeadline: row.Registration || '',
    });
  });

  // Parse "National / Travel" tournaments
  const nationalRows = extractMarkdownTable(content, '| Date | Tournament | City | Players | Book Hotel By |');
  nationalRows.forEach((row) => {
    if (!row.Date || !row.Tournament) return;

    tournaments.push({
      id: `${row.Date}-${row.Tournament}`.toLowerCase().replace(/\s+/g, '-'),
      date: row.Date,
      name: row.Tournament,
      location: row.City || '',
      city: row.City || '',
      players: parsePlayersList(row.Players),
      type: 'national',
      status: parseStatus(row.Status),
      bookHotelBy: row['Book Hotel By'] || '',
    });
  });

  return tournaments.filter(t => t.date && t.name);
}

function parsePlayersList(playersStr: string): string[] {
  if (!playersStr) return [];
  return playersStr
    .split(',')
    .map((p) => stripMarkdown(p.trim()))
    .filter((p) => p.length > 0);
}

function parseStatus(statusStr: string): 'confirmed' | 'considering' | 'registered' {
  const lower = statusStr.toLowerCase();
  if (lower.includes('confirmed') || lower.includes('✅')) return 'confirmed';
  if (lower.includes('considering') || lower.includes('❓')) return 'considering';
  if (lower.includes('registered') || lower.includes('📝')) return 'registered';
  return 'considering';
}
