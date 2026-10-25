import { Challenge, SoundBubble } from '../types';
// The starting ("flawed") diagram for each challenge lives in challengeDiagrams.json,
// so the in-app "Save problem diagram" tool can rewrite the diagrams without touching
// the pass/fail checks below.
import CHALLENGE_DIAGRAMS from './challengeDiagrams.json';

const diagram = (id: string): SoundBubble[] =>
  ((CHALLENGE_DIAGRAMS as unknown as Record<string, SoundBubble[]>)[id] ?? []);

export const MIXING_CHALLENGES: Challenge[] = [
  {
    id: 'challenge-1',
    title: "Challenge #1: It's Muddy!",
    subtitle: 'Slide 2 • Low-Mid Mud & Center Congestion',
    difficulty: 'Beginner',
    flawedDescription:
      'Kick, 808, Synth Chords, and Electric Guitars are all piled directly on top of each other in the low-mids (Y: 20-38%), with wide Strings & Pads smothering the vocal range. With so many harmonic and low elements clashing, the mix turns into boomy, indistinct mud.',
    taskGoal:
      'Clean up the mud: Keep only the Kick and 808 anchored in the low foundation (Y ≤ 28%, |X| ≤ 10%). Lift the Synth Chords and Electric Guitars upward into the midrange (Y ≥ 42%) and pan the guitars wide (|X| ≥ 30%) so the vocals and groove can breathe.',
    targetStars: 3,
    initialBubbles: diagram('challenge-1'),
    requirements: [
      {
        description: 'Low-end clarity: Only Kick and 808 remain below 28% frequency.',
        test: (bubbles) => {
          const nonBass = bubbles.filter(
            (b) => b.name !== 'Kick' && b.name !== '808' && b.category !== 'bass'
          );
          return nonBass.every((b) => b.y >= 38);
        },
        hint: 'Drag the Synth Chords and Electric Guitars vertically upward into the midrange (Y ≥ 38%) to clear out the mud.',
      },
      {
        description: 'Stereo separation: Spread Electric Guitars wide (|X| ≥ 30%).',
        test: (bubbles) => {
          const gL = bubbles.find((b) => b.name === 'Electric Guitar L');
          const gR = bubbles.find((b) => b.name === 'Electric Guitar R');
          if (!gL || !gR) return false;
          return Math.abs(gL.x) >= 30 && Math.abs(gR.x) >= 30 && gL.x * gR.x < 0;
        },
        hint: 'Pan Electric Guitar L to the left (X ≤ -30%) and Electric Guitar R to the right (X ≥ +30%).',
      },
      {
        description: 'Solid center anchor: Kick and 808 anchored in center (|X| ≤ 10%).',
        test: (bubbles) => {
          const kick = bubbles.find((b) => b.name === 'Kick');
          const bass = bubbles.find((b) => b.name === '808');
          return (kick ? Math.abs(kick.x) <= 10 : false) && (bass ? Math.abs(bass.x) <= 10 : false);
        },
        hint: 'Keep Kick and 808 centered (|X| ≤ 10%) so low frequencies have maximum mono power.',
      },
    ],
  },
  {
    id: 'challenge-2',
    title: "Challenge #2: I Can't Hear the Vocals!",
    subtitle: 'Slide 3 • Vocal Frequency Masking & Center Clutter',
    difficulty: 'Beginner',
    flawedDescription:
      'The Vocals are completely smothered in the center by a massive Distorted Rhythm Guitar and Electric Piano occupying the exact same mid-frequency band, while Lead Guitar and Horns crowd the upper vocal harmonics. The vocal has no presence or intelligibility.',
    taskGoal:
      'Unmask the vocals: Pan Distorted Rhythm Guitar and Electric Piano away from center (|X| ≥ 25%), bring Vocals forward into the foreground (Z ≤ 15, Volume ≥ 85%, Reverb ≤ 25%), and spread Lead Guitar and Horns (|X| ≥ 20%) to carve a vocal pocket.',
    targetStars: 3,
    initialBubbles: diagram('challenge-2'),
    requirements: [
      {
        description: 'Vocal prominence: Vocals pulled into foreground (Z ≤ 16, Volume ≥ 85%, Reverb ≤ 26%).',
        test: (bubbles) => {
          const v = bubbles.find((b) => b.name === 'Vocals');
          if (!v) return false;
          return v.z <= 16 && v.volume >= 82 && v.reverb <= 26 && Math.abs(v.x) <= 10;
        },
        hint: 'Use the inspector to increase Vocals volume (≥85%), lower reverb (≤25%), and pull depth Z ≤ 16.',
      },
      {
        description: 'Center masking cleared: Distorted Rhythm Guitar and Electric Piano panned away (|X| ≥ 25%).',
        test: (bubbles) => {
          const g = bubbles.find((b) => b.name === 'Distorted Rhythm Guitar');
          const p = bubbles.find((b) => b.name === 'Electric Piano');
          if (!g || !p) return false;
          return Math.abs(g.x) >= 25 && Math.abs(p.x) >= 25;
        },
        hint: 'Pan the Distorted Rhythm Guitar to one side and Electric Piano to the other (|X| ≥ 25%) so the center vocal path is open.',
      },
      {
        description: 'Melodic separation: Lead Guitar and Horns separated across channels (|X| ≥ 20%).',
        test: (bubbles) => {
          const g = bubbles.find((b) => b.name === 'Lead Guitar');
          const h = bubbles.find((b) => b.name === 'Horns');
          if (!g || !h) return false;
          return Math.abs(g.x) >= 20 && Math.abs(h.x) >= 20 && g.x * h.x < 0;
        },
        hint: 'Pan Lead Guitar to the left and Horns to the right to stop them from crowding the vocal harmonics.',
      },
    ],
  },
  {
    id: 'challenge-3',
    title: "Challenge #3: People Aren't Dancing to My Song!!",
    subtitle: 'Slide 4 • Missing Dancefloor Foundation',
    difficulty: 'Intermediate',
    flawedDescription:
      'The song has a kick drum, piano, and Latin percussion, but the Bass is stranded and unanchored in the far bottom-right corner with weak volume and no punch. Without an anchored bass locked with the kick and without driving stereo percussion, listeners feel no physical dance impulse.',
    taskGoal:
      'Lock the dancefloor foundation: Bring the Bass dead center (|X| ≤ 8%, Y ≤ 25%) with punchy volume (≥80%) and compression (≥65%) to lock with the Kick, and pan the Bongos and Congas wide (|X| ≥ 30%) to create syncopated rhythmic energy.',
    targetStars: 3,
    initialBubbles: diagram('challenge-3'),
    requirements: [
      {
        description: 'Dancefloor bass locked: Bass centered (|X| ≤ 8%, Y ≤ 25%) with Volume ≥ 80% and Compression ≥ 65%.',
        test: (bubbles) => {
          const bass = bubbles.find((b) => b.name === 'Bass' || b.category === 'bass');
          if (!bass) return false;
          return (
            Math.abs(bass.x) <= 8 &&
            bass.y <= 25 &&
            bass.volume >= 78 &&
            bass.compression >= 62
          );
        },
        hint: 'Drag the stranded Bass from the bottom-right corner to center (|X| ≤ 8%, Y ≤ 25%), raise volume (≥80%) and compression (≥65%).',
      },
      {
        description: 'Kick anchor maintained: Kick centered (|X| ≤ 8%, Y ≤ 25%).',
        test: (bubbles) => {
          const kick = bubbles.find((b) => b.name === 'Kick');
          return kick ? Math.abs(kick.x) <= 8 && kick.y <= 25 : false;
        },
        hint: 'Keep Kick centered (X = 0) and low to deliver driving dance pulses.',
      },
      {
        description: 'Stereo percussion groove: Bongos and Congas panned wide on opposite sides (|X| ≥ 30%).',
        test: (bubbles) => {
          const bongos = bubbles.find((b) => b.name === 'Bongos');
          const congas = bubbles.find((b) => b.name === 'Congas');
          if (!bongos || !congas) return false;
          return Math.abs(bongos.x) >= 30 && Math.abs(congas.x) >= 30 && bongos.x * congas.x < 0;
        },
        hint: 'Spread Bongos to the left (X ≤ -30%) and Congas to the right (X ≥ +30%) for wide Latin rhythm interplay.',
      },
    ],
  },
  {
    id: 'challenge-4',
    title: "Challenge #4: It Sounds Thin!",
    subtitle: 'Slide 5 • Top-Heavy Mix & Displaced Bass',
    difficulty: 'Intermediate',
    flawedDescription:
      'The mix is packed with high-end Triangle, Tambourine, Acoustic Guitar, Electric Guitar, and Vocals, but the Electric Bass was accidentally dragged way up to 70% frequency—triggering an automatic Slide 1 placement error! Without a true low-end bass foundation, the mix sounds tinny and thin.',
    taskGoal:
      'Restore low foundation: Notice the Slide 1 "!" warning on the misplaced Bass (Y = 70%). Drag the Electric Bass down to the sub-bass floor (Y ≤ 24%, |X| ≤ 8%) and raise its volume (≥80%), and balance the Acoustic and Electric Guitars across the stereo field.',
    targetStars: 3,
    initialBubbles: diagram('challenge-4'),
    requirements: [
      {
        description: 'Low-end foundation restored: Electric Bass lowered to Y ≤ 24% and centered (|X| ≤ 8%).',
        test: (bubbles) => {
          const bass = bubbles.find((b) => b.name === 'Electric Bass' || b.category === 'bass');
          if (!bass) return false;
          return bass.y <= 24 && Math.abs(bass.x) <= 8 && bass.volume >= 76;
        },
        hint: 'Drag the Electric Bass down to the sub-bass floor (Y ≤ 24%), center it (|X| ≤ 8%), and raise volume to eliminate mix thinness.',
      },
      {
        description: 'Full frequency balance: Low (Y ≤ 26%), Mid (Y 35-65%), and High (Y ≥ 75%) all populated.',
        test: (bubbles) => {
          const hasLow = bubbles.some((b) => b.y <= 26);
          const hasMid = bubbles.some((b) => b.y >= 35 && b.y <= 65);
          const hasHigh = bubbles.some((b) => b.y >= 75);
          return hasLow && hasMid && hasHigh;
        },
        hint: 'Ensure your mix forms a balanced frequency spectrum with solid low end, warm mids, and airy highs.',
      },
      {
        description: 'Balanced guitars: Acoustic Guitar left (X ≤ -25%) and Electric Guitar right (X ≥ 25%).',
        test: (bubbles) => {
          const ag = bubbles.find((b) => b.name === 'Acoustic Guitar');
          const eg = bubbles.find((b) => b.name === 'Electric Guitar');
          if (!ag || !eg) return false;
          return ag.x <= -25 && eg.x >= 25;
        },
        hint: 'Pan Acoustic Guitar left and Electric Guitar right to balance stereo width.',
      },
    ],
  },
  {
    id: 'challenge-5',
    title: "Challenge #5: It Sounds Bad and I Don't Know Why!",
    subtitle: 'Slide 6 • Severe Stereo Asymmetry & Displaced Lead',
    difficulty: 'Advanced',
    flawedDescription:
      'The entire left channel is overcrowded with Horns, Acoustic Guitar, and Electric Guitar, while the Lead Vocal is panned 38% right and the Bass is panned 48% right! The stereo field is wildly lopsided, the center has no vocal focus, and low-end power is completely destabilized.',
    taskGoal:
      'Fix the bad mix: Anchor the Vocals dead center (|X| ≤ 8%), anchor the Bass dead center in the low end (|X| ≤ 8%, Y ≤ 25%), and balance the overloaded left side by panning either Horns or Electric Guitar to the right side (X ≥ 25%).',
    targetStars: 3,
    initialBubbles: diagram('challenge-5'),
    requirements: [
      {
        description: 'Center Lead Vocal: Vocals anchored in the center corridor (|X| ≤ 8%).',
        test: (bubbles) => {
          const v = bubbles.find((b) => b.name === 'Vocals');
          return v ? Math.abs(v.x) <= 8 : false;
        },
        hint: 'Drag Vocals from the far right channel (X = +38%) back to dead center (X = 0).',
      },
      {
        description: 'Center Bass: Bass anchored in center low end (|X| ≤ 8%, Y ≤ 25%).',
        test: (bubbles) => {
          const b = bubbles.find((b) => b.name === 'Bass' || b.category === 'bass');
          return b ? Math.abs(b.x) <= 8 && b.y <= 25 : false;
        },
        hint: 'Drag the Bass from X = +48% right to center (|X| ≤ 8%) in the low frequencies (Y ≤ 25%).',
      },
      {
        description: 'Stereo balance restored: Harmonic elements balanced across left and right.',
        test: (bubbles) => {
          const eg = bubbles.find((b) => b.name === 'Electric Guitar');
          const ag = bubbles.find((b) => b.name === 'Acoustic Guitar');
          const h = bubbles.find((b) => b.name === 'Horns');
          const elements = [eg, ag, h].filter(Boolean) as { x: number }[];
          const hasLeft = elements.some((el) => el.x <= -20);
          const hasRight = elements.some((el) => el.x >= 20);
          return hasLeft && hasRight;
        },
        hint: 'Balance the left-heavy channel: Pan either the Horns or Electric Guitar across to the right side (X ≥ 20%).',
      },
    ],
  },
];
