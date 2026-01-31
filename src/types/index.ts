// Player types
export interface Player {
  name: string;
  age: number;
  currentRating: number;
  goalRating?: number;
  primaryFocus?: string;
}

// Coach types
export interface Coach {
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
  date: string;
  time: string;
  player: string;
  coach: string;
  focus?: string;
  status: 'scheduled' | 'completed' | 'cancelled';
}

// Tournament types
export interface Tournament {
  date: string;
  name: string;
  location: string;
  city?: string;
  players: string[];
  bookHotelBy?: string;
  status: 'considering' | 'registered' | 'completed';
  type: 'local' | 'travel';
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
  name: string;
  category: 'openings' | 'tactics' | 'endgames' | 'strategy';
  player?: string;
  status: 'learning' | 'practicing' | 'solid';
  notes?: string;
}

// Online accounts
export interface OnlineAccount {
  platform: string;
  username: string;
  profileUrl?: string;
}

// User auth
export interface User {
  email: string;
  name: string;
  picture?: string;
}
