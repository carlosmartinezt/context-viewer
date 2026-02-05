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

// Get file metadata with parent folder
export async function getFileWithParent(
  accessToken: string,
  fileId: string
): Promise<{ id: string; name: string; parents?: string[] }> {
  const response = await driveApiFetch(
    `${DRIVE_API_BASE}/files/${fileId}?fields=id,name,parents`,
    accessToken
  );

  return response.json();
}

// Resolve a relative path from the root folder to a file or folder ID
// Path format: "02_areas/finances/subscriptions.md" or "01_projects/my_project"
export async function resolvePathFromRoot(
  accessToken: string,
  path: string
): Promise<{ type: 'file' | 'folder'; id: string } | null> {
  const rootFolderId = getRootFolderId();
  if (!rootFolderId) return null;

  // Clean the path: remove leading ./ and trailing /
  const cleanPath = path.replace(/^\.\//, '').replace(/\/$/, '');
  const segments = cleanPath.split('/').filter(Boolean);

  if (segments.length === 0) return null;

  let currentFolderId = rootFolderId;

  // Walk through each segment except the last
  for (let i = 0; i < segments.length - 1; i++) {
    const segment = segments[i];
    const folders = await listFolders(accessToken, currentFolderId);
    const matchingFolder = folders.find(
      (f) => f.name.toLowerCase() === segment.toLowerCase()
    );

    if (!matchingFolder) {
      return null; // Path segment not found
    }

    currentFolderId = matchingFolder.id;
  }

  // Handle the last segment - could be a file or folder
  const lastSegment = segments[segments.length - 1];
  const isMarkdownFile = lastSegment.toLowerCase().endsWith('.md');

  if (isMarkdownFile) {
    // Look for a matching file
    const files = await listMarkdownFiles(accessToken, currentFolderId);
    const matchingFile = files.find(
      (f) => f.name.toLowerCase() === lastSegment.toLowerCase()
    );

    if (matchingFile) {
      return { type: 'file', id: matchingFile.id };
    }
  }

  // Look for a matching folder (with or without .md extension in case of folder-named files)
  const folders = await listFolders(accessToken, currentFolderId);
  const folderName = isMarkdownFile ? lastSegment.replace(/\.md$/i, '') : lastSegment;
  const matchingFolder = folders.find(
    (f) => f.name.toLowerCase() === folderName.toLowerCase() ||
           f.name.toLowerCase() === lastSegment.toLowerCase()
  );

  if (matchingFolder) {
    return { type: 'folder', id: matchingFolder.id };
  }

  // Also check for file without .md extension
  if (!isMarkdownFile) {
    const files = await listMarkdownFiles(accessToken, currentFolderId);
    const matchingFile = files.find(
      (f) => f.name.toLowerCase() === lastSegment.toLowerCase() ||
             f.name.toLowerCase() === lastSegment.toLowerCase() + '.md'
    );

    if (matchingFile) {
      return { type: 'file', id: matchingFile.id };
    }
  }

  return null;
}

