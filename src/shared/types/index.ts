export interface Note {
  id: number;
  title: string;
  created_at: string;
  user_id: string;
}

export interface UserProfile {
  id: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
}

export interface Peer {
  peerId: string;
  multiaddr: string;
  ip: string;
  lastSeen?: number;
}

export interface Release {
  version: string;
  date: string;
  type: 'major' | 'feature' | 'fix';
  notes: string;
}

export interface Platform {
  name: string;
  version: string;
  ext: string;
  size: string;
  requirements: string;
  features: string[];
  primary: boolean;
  url: string;
}
