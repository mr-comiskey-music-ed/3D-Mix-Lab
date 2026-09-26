export type ViewMode = 'front' | 'top';
export type ActiveTab = 'sandbox' | 'challenges' | 'examples' | 'grader';
export type ThemeMode = 'dark' | 'light';
export type GraphPaperStyle = 'blueprint' | 'charcoal' | 'parchment';

export interface TimelineRegion {
  id: string;
  start: number; // in seconds
  end: number;   // in seconds
}

export interface SoundBubble {
  id: string;
  name: string;
  category:
    | 'vocals'
    | 'drums'
    | 'bass'
    | 'guitars'
    | 'keys'
    | 'synths'
    | 'keys_synth'
    | 'orchestral'
    | 'fx';
  color: string;
  // 3D coordinates (-100 to +100 for X, 0 to 100 for Y and Z)
  x: number; // Pan: -100 (Hard Left) to +100 (Hard Right), 0 = Center
  y: number; // Frequency: 0 (Sub/Bass 20-80Hz) to 100 (High Air 12-20kHz)
  z: number; // Depth: 0 (Foreground/In-face) to 100 (Deep background/Reverb tail)
  autoZ?: boolean; // When true, Z is computed from Volume, Compression & Reverb

  // Dimensions
  width: number;  // Stereo spread / Chorus width (15 to 120)
  height: number; // Frequency bandwidth / harmonic span (15 to 120)

  // DSP Modifiers
  volume: number;      // 0 to 100 (scales sphere visual radius)
  saturation: number;  // 0 to 100 (jagged spiky perimeter + upward HF stretch)
  reverb: number;      // 0 to 100 (translucent halo radius + pushes Z backward)
  compression: number; // 0 to 100 (dense opaque core + thick perimeter ring)

  // Educational Annotations
  notes: string;

  // DAW Timeline arrangement
  regions: TimelineRegion[];

  // Mix states (for Examples & Sandbox)
  solo?: boolean;
  mute?: boolean;
}

export interface ChallengeRequirement {
  description: string;
  test: (bubbles: SoundBubble[]) => boolean;
  hint: string;
}

export interface Challenge {
  id: string;
  title: string;
  subtitle: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  flawedDescription: string;
  taskGoal: string;
  targetStars: number;
  initialBubbles: SoundBubble[];
  requirements: ChallengeRequirement[];
}

export interface ExampleTrack {
  id: string;
  title: string;
  genre: string;
  bpm: number;
  description: string;
  audioUrl?: string;
  youtubeId?: string;
  bubbles: SoundBubble[];
}

export interface StudentSubmission {
  version: string;
  studentName: string;
  timestamp: string;
  challengeScores: Record<string, number>;
  totalStars: number;
  maxStars: number;
  sandboxSnapshot: {
    bubbles: SoundBubble[];
    songDuration: number;
  };
  signature: string;
}

export interface RosterStudentRow {
  studentName: string;
  timestamp: string;
  totalStars: number;
  maxStars: number;
  percentage: number;
  status: 'Passed' | 'Needs Review' | 'Perfect';
  rawCode: string;
  submission: StudentSubmission;
}

export interface TourStep {
  title: string;
  subtitle: string;
  content: string;
  targetId?: string;
  highlightCoordinates?: { x: string; y: string; w: string; h: string };
}
