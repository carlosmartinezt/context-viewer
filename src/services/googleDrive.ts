// Google Drive API service
// Reads and writes markdown files from the chess folder

const DRIVE_API_BASE = 'https://www.googleapis.com/drive/v3';

// The folder path in Google Drive
// This will be configured to match: ~/gdrive/02_areas/chess/
const CHESS_FOLDER_NAME = 'chess';

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime: string;
}

// Find the chess folder by navigating the path
export async function findChessFolder(accessToken: string): Promise<string | null> {
  // Search for the chess folder
  // In a real implementation, you'd navigate: claude > 02_areas > chess
  const query = `name = '${CHESS_FOLDER_NAME}' and mimeType = 'application/vnd.google-apps.folder'`;

  const response = await fetch(
    `${DRIVE_API_BASE}/files?q=${encodeURIComponent(query)}&fields=files(id,name)`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  const data = await response.json();

  if (data.files && data.files.length > 0) {
    return data.files[0].id;
  }

  return null;
}

// List all markdown files in the chess folder
export async function listChessFiles(
  accessToken: string,
  folderId: string
): Promise<DriveFile[]> {
  // Note: Google Drive may store .md files as text/plain or text/x-markdown, not text/markdown
  // Use name filter instead of mimeType for reliability
  const query = `'${folderId}' in parents and name contains '.md' and trashed = false`;

  const response = await fetch(
    `${DRIVE_API_BASE}/files?q=${encodeURIComponent(query)}&fields=files(id,name,mimeType,modifiedTime)`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  const data = await response.json();
  return data.files || [];
}

// Read a file's content
export async function readFile(
  accessToken: string,
  fileId: string
): Promise<string> {
  const response = await fetch(
    `${DRIVE_API_BASE}/files/${fileId}?alt=media`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  return response.text();
}

// Update a file's content
export async function updateFile(
  accessToken: string,
  fileId: string,
  content: string
): Promise<void> {
  await fetch(
    `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`,
    {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'text/markdown',
      },
      body: content,
    }
  );
}

// Create a new file in the chess folder
export async function createFile(
  accessToken: string,
  folderId: string,
  name: string,
  content: string
): Promise<DriveFile> {
  // First, create the file metadata
  const metadata = {
    name,
    parents: [folderId],
    mimeType: 'text/markdown',
  };

  const form = new FormData();
  form.append(
    'metadata',
    new Blob([JSON.stringify(metadata)], { type: 'application/json' })
  );
  form.append('file', new Blob([content], { type: 'text/markdown' }));

  const response = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,mimeType,modifiedTime',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: form,
    }
  );

  return response.json();
}

// Chess file names and their purposes
export const CHESS_FILES = {
  'chess.md': 'Overview, player ratings, goals',
  'curriculum.md': 'Topics, openings, tactics to learn',
  'training.md': 'Weekly schedule, puzzles, practice',
  'coaches.md': 'Coach info, lesson schedules',
  'tournaments.md': 'Tournament calendar, travel, results',
} as const;

export type ChessFileName = keyof typeof CHESS_FILES;

// Import parsers
import {
  parseChessFile,
  parseCoachesFile,
  parseTournamentsFile,
  parseCurriculumFile,
  type ChessData,
  type CoachesData,
  type TournamentsData,
  type CurriculumData,
} from './parsers';

/**
 * Fetch and parse chess.md
 */
export async function fetchChessData(accessToken: string, folderId: string): Promise<ChessData> {
  const files = await listChessFiles(accessToken, folderId);
  const chessFile = files.find((f) => f.name === 'chess.md');

  if (!chessFile) {
    throw new Error('chess.md not found');
  }

  const content = await readFile(accessToken, chessFile.id);
  return parseChessFile(content);
}

/**
 * Fetch and parse coaches.md
 */
export async function fetchCoachesData(accessToken: string, folderId: string): Promise<CoachesData> {
  const files = await listChessFiles(accessToken, folderId);
  const coachesFile = files.find((f) => f.name === 'coaches.md');

  if (!coachesFile) {
    throw new Error('coaches.md not found');
  }

  const content = await readFile(accessToken, coachesFile.id);
  return parseCoachesFile(content);
}

/**
 * Fetch and parse tournaments.md
 */
export async function fetchTournamentsData(
  accessToken: string,
  folderId: string
): Promise<TournamentsData> {
  const files = await listChessFiles(accessToken, folderId);
  const tournamentsFile = files.find((f) => f.name === 'tournaments.md');

  if (!tournamentsFile) {
    throw new Error('tournaments.md not found');
  }

  const content = await readFile(accessToken, tournamentsFile.id);
  return parseTournamentsFile(content);
}

/**
 * Fetch and parse curriculum.md
 */
export async function fetchCurriculumData(
  accessToken: string,
  folderId: string
): Promise<CurriculumData> {
  const files = await listChessFiles(accessToken, folderId);
  const curriculumFile = files.find((f) => f.name === 'curriculum.md');

  if (!curriculumFile) {
    throw new Error('curriculum.md not found');
  }

  const content = await readFile(accessToken, curriculumFile.id);
  return parseCurriculumFile(content);
}

// Parse chess.md markdown content to extract player data
export function parseChessMd(content: string): import('../types').Player[] {
  const players: import('../types').Player[] = [];

  // Split content into sections by ## headers (player names)
  const sections = content.split(/^## /m).filter(s => s.trim());

  for (const section of sections) {
    const lines = section.split('\n');
    const name = lines[0].trim();

    if (!name) continue;

    const player: Partial<import('../types').Player> = {
      name,
      currentRating: 0,
      age: 0,
    };

    // Parse each line looking for key-value pairs
    for (const line of lines.slice(1)) {
      const trimmed = line.trim();
      if (!trimmed.startsWith('-')) continue;

      const content = trimmed.substring(1).trim();
      const [key, ...valueParts] = content.split(':');
      const value = valueParts.join(':').trim();

      const lowerKey = key.toLowerCase();

      if (lowerKey.includes('uscf id')) {
        player.uscfId = value;
      } else if (lowerKey.includes('age')) {
        player.age = parseInt(value) || 0;
      } else if (lowerKey.includes('current rating')) {
        player.currentRating = parseInt(value) || 0;
      } else if (lowerKey.includes('goal rating')) {
        player.goalRating = parseInt(value);
      } else if (lowerKey.includes('primary focus') || lowerKey.includes('focus')) {
        player.primaryFocus = value;
      } else if (lowerKey.includes('last rating update')) {
        player.lastRatingUpdate = value;
      }
    }

    // Only add player if we have minimum required fields
    if (player.name && player.age && player.currentRating) {
      players.push(player as import('../types').Player);
    }
  }

  return players;
}

// Serialize player data to chess.md markdown format
export function serializeChessMd(players: import('../types').Player[]): string {
  let markdown = '# Chess Players\n\n';

  for (const player of players) {
    markdown += `## ${player.name}\n\n`;

    if (player.uscfId) {
      markdown += `- USCF ID: ${player.uscfId}\n`;
    }
    markdown += `- Age: ${player.age}\n`;
    markdown += `- Current Rating: ${player.currentRating}\n`;

    if (player.goalRating) {
      markdown += `- Goal Rating: ${player.goalRating}\n`;
    }

    if (player.primaryFocus) {
      markdown += `- Primary Focus: ${player.primaryFocus}\n`;
    }

    if (player.lastRatingUpdate) {
      markdown += `- Last Rating Update: ${player.lastRatingUpdate}\n`;
    }

    markdown += '\n';
  }

  return markdown;
}
