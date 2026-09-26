import { SoundBubble } from '../types';

export interface FrequencyAssessment {
  hasWarning: boolean;
  type:
    | 'bass_too_high'
    | 'treble_too_low'
    | 'mid_too_low'
    | 'mid_too_high'
    | 'strings_horns_too_low'
    | 'strings_horns_too_high';
  title: string;
  message: string;
  expectedRange: string;
  recommendation: string;
}

export interface InstrumentFrequencyTarget {
  categoryLabel: string;
  min: number;
  max: number;
  formattedRange: string;
  description: string;
}

/**
 * 0%–30%: Bass instruments & low drums
 * (Kick/bass drums, 808s, electric bass, bass synth, tuba, double bass)
 */
export function isBassInstrument(name: string, category?: string): boolean {
  if (category === 'bass') return true;
  const n = name.toLowerCase().trim();
  if (n.includes('kick')) return true;
  if (n.includes('808')) return true;
  if (n.includes('bass') && !n.includes('bassoon')) return true;
  if (n.includes('tuba') || n.includes('sousaphone')) return true;
  if (n.includes('double bass') || n.includes('contrabass') || n.includes('upright bass')) return true;
  return false;
}

/**
 * 75%–100%: Hi-hats, shakers, tambourine, triangle, crash/ride
 */
export function isHighTrebleInstrument(name: string, category?: string): boolean {
  const n = name.toLowerCase().trim();
  if (n.includes('hi-hat') || n.includes('hihat') || n.includes('hats')) return true;
  if (n.includes('shaker') || n.includes('maraca') || n.includes('cabasa')) return true;
  if (n.includes('tambourine')) return true;
  if (n.includes('triangle')) return true;
  if (n.includes('crash') || n.includes('ride') || n.includes('cymbal') || n.includes('splash') || n.includes('china')) return true;
  if (n.includes('bell') || n.includes('chime')) return true;
  return false;
}

/**
 * 30%–90%: Everything in the strings/horns section of the instrument palette
 * (Violin, Cello, String Section, Brass/Horn Section, Saxophone, Trumpet, Flute, etc.)
 */
export function isStringsHornsSection(name: string, category?: string): boolean {
  // Exclude bass instruments like Tuba and Double Bass which are classified under Bass
  if (isBassInstrument(name, category)) return false;

  if (category === 'orchestral') return true;
  const n = name.toLowerCase().trim();
  if (n.includes('string') || n.includes('violin') || n.includes('cello') || n.includes('viola')) return true;
  if (n.includes('horn') || n.includes('brass') || n.includes('sax') || n.includes('trumpet') || n.includes('trombone')) return true;
  if (n.includes('flute') || n.includes('woodwind') || n.includes('orchestral') || n.includes('french horn')) return true;
  return false;
}

/**
 * 30%–80%: Snare, Tom, Vocals, Piano, Electric Piano, Organ, Guitars
 */
export function isMidHarmonicInstrument(name: string, category?: string): boolean {
  // Exclude bass instruments and high treble instruments
  if (isBassInstrument(name, category)) return false;
  if (isHighTrebleInstrument(name, category)) return false;
  if (isStringsHornsSection(name, category)) return false;

  const n = name.toLowerCase().trim();

  // Snare
  if (n.includes('snare')) return true;

  // Tom
  if (n.includes('tom')) return true;

  // Vocals
  if (category === 'vocals' || n.includes('vocal') || n.includes('vox') || n.includes('voice')) return true;

  // Piano & Electric Piano
  if (n.includes('piano') || n.includes('rhodes') || n.includes('wurlitzer')) return true;

  // Organ
  if (n.includes('organ') || n.includes('b3') || n.includes('hammond')) return true;

  // Guitars (Acoustic, Electric, Lead, Rhythm)
  if (category === 'guitars' || n.includes('guitar') || n.includes('guit')) return true;

  return false;
}

/**
 * Returns the target frequency range definition for an instrument.
 */
export function getInstrumentTargetRange(bubble: {
  name: string;
  category?: string;
}): InstrumentFrequencyTarget | null {
  const { name, category } = bubble;

  if (isBassInstrument(name, category)) {
    return {
      categoryLabel: 'Bass / Low Drums',
      min: 0,
      max: 30,
      formattedRange: '0% – 30%',
      description: 'Low-end foundation & sub-bass punch',
    };
  }

  if (isHighTrebleInstrument(name, category)) {
    return {
      categoryLabel: 'High Percussion & Cymbals',
      min: 75,
      max: 100,
      formattedRange: '75% – 100%',
      description: 'Air, top sparkle & metallic transients',
    };
  }

  if (isStringsHornsSection(name, category)) {
    return {
      categoryLabel: 'Strings / Horns Section',
      min: 30,
      max: 90,
      formattedRange: '30% – 90%',
      description: 'Orchestral melodic breadth & acoustic warmth',
    };
  }

  if (isMidHarmonicInstrument(name, category)) {
    return {
      categoryLabel: 'Mids / Harmonics / Vocals',
      min: 30,
      max: 80,
      formattedRange: '30% – 80%',
      description: 'Core harmonic body, backbeat & vocal presence',
    };
  }

  return null;
}

/**
 * Automatic assessment guidance for instrument placement along the Y-axis (Frequency).
 * Guidelines:
 * - 0–30%: Bass instruments & low drums
 * - 30–80%: Snare, Tom, Vocals, Piano, Electric Piano, Organ, Guitars
 * - 30–90%: Everything in the strings/horns section of the instrument palette
 * - 75–100%: Hi-hats, shakers, tambourine, triangle, crash/ride
 */
export function getFrequencyAssessment(bubble: {
  name: string;
  category?: string;
  y: number;
}): FrequencyAssessment | null {
  const { name, category, y } = bubble;

  // 1. Bass instruments & low drums (0% – 30%)
  if (isBassInstrument(name, category)) {
    if (y > 30) {
      return {
        hasWarning: true,
        type: 'bass_too_high',
        title: 'Bass Frequency Warning',
        message: `${name} is a low-end bass instrument that resonates primarily in the lower bass frequencies (0%–30%). Dragged above 30%, it loses sub-bass weight and muddies the mid-range.`,
        expectedRange: '0% – 30% (Low / Sub-Bass)',
        recommendation: 'Drag this instrument down into the 0%–30% zone on the frequency axis.',
      };
    }
    return null;
  }

  // 2. High-frequency metallic percussion (75% – 100%)
  if (isHighTrebleInstrument(name, category)) {
    if (y < 75) {
      return {
        hasWarning: true,
        type: 'treble_too_low',
        title: 'High Percussion Warning',
        message: `${name} creates bright acoustic transients that resonate in the higher treble register (75%–100%). Placing it below 75% clutters the vocals and midrange instruments.`,
        expectedRange: '75% – 100% (High Treble & Air)',
        recommendation: 'Drag this instrument up into the 75%–100% zone on the frequency axis.',
      };
    }
    return null;
  }

  // 3. Strings/Horns section (30% – 90%)
  if (isStringsHornsSection(name, category)) {
    if (y < 30) {
      return {
        hasWarning: true,
        type: 'strings_horns_too_low',
        title: 'Strings/Horns Low-End Warning',
        message: `${name} resonates across the orchestral 30%–90% frequency range. Placing it below 30% invades the sub-bass floor and muddies the kick/bass foundation.`,
        expectedRange: '30% – 90% (Strings & Horns)',
        recommendation: 'Drag this instrument up into the 30%–90% zone on the frequency axis.',
      };
    }
    if (y > 90) {
      return {
        hasWarning: true,
        type: 'strings_horns_too_high',
        title: 'Strings/Horns High-Frequency Warning',
        message: `${name} resonates across the orchestral 30%–90% frequency range. Placing it above 90% pushes it into the ultra-high air band where it thins out and clashes with cymbals.`,
        expectedRange: '30% – 90% (Strings & Horns)',
        recommendation: 'Drag this instrument down into the 30%–90% zone on the frequency axis.',
      };
    }
    return null;
  }

  // 4. Snare, Tom, Vocals, Piano, Electric Piano, Organ, Guitars (30% – 80%)
  if (isMidHarmonicInstrument(name, category)) {
    if (y < 30) {
      return {
        hasWarning: true,
        type: 'mid_too_low',
        title: 'Low-Mid Masking Warning',
        message: `${name} naturally resonates in the 30%–80% harmonic range. Placing it below 30% creates boomy frequency masking with the kick and bass foundation.`,
        expectedRange: '30% – 80% (Midrange & Harmonic)',
        recommendation: 'Drag this instrument up between 30% and 80% on the frequency axis.',
      };
    }
    if (y > 80) {
      return {
        hasWarning: true,
        type: 'mid_too_high',
        title: 'High-Frequency Clutter Warning',
        message: `${name} naturally resonates in the 30%–80% harmonic range. Placing it above 80% pushes it into the high sizzle/air zone where it conflicts with cymbals and metallic transients.`,
        expectedRange: '30% – 80% (Midrange & Harmonic)',
        recommendation: 'Drag this instrument down between 30% and 80% on the frequency axis.',
      };
    }
    return null;
  }

  return null;
}
