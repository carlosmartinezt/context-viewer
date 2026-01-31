// Player types
export interface Player {
  id: string;
  name: string;
  age: number;
  rating: number;              // Current rating
  goalRating?: number;
  focus?: string;              // Primary focus area
  uscfId?: string;             // 8-digit USCF member ID (e.g., "30352946")
  lastRatingUpdate?: string;   // ISO timestamp of last USCF fetch
  // Legacy fields for backward compatibility
  currentRating?: number;
  primaryFocus?: string;
}

// USCF rating data from ratings.uschess.org
export interface USCFRatingData {
  regular?: number;
  quick?: number;
  blitz?: number;
  onlineRegular?: number;
  onlineQuick?: number;
  onlineBlitz?: number;
  name?: string;
  memberExpiration?: string;
}

// Coach types
export interface Coach {
  id: string;
  name: string;
  students: string[];
  focusArea?: string;
  contact?: string;
  rate?: string;
  schedule?: string;
  platform?: string;
}

// Lesson types
export interface Lesson {
  id: string;
  date: string;
  time: string;
  player: string;
  coach: string;
  focus?: string;
  status: 'scheduled' | 'completed' | 'cancelled';
}

// Tournament types
export interface Tournament {
  id: string;
  date: string;
  name: string;
  location: string;
  city?: string;
  players: string[];
  bookHotelBy?: string;
  registrationDeadline?: string;
  status: 'confirmed' | 'considering' | 'registered' | 'completed';
  type: 'local' | 'national';
}

// Travel planning
export interface TravelPlan {
  tournamentName: string;
  tournamentDate: string;
  items: TravelItem[];
}

export interface TravelItem {
  type: 'flights' | 'hotel' | 'transport' | 'registration';
  status: 'to_book' | 'booked' | 'confirmed';
  details?: string;
  cost?: number;
}

// Curriculum types
export interface CurriculumTopic {
  id: string;
  name: string;
  category: 'openings' | 'tactics' | 'endgames' | 'strategy';
  player?: string;
  status: 'not-started' | 'learning' | 'solid' | 'mastered';
  notes?: string;
  resources?: string;
  color?: 'white' | 'black';  // For openings
}

// Online accounts
export interface OnlineAccount {
  platform: string;
  playerId: string;
  username: string;
  url?: string;
  email?: string;
  profileUrl?: string;  // Legacy field
}

// User auth
export interface User {
  email: string;
  name: string;
  picture?: string;
}
