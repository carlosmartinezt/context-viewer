// Google Drive API service
// Generic folder/file browser - NO PARSING, just raw content

const DRIVE_API_BASE = 'https://www.googleapis.com/drive/v3';
const STORAGE_KEY = 'context-viewer-user';
const ROOT_FOLDER_KEY = 'context-viewer-root-folder';

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

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime: string;
}

export interface DriveFolder {
  id: string;
  name: string;
}

// Get/set the selected root folder
export function getRootFolderId(): string | null {
  return localStorage.getItem(ROOT_FOLDER_KEY);
}

export function setRootFolderId(folderId: string, folderName: string): void {
  localStorage.setItem(ROOT_FOLDER_KEY, folderId);
  localStorage.setItem(ROOT_FOLDER_KEY + '-name', folderName);
}

export function getRootFolderName(): string | null {
  return localStorage.getItem(ROOT_FOLDER_KEY + '-name');
}

export function clearRootFolder(): void {
  localStorage.removeItem(ROOT_FOLDER_KEY);
  localStorage.removeItem(ROOT_FOLDER_KEY + '-name');
}

// List subfolders in a folder
export async function listFolders(
  accessToken: string,
  parentFolderId: string
): Promise<DriveFolder[]> {
  const query = `'${parentFolderId}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;

  const response = await driveApiFetch(
    `${DRIVE_API_BASE}/files?q=${encodeURIComponent(query)}&fields=files(id,name)&orderBy=name`,
    accessToken
  );

  const data = await response.json();
  const folders = data.files || [];
  // Hide folders starting with a dot (e.g., .claude)
  return folders.filter((f: DriveFolder) => !f.name.startsWith('.'));
}

// List markdown files in a folder
export async function listMarkdownFiles(
  accessToken: string,
  folderId: string
): Promise<DriveFile[]> {
  const query = `'${folderId}' in parents and name contains '.md' and trashed = false`;

  const response = await driveApiFetch(
    `${DRIVE_API_BASE}/files?q=${encodeURIComponent(query)}&fields=files(id,name,mimeType,modifiedTime)&orderBy=name`,
    accessToken
  );

  const data = await response.json();
  return data.files || [];
}

// List all items (folders + files) in a folder
export async function listFolderContents(
  accessToken: string,
  folderId: string
): Promise<{ folders: DriveFolder[]; files: DriveFile[] }> {
  const [folders, files] = await Promise.all([
    listFolders(accessToken, folderId),
    listMarkdownFiles(accessToken, folderId),
  ]);

  return { folders, files };
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

// Read a file by name from a folder
export async function readFileByName(
  accessToken: string,
  folderId: string,
  fileName: string
): Promise<string> {
  const files = await listMarkdownFiles(accessToken, folderId);
  const file = files.find((f) => f.name === fileName);

  if (!file) {
    throw new Error(`${fileName} not found`);
  }

  return readFile(accessToken, file.id);
}

// Get folder metadata
export async function getFolder(
  accessToken: string,
  folderId: string
): Promise<DriveFolder> {
  const response = await driveApiFetch(
    `${DRIVE_API_BASE}/files/${folderId}?fields=id,name`,
    accessToken
  );

  return response.json();
}

// ========== LEGACY COMPATIBILITY (will be removed) ==========
// These are kept temporarily to avoid breaking existing code during migration

const CHESS_FOLDER_NAME = 'chess';

export const CHESS_FILES = [
  'chess.md',
  'coaches.md',
  'tournaments.md',
  'curriculum.md',
  'training.md',
] as const;

export type ChessFileName = typeof CHESS_FILES[number];

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

export async function listChessFiles(
  accessToken: string,
  folderId: string
): Promise<DriveFile[]> {
  return listMarkdownFiles(accessToken, folderId);
}

export async function readChessFile(
  accessToken: string,
  folderId: string,
  fileName: ChessFileName
): Promise<string> {
  return readFileByName(accessToken, folderId, fileName);
}
