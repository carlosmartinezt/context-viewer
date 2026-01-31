import { Player, OnlineAccount } from '../../types';
import {
  extractMarkdownTable,
  extractCheckboxes,
  parseMarkdownLink,
  stripMarkdown,
} from '../../utils/markdownParser';

export interface ChessData {
  players: Player[];
  goals: Array<{ text: string; checked: boolean }>;
  onlineAccounts: OnlineAccount[];
}

/**
 * Parse chess.md file content
 */
export function parseChessFile(content: string): ChessData {
  const players = parsePlayers(content);
  const goals = parseGoals(content);
  const onlineAccounts = parseOnlineAccounts(content);

  return {
    players,
    goals,
    onlineAccounts,
  };
}

function parsePlayers(content: string): Player[] {
  const rows = extractMarkdownTable(content, '| Player | Age |');

  return rows
    .filter((row) => row.Player && row.Player.trim() !== '')
    .map((row) => ({
      id: row.Player.toLowerCase(),
      name: row.Player,
      age: parseInt(row.Age) || 0,
      rating: parseRating(row['Current Rating']),
      goalRating: parseRating(row['Goal Rating']),
      focus: stripMarkdown(row['Primary Focus'] || ''),
    }));
}

function parseRating(ratingStr: string): number {
  if (!ratingStr) return 0;
  const match = ratingStr.match(/(\d+)/);
  return match ? parseInt(match[1]) : 0;
}

function parseGoals(content: string): Array<{ text: string; checked: boolean }> {
  const goalsSection = content.split('## 🎯 Current Goals')[1]?.split('---')[0] || '';
  return extractCheckboxes(goalsSection);
}

function parseOnlineAccounts(content: string): OnlineAccount[] {
  const rows = extractMarkdownTable(content, '| Platform |');
  const accounts: OnlineAccount[] = [];

  rows.forEach((row) => {
    const platform = row.Platform;
    if (!platform || platform === 'Platform') return;

    // Parse each player's account
    Object.keys(row).forEach((playerName) => {
      if (playerName === 'Platform') return;

      const value = row[playerName];
      if (!value || value.trim() === '') return;

      // Handle different formats
      let username = '';
      let url = '';
      let email = '';

      // Check if it's a link [text](url)
      const link = parseMarkdownLink(value);
      if (link) {
        username = link.text;
        url = link.url;
      } else if (value.includes('U:') || value.includes('E:')) {
        // Handle format like "U: username / E: email"
        const parts = value.split('/').map((p) => p.trim());
        parts.forEach((part) => {
          if (part.startsWith('U:')) {
            username = part.substring(2).trim();
          } else if (part.startsWith('E:')) {
            email = part.substring(2).trim();
          }
        });
      } else if (value.includes('@')) {
        // It's an email
        email = stripMarkdown(value);
      } else {
        // Plain username
        username = stripMarkdown(value);
      }

      accounts.push({
        platform,
        playerId: playerName.toLowerCase(),
        username,
        url,
        email,
      });
    });
  });

  return accounts;
}
