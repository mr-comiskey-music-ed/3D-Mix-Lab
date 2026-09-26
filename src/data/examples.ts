import { ExampleTrack } from '../types';

export const EXAMPLE_TRACKS: ExampleTrack[] = [
  {
    "id": "example-pop",
    "title": "Neon Nights (Modern Pop / Synthwave)",
    "genre": "Synthpop / Commercial",
    "bpm": 124,
    "description": "Classic commercial radio profile: punchy sub-808 and kick locked dead-center, intimate upfront female lead vocal, wide doubled rhythm guitars, lush side-chained synth pads, and sparkling air percussion.",
    "bubbles": [
      {
        "id": "ex-pop-kick",
        "name": "Punchy Kick",
        "category": "drums",
        "color": "#ef4444",
        "x": 0,
        "y": 15,
        "z": 10,
        "width": 34,
        "height": 30,
        "volume": 88,
        "saturation": 20,
        "reverb": 4,
        "compression": 85,
        "notes": "Anchored dead center with high transient snap at 3.5kHz.",
        "regions": [
          {
            "id": "r1",
            "start": 0,
            "end": 180
          }
        ],
        "solo": false,
        "mute": false
      },
      {
        "id": "ex-pop-snare",
        "name": "Clap & Snare Layer",
        "category": "drums",
        "color": "#f97316",
        "x": 0,
        "y": 48,
        "z": 18,
        "width": 36,
        "height": 32,
        "volume": 84,
        "saturation": 25,
        "reverb": 26,
        "compression": 75,
        "notes": "Stereo clap layer with tight pre-delay plate reverb.",
        "regions": [
          {
            "id": "r2",
            "start": 15,
            "end": 180
          }
        ],
        "solo": false,
        "mute": false
      },
      {
        "id": "ex-pop-bass",
        "name": "808 Sub Bass",
        "category": "bass",
        "color": "#8b5cf6",
        "x": 0,
        "y": 18,
        "z": 12,
        "width": 28,
        "height": 30,
        "volume": 90,
        "saturation": 35,
        "reverb": 2,
        "compression": 88,
        "notes": "Mono sub-harmonic foundation sitting directly below kick.",
        "regions": [
          {
            "id": "r3",
            "start": 0,
            "end": 180
          }
        ],
        "solo": false,
        "mute": false
      },
      {
        "id": "ex-pop-vocal",
        "name": "Lead Vocal",
        "category": "vocals",
        "color": "#ec4899",
        "x": 0,
        "y": 58,
        "z": 6,
        "width": 44,
        "height": 48,
        "volume": 92,
        "saturation": 18,
        "reverb": 16,
        "compression": 80,
        "notes": "In-your-face foreground presence with parallel 1176 compression.",
        "regions": [
          {
            "id": "r4",
            "start": 15,
            "end": 175
          }
        ],
        "solo": false,
        "mute": false
      },
      {
        "id": "ex-pop-bgv",
        "name": "Backing Harmonies",
        "category": "vocals",
        "color": "#f43f5e",
        "x": -58,
        "y": 64,
        "z": 46,
        "width": 58,
        "height": 38,
        "volume": 68,
        "saturation": 10,
        "reverb": 48,
        "compression": 60,
        "notes": "Hard left/right panned vocal chorus with wide stereo spread.",
        "regions": [
          {
            "id": "r5",
            "start": 45,
            "end": 160
          }
        ],
        "solo": false,
        "mute": false
      },
      {
        "id": "ex-pop-synth",
        "name": "Analog Polysynth",
        "category": "synths",
        "color": "#3b82f6",
        "x": 54,
        "y": 56,
        "z": 36,
        "width": 50,
        "height": 40,
        "volume": 74,
        "saturation": 30,
        "reverb": 38,
        "compression": 45,
        "notes": "Warm chorus saw wave panned right to balance guitars.",
        "regions": [
          {
            "id": "r6",
            "start": 30,
            "end": 180
          }
        ],
        "solo": false,
        "mute": false
      },
      {
        "id": "ex-pop-pad",
        "name": "Lush Shimmer Pad",
        "category": "synths",
        "color": "#06b6d4",
        "x": 0,
        "y": 70,
        "z": 68,
        "width": 86,
        "height": 46,
        "volume": 60,
        "saturation": 8,
        "reverb": 75,
        "compression": 30,
        "notes": "Deep background atmosphere creating front-to-back 3D depth.",
        "regions": [
          {
            "id": "r7",
            "start": 0,
            "end": 210
          }
        ],
        "solo": false,
        "mute": false
      },
      {
        "id": "ex-pop-hats",
        "name": "Hi-Hats & Shakers",
        "category": "drums",
        "color": "#fbbf24",
        "x": -42,
        "y": 82,
        "z": 32,
        "width": 32,
        "height": 24,
        "volume": 70,
        "saturation": 12,
        "reverb": 18,
        "compression": 48,
        "notes": "Top-end sparkle sitting panned left for stereo balance.",
        "regions": [
          {
            "id": "r8",
            "start": 15,
            "end": 180
          }
        ],
        "solo": false,
        "mute": false
      }
    ]
  },
  {
    "id": "example-rock",
    "title": "Thunder Highway (Classic Rock & Grunge)",
    "genre": "Alternative Rock",
    "bpm": 138,
    "description": "Aggressive acoustic wall of sound: LCR (Left-Center-Right) panning technique. Heavily saturated dual electric guitars hard-panned 100% L & R, room mic drum kit, gritty bass guitar in the middle, and soaring rock vocals.",
    "bubbles": [
      {
        "id": "ex-rock-kick",
        "name": "Rock Kick Drum",
        "category": "drums",
        "color": "#ef4444",
        "x": 0,
        "y": 16,
        "z": 18,
        "width": 34,
        "height": 28,
        "volume": 86,
        "saturation": 25,
        "reverb": 12,
        "compression": 82,
        "notes": "Punchy 60Hz thud with beater click at 4kHz.",
        "regions": [
          {
            "id": "r1",
            "start": 0,
            "end": 200
          }
        ],
        "solo": false,
        "mute": false
      },
      {
        "id": "ex-rock-snare",
        "name": "Wood Snare (Top & Bottom)",
        "category": "drums",
        "color": "#f97316",
        "x": -4,
        "y": 48,
        "z": 22,
        "width": 36,
        "height": 32,
        "volume": 85,
        "saturation": 30,
        "reverb": 24,
        "compression": 76,
        "notes": "Cracking rimshot centered with natural drum room bleed.",
        "regions": [
          {
            "id": "r2",
            "start": 0,
            "end": 200
          }
        ],
        "solo": false,
        "mute": false
      },
      {
        "id": "ex-rock-bass",
        "name": "Driven Bass Guitar",
        "category": "bass",
        "color": "#8b5cf6",
        "x": 0,
        "y": 24,
        "z": 14,
        "width": 32,
        "height": 34,
        "volume": 87,
        "saturation": 65,
        "reverb": 6,
        "compression": 84,
        "notes": "SVT tube amp drive providing gritty glue between kick & guitars.",
        "regions": [
          {
            "id": "r3",
            "start": 0,
            "end": 200
          }
        ],
        "solo": false,
        "mute": false
      },
      {
        "id": "ex-rock-gtr-l",
        "name": "Heavy Rhythm Gtr Left",
        "category": "guitars",
        "color": "#d97706",
        "x": -85,
        "y": 52,
        "z": 26,
        "width": 48,
        "height": 42,
        "volume": 82,
        "saturation": 85,
        "reverb": 18,
        "compression": 65,
        "notes": "Marshall stack hard-panned 85% Left.",
        "regions": [
          {
            "id": "r4",
            "start": 0,
            "end": 190
          }
        ],
        "solo": false,
        "mute": false
      },
      {
        "id": "ex-rock-gtr-r",
        "name": "Heavy Rhythm Gtr Right",
        "category": "guitars",
        "color": "#ca8a04",
        "x": 85,
        "y": 52,
        "z": 26,
        "width": 48,
        "height": 42,
        "volume": 82,
        "saturation": 85,
        "reverb": 18,
        "compression": 65,
        "notes": "Mesa Boogie stack hard-panned 85% Right.",
        "regions": [
          {
            "id": "r5",
            "start": 0,
            "end": 190
          }
        ],
        "solo": false,
        "mute": false
      },
      {
        "id": "ex-rock-lead-vox",
        "name": "Rock Lead Vocal",
        "category": "vocals",
        "color": "#ec4899",
        "x": 0,
        "y": 60,
        "z": 8,
        "width": 46,
        "height": 46,
        "volume": 90,
        "saturation": 40,
        "reverb": 20,
        "compression": 85,
        "notes": "Gritty vocal right at the front of the stage with slapback echo.",
        "regions": [
          {
            "id": "r6",
            "start": 10,
            "end": 195
          }
        ],
        "solo": false,
        "mute": false
      },
      {
        "id": "ex-rock-overhead",
        "name": "Drum Overheads / Cymbals",
        "category": "drums",
        "color": "#fbbf24",
        "x": 0,
        "y": 84,
        "z": 38,
        "width": 80,
        "height": 28,
        "volume": 72,
        "saturation": 15,
        "reverb": 35,
        "compression": 60,
        "notes": "Spaced pair capturing stereo cymbal wash and natural air.",
        "regions": [
          {
            "id": "r7",
            "start": 0,
            "end": 200
          }
        ],
        "solo": false,
        "mute": false
      }
    ]
  },
  {
    "id": "example-orchestral",
    "title": "Symphonic Horizon (Cinematic Film Score)",
    "genre": "Film Score / Orchestral",
    "bpm": 88,
    "description": "Immersive 3D concert hall stage: Concert seating perspective. Violins on the left, Cellos & Double Basses on the right, Woodwinds in the mid-depth center, and Brass & Timpani in the cavernous deep rear with lush concert hall reverberation.",
    "bubbles": [
      {
        "id": "ex-orch-timpani",
        "name": "Timpani & Gran Cassa",
        "category": "drums",
        "color": "#ef4444",
        "x": -25,
        "y": 18,
        "z": 75,
        "width": 45,
        "height": 32,
        "volume": 82,
        "saturation": 10,
        "reverb": 65,
        "compression": 55,
        "notes": "Back of stage left percussion riser.",
        "regions": [
          {
            "id": "r1",
            "start": 10,
            "end": 180
          }
        ],
        "solo": false,
        "mute": false
      },
      {
        "id": "ex-orch-bass",
        "name": "Double Basses",
        "category": "orchestral",
        "color": "#8b5cf6",
        "x": 62,
        "y": 22,
        "z": 42,
        "width": 44,
        "height": 38,
        "volume": 84,
        "saturation": 12,
        "reverb": 50,
        "compression": 50,
        "notes": "Stage right orchestral low anchor.",
        "regions": [
          {
            "id": "r2",
            "start": 0,
            "end": 210
          }
        ],
        "solo": false,
        "mute": false
      },
      {
        "id": "ex-orch-violins",
        "name": "1st & 2nd Violins",
        "category": "orchestral",
        "color": "#10b981",
        "x": -58,
        "y": 65,
        "z": 28,
        "width": 62,
        "height": 48,
        "volume": 85,
        "saturation": 8,
        "reverb": 45,
        "compression": 40,
        "notes": "Stage left sweeping melodic string section.",
        "regions": [
          {
            "id": "r3",
            "start": 0,
            "end": 210
          }
        ],
        "solo": false,
        "mute": false
      },
      {
        "id": "ex-orch-cellos",
        "name": "Cellos & Violas",
        "category": "orchestral",
        "color": "#059669",
        "x": 45,
        "y": 45,
        "z": 32,
        "width": 52,
        "height": 42,
        "volume": 82,
        "saturation": 10,
        "reverb": 45,
        "compression": 45,
        "notes": "Rich warm midrange counterpoint.",
        "regions": [
          {
            "id": "r4",
            "start": 0,
            "end": 210
          }
        ],
        "solo": false,
        "mute": false
      },
      {
        "id": "ex-orch-woodwinds",
        "name": "Woodwinds (Flute & Oboe)",
        "category": "orchestral",
        "color": "#06b6d4",
        "x": 0,
        "y": 72,
        "z": 48,
        "width": 42,
        "height": 38,
        "volume": 76,
        "saturation": 5,
        "reverb": 55,
        "compression": 35,
        "notes": "Center mid-stage delicate acoustic air.",
        "regions": [
          {
            "id": "r5",
            "start": 20,
            "end": 190
          }
        ],
        "solo": false,
        "mute": false
      },
      {
        "id": "ex-orch-brass",
        "name": "French Horns & Trombones",
        "category": "orchestral",
        "color": "#f59e0b",
        "x": 30,
        "y": 55,
        "z": 72,
        "width": 56,
        "height": 46,
        "volume": 86,
        "saturation": 22,
        "reverb": 68,
        "compression": 60,
        "notes": "Deep back-row heroic fanfares echoing off hall rear walls.",
        "regions": [
          {
            "id": "r6",
            "start": 40,
            "end": 185
          }
        ],
        "solo": false,
        "mute": false
      },
      {
        "id": "ex-orch-choir",
        "name": "Ethereal Choir",
        "category": "vocals",
        "color": "#ec4899",
        "x": 0,
        "y": 75,
        "z": 85,
        "width": 88,
        "height": 50,
        "volume": 72,
        "saturation": 5,
        "reverb": 88,
        "compression": 25,
        "notes": "Huge cathedral acoustic space encircling the orchestra.",
        "regions": [
          {
            "id": "r7",
            "start": 60,
            "end": 200
          }
        ],
        "solo": false,
        "mute": false
      }
    ]
  }
];
