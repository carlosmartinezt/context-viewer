// Google Drive API service
// Reads and writes markdown files from the chess folder

const DRIVE_API_BASE = 'https://www.googleapis.com/drive/v3';

// The folder path in Google Drive
// This will be configured to match: ~/gdrive/claude/02_areas/chess/
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
  const query = `'${folderId}' in parents and mimeType = 'text/markdown' and trashed = false`;

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
