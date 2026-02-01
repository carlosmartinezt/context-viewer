// Google Drive API service
// Reads markdown files from the chess folder - NO PARSING, just raw content

const DRIVE_API_BASE = 'https://www.googleapis.com/drive/v3';
const STORAGE_KEY = 'chess-tracker-user';

// Wrapper that handles expired tokens
async function driveApiFetch(url: string, accessToken: string): Promise<Response> {
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (response.status === 401) {
    // Token expired - clear storage and reload to trigger login
    localStorage.removeItem(STORAGE_KEY);
    window.location.reload();
    throw new Error('Session expired. Please sign in again.');
  }

  return response;
}
const CHESS_FOLDER_NAME = 'chess';

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime: string;
}

// Chess file names
export const CHESS_FILES = [
  'chess.md',
  'coaches.md',
  'tournaments.md',
  'curriculum.md',
  'training.md',
] as const;

export type ChessFileName = typeof CHESS_FILES[number];

// Find the chess folder
export async function findChessFolder(accessToken: string): Promise<string | null> {
  const query = `name = '${CHESS_FOLDER_NAME}' and mimeType = 'application/vnd.google-apps.folder'`;

  const response = await driveApiFetch(
    `${DRIVE_API_BASE}/files?q=${encodeURIComponent(query)}&fields=files(id,name)`,
    accessToken
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
  // Note: Google Drive may store .md files as text/plain, not text/markdown
  const query = `'${folderId}' in parents and name contains '.md' and trashed = false`;

  const response = await driveApiFetch(
    `${DRIVE_API_BASE}/files?q=${encodeURIComponent(query)}&fields=files(id,name,mimeType,modifiedTime)`,
    accessToken
  );

  const data = await response.json();
  return data.files || [];
}

// Read a file's raw content
export async function readFile(
  accessToken: string,
  fileId: string
): Promise<string> {
  const response = await driveApiFetch(
    `${DRIVE_API_BASE}/files/${fileId}?alt=media`,
    accessToken
  );

  return response.text();
}

// Read a specific chess file by name
export async function readChessFile(
  accessToken: string,
  folderId: string,
  fileName: ChessFileName
): Promise<string> {
  const files = await listChessFiles(accessToken, folderId);
  const file = files.find((f) => f.name === fileName);

  if (!file) {
    throw new Error(`${fileName} not found`);
  }

  return readFile(accessToken, file.id);
}

// Read all chess files at once
export async function readAllChessFiles(
  accessToken: string,
  folderId: string
): Promise<Record<ChessFileName, string>> {
  const files = await listChessFiles(accessToken, folderId);

  const result: Partial<Record<ChessFileName, string>> = {};

  await Promise.all(
    CHESS_FILES.map(async (fileName) => {
      const file = files.find((f) => f.name === fileName);
      if (file) {
        result[fileName] = await readFile(accessToken, file.id);
      }
    })
  );

  return result as Record<ChessFileName, string>;
}
