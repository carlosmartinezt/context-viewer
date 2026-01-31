import type { Coach, Lesson } from '../../types';
import { extractMarkdownTable, stripMarkdown } from '../../utils/markdownParser';

export interface CoachesData {
  coaches: Coach[];
  lessons: Lesson[];
}

/**
 * Parse coaches.md file content
 */
export function parseCoachesFile(content: string): CoachesData {
  const coaches = parseCoaches(content);
  const lessons = parseLessons(content);

  return {
    coaches,
    lessons,
  };
}

function parseCoaches(content: string): Coach[] {
  const coaches: Coach[] = [];
  const coachSections = content.split('###').slice(1); // Skip content before first ###

  coachSections.forEach((section) => {
    const lines = section.split('\n');
    const nameLine = lines[0]?.trim();

    if (!nameLine || nameLine.startsWith('📅')) return; // Skip non-coach sections

    const coach: Coach = {
      id: nameLine.toLowerCase().replace(/\s+/g, '-'),
      name: nameLine,
      students: [],
      focusArea: '',
      contact: '',
      rate: '',
      schedule: '',
      platform: '',
    };

    // Parse the table within this section
    const tableRows = extractMarkdownTable(section, '|---|---|');

    tableRows.forEach((row) => {
      const key = Object.keys(row)[0];
      const value = Object.values(row)[0];

      if (!key || !value) return;

      const cleanKey = stripMarkdown(key).replace(/\*/g, '').trim();
      const cleanValue = stripMarkdown(value);

      switch (cleanKey) {
        case 'Students':
          coach.students = cleanValue.split(',').map((s) => s.trim()).filter(s => s);
          break;
        case 'Focus Area':
          coach.focusArea = cleanValue;
          break;
        case 'Contact':
          coach.contact = cleanValue;
          break;
        case 'Rate':
          coach.rate = cleanValue;
          break;
        case 'Schedule':
          coach.schedule = cleanValue;
          break;
        case 'Platform':
          coach.platform = cleanValue;
          break;
      }
    });

    coaches.push(coach);
  });

  return coaches;
}

function parseLessons(content: string): Lesson[] {
  const lessons: Lesson[] = [];

  // Parse "This Week" table
  const thisWeekRows = extractMarkdownTable(content, '| Date | Time | Player | Coach |');
  thisWeekRows.forEach((row) => {
    if (!row.Date || !row.Player) return;

    lessons.push({
      id: `${row.Date}-${row.Player}-${row.Coach}`.toLowerCase().replace(/\s+/g, '-'),
      date: row.Date,
      time: row.Time,
      player: row.Player,
      coach: row.Coach,
      focus: row.Focus || '',
      status: parseStatus(row.Status),
    });
  });

  return lessons.filter(lesson => lesson.date && lesson.player);
}

function parseStatus(statusStr: string): 'scheduled' | 'completed' | 'cancelled' {
  const lower = statusStr.toLowerCase();
  if (lower.includes('scheduled') || lower.includes('⏳')) return 'scheduled';
  if (lower.includes('completed') || lower.includes('✅')) return 'completed';
  if (lower.includes('cancelled') || lower.includes('❌')) return 'cancelled';
  return 'scheduled';
}
