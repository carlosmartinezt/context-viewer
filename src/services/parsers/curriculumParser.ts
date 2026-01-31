import type { CurriculumTopic } from '../../types';
import { extractMarkdownTable, stripMarkdown } from '../../utils/markdownParser';

export interface CurriculumData {
  topics: CurriculumTopic[];
}

/**
 * Parse curriculum.md file content
 */
export function parseCurriculumFile(content: string): CurriculumData {
  const topics = parseTopics(content);

  return {
    topics,
  };
}

function parseTopics(content: string): CurriculumTopic[] {
  const topics: CurriculumTopic[] = [];

  // Parse Openings (White Repertoire)
  const whiteOpenings = extractMarkdownTable(content, '| Opening | Player | Status |');
  whiteOpenings.forEach((row) => {
    if (!row.Opening || !row.Player) return;

    topics.push({
      id: `opening-white-${row.Opening}`.toLowerCase().replace(/\s+/g, '-'),
      category: 'openings',
      name: stripMarkdown(row.Opening),
      player: row.Player,
      status: parseTopicStatus(row.Status),
      notes: row.Notes || '',
      color: 'white',
    });
  });

  // Parse Openings (Black Repertoire)
  const blackDefenses = extractMarkdownTable(content, '| Defense | Player | Status |');
  blackDefenses.forEach((row) => {
    if (!row.Defense || !row.Player) return;

    topics.push({
      id: `opening-black-${row.Defense}`.toLowerCase().replace(/\s+/g, '-'),
      category: 'openings',
      name: stripMarkdown(row.Defense),
      player: row.Player,
      status: parseTopicStatus(row.Status),
      notes: row.Notes || '',
      color: 'black',
    });
  });

  // Parse Tactics
  const tactics = extractMarkdownTable(content, '| Topic | Player | Status | Resources |');
  tactics.forEach((row) => {
    if (!row.Topic || !row.Player) return;

    topics.push({
      id: `tactics-${row.Topic}`.toLowerCase().replace(/\s+/g, '-'),
      category: 'tactics',
      name: row.Topic,
      player: row.Player,
      status: parseTopicStatus(row.Status),
      resources: row.Resources || '',
    });
  });

  // Parse Endgames
  const endgames = extractMarkdownTable(content, '| Endgame Type | Player | Status |');
  endgames.forEach((row) => {
    if (!row['Endgame Type'] || !row.Player) return;

    topics.push({
      id: `endgame-${row['Endgame Type']}`.toLowerCase().replace(/\s+/g, '-'),
      category: 'endgames',
      name: row['Endgame Type'],
      player: row.Player,
      status: parseTopicStatus(row.Status),
      notes: row.Notes || '',
    });
  });

  // Parse Strategy
  const strategy = extractMarkdownTable(content, '| Concept | Player | Status |');
  strategy.forEach((row) => {
    if (!row.Concept || !row.Player) return;

    topics.push({
      id: `strategy-${row.Concept}`.toLowerCase().replace(/\s+/g, '-'),
      category: 'strategy',
      name: row.Concept,
      player: row.Player,
      status: parseTopicStatus(row.Status),
      notes: row.Notes || '',
    });
  });

  return topics.filter(t => t.name && t.player);
}

function parseTopicStatus(statusStr: string): 'not-started' | 'learning' | 'solid' | 'mastered' {
  const lower = statusStr.toLowerCase();
  if (lower.includes('learning') || lower.includes('⏳')) return 'learning';
  if (lower.includes('solid') || lower.includes('✅')) return 'solid';
  if (lower.includes('master')) return 'mastered';
  return 'not-started';
}
