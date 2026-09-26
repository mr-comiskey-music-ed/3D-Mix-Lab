import { SoundBubble, StudentSubmission, RosterStudentRow } from '../types';

// Simple lightweight deterministic hash for tamper verification
function calculateSignature(data: Omit<StudentSubmission, 'signature'>): string {
  const str = `${data.studentName}|${data.timestamp}|${data.totalStars}|${JSON.stringify(data.challengeScores)}`;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36).toUpperCase().padStart(8, '0');
}

export function encodeStudentSubmission(
  studentName: string,
  challengeScores: Record<string, number>,
  bubbles: SoundBubble[],
  songDuration: number
): string {
  const totalStars = Object.values(challengeScores).reduce((acc, curr) => acc + curr, 0);
  const rawData: Omit<StudentSubmission, 'signature'> = {
    version: '1.0',
    studentName: studentName.trim() || 'Anonymous Student',
    timestamp: new Date().toISOString(),
    challengeScores,
    totalStars,
    maxStars: 15,
    sandboxSnapshot: {
      bubbles,
      songDuration,
    },
  };

  const signature = calculateSignature(rawData);
  const fullSubmission: StudentSubmission = {
    ...rawData,
    signature,
  };

  const jsonStr = JSON.stringify(fullSubmission);
  const b64 = btoa(encodeURIComponent(jsonStr));
  return `VML-${b64}`;
}

export function decodeStudentSubmission(code: string): {
  success: boolean;
  submission?: StudentSubmission;
  isValidSignature?: boolean;
  error?: string;
} {
  try {
    const trimmed = code.trim();
    if (!trimmed.startsWith('VML-')) {
      return { success: false, error: 'Invalid code format: Missing VML- prefix' };
    }
    const b64 = trimmed.slice(4);
    const jsonStr = decodeURIComponent(atob(b64));
    const submission: StudentSubmission = JSON.parse(jsonStr);

    if (!submission.studentName || submission.totalStars === undefined) {
      return { success: false, error: 'Missing required submission fields' };
    }

    const { signature, ...rest } = submission;
    const expectedSig = calculateSignature(rest);
    const isValidSignature = signature === expectedSig;

    return {
      success: true,
      submission,
      isValidSignature,
    };
  } catch (err) {
    return {
      success: false,
      error: `Failed to decode submission code: ${(err as Error).message}`,
    };
  }
}

export function parseBatchRoster(batchInput: string): RosterStudentRow[] {
  const lines = batchInput.split(/\r?\n/);
  const rows: RosterStudentRow[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Search for VML-... in the line
    const match = trimmed.match(/VML-[A-Za-z0-9+/=_-]+/);
    if (match) {
      const code = match[0];
      const result = decodeStudentSubmission(code);
      if (result.success && result.submission) {
        const sub = result.submission;
        const percentage = Math.round((sub.totalStars / sub.maxStars) * 100);
        let status: 'Passed' | 'Needs Review' | 'Perfect' = 'Passed';
        if (sub.totalStars === sub.maxStars) {
          status = 'Perfect';
        } else if (percentage < 70) {
          status = 'Needs Review';
        }

        rows.push({
          studentName: sub.studentName,
          timestamp: sub.timestamp,
          totalStars: sub.totalStars,
          maxStars: sub.maxStars,
          percentage,
          status,
          rawCode: code,
          submission: sub,
        });
      }
    }
  }

  // Sort by highest score first, then name
  return rows.sort((a, b) => b.totalStars - a.totalStars || a.studentName.localeCompare(b.studentName));
}

export function generateRosterCSV(rows: RosterStudentRow[]): string {
  const headers = ['Student Name', 'Total Stars', 'Max Stars', 'Percentage', 'Status', 'Timestamp', 'Submission Signature'];
  const lines = rows.map((r) => [
    `"${r.studentName.replace(/"/g, '""')}"`,
    r.totalStars,
    r.maxStars,
    `"${r.percentage}%"`,
    `"${r.status}"`,
    `"${new Date(r.timestamp).toLocaleString()}"`,
    `"${r.submission.signature}"`,
  ].join(','));

  return [headers.join(','), ...lines].join('\n');
}
