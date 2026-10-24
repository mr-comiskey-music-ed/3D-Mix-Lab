import React, { useState } from 'react';
import { SoundBubble, StudentSubmission, RosterStudentRow } from '../types';
import {
  encodeStudentSubmission,
  decodeStudentSubmission,
  parseBatchRoster,
  generateRosterCSV,
  RosterParseResult,
  MAX_STARS,
} from '../utils/serialization';
import { checksPassed, overallPercent, letterFor, TOTAL_CHECKS } from '../utils/progress';
import {
  GraduationCap,
  Lock,
  Copy,
  Check,
  Award,
  Star,
  Users,
  Search,
  Download,
  Upload,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  ShieldAlert
} from 'lucide-react';

interface GradeReportViewProps {
  challengeScores: Record<string, number>;
  sandboxBubbles: SoundBubble[];
  songDuration: number;
  /** The class list lives in App so it survives switching tabs while reviewing students. */
  roster: RosterParseResult | null;
  onRosterChange: (roster: RosterParseResult | null) => void;
  rosterInput: string;
  onRosterInputChange: (text: string) => void;
  /** Open these students' mixes in the Sandbox one at a time, starting at `index`. */
  onReviewStudents: (rows: RosterStudentRow[], index: number) => void;
}

export const GradeReportView: React.FC<GradeReportViewProps> = ({
  challengeScores,
  sandboxBubbles,
  songDuration,
  roster,
  onRosterChange,
  rosterInput: batchInput,
  onRosterInputChange: setBatchInput,
  onReviewStudents,
}) => {
  const [studentName, setStudentName] = useState('');
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [hasCopied, setHasCopied] = useState(false);

  // Teacher Single Inspection State
  const [inspectionCode, setInspectionCode] = useState('');
  const [inspectionResult, setInspectionResult] = useState<{
    tested: boolean;
    success: boolean;
    submission?: StudentSubmission;
    isValidSignature?: boolean;
    error?: string;
  } | null>(null);

  const rosterRows: RosterStudentRow[] = roster?.rows ?? [];
  const [isWorking, setIsWorking] = useState(false);

  const passedChecks = checksPassed(challengeScores);
  const gradePercentage = overallPercent(challengeScores);

  let letterGrade = 'F';
  if (gradePercentage >= 90) letterGrade = 'A';
  else if (gradePercentage >= 80) letterGrade = 'B';
  else if (gradePercentage >= 70) letterGrade = 'C';
  else if (gradePercentage >= 60) letterGrade = 'D';

  const handleGenerateSubmission = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentName.trim()) return;

    const code = await encodeStudentSubmission(
      studentName.trim(),
      challengeScores,
      sandboxBubbles,
      songDuration
    );
    setGeneratedCode(code);
    setHasCopied(false);
  };

  const handleCopyCode = () => {
    if (!generatedCode) return;
    navigator.clipboard.writeText(generatedCode);
    setHasCopied(true);
    setTimeout(() => setHasCopied(false), 2500);
  };

  const handleInspectSingleCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inspectionCode.trim()) return;

    const res = await decodeStudentSubmission(inspectionCode.trim());
    setInspectionResult({
      tested: true,
      ...res,
    });
  };

  const handleProcessBatchRoster = async () => {
    if (!batchInput.trim()) return;
    setIsWorking(true);
    try {
      onRosterChange(await parseBatchRoster(batchInput));
    } finally {
      setIsWorking(false);
    }
  };

  const handleExportCSV = () => {
    if (rosterRows.length === 0) return;
    const csv = generateRosterCSV(rosterRows);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `visual_mix_lab_grades_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Open a single inspected code in review mode (your own mix is never overwritten).
  const handleReviewSingle = (submission: StudentSubmission) => {
    const percentage = Math.round((submission.totalStars / (submission.maxStars || MAX_STARS)) * 100);
    onReviewStudents(
      [
        {
          studentName: submission.studentName,
          timestamp: submission.timestamp,
          totalStars: submission.totalStars,
          maxStars: submission.maxStars,
          percentage,
          status: percentage === 100 ? 'Perfect' : percentage < 70 ? 'Needs Review' : 'Passed',
          rawCode: inspectionCode.trim(),
          submission,
        },
      ],
      0
    );
  };

  return (
    <div id="grade-report-view" className="w-full h-full p-6 overflow-y-auto bg-slate-950 text-slate-100">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between pb-6 border-b border-slate-800">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <GraduationCap className="w-6 h-6 text-indigo-400" />
              <span>Student Grade Report & Roster Inspection</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Make a submission code for Google Classroom, or (teachers) read and review a whole class's codes.
            </p>
          </div>

          <div className="flex items-center gap-4 bg-slate-900 p-3 rounded-2xl border border-slate-800">
            <div className="text-right">
              <span className="text-[11px] font-mono text-slate-400 block uppercase">Mixing Mastery</span>
              <span className="text-sm font-bold text-amber-300">
                {gradePercentage}% · {passedChecks} of {TOTAL_CHECKS} checks
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/40 text-indigo-300 flex items-center justify-center font-extrabold text-base">
              {letterGrade}
            </div>
          </div>
        </div>

        {/* Two Column Section: Student Submission Generator & Teacher Single Inspector */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Panel 1: Student Lock & Submit */}
          <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-indigo-400 mb-3">
                <Lock className="w-4 h-4" />
                <h3 className="font-bold text-sm text-white">Student Submission Generator</h3>
              </div>
              <p className="text-xs text-slate-400 mb-4">
                Locks your diagnostic challenge scores and bundles a complete snapshot of your current Sandbox stage and DAW timeline blocks into one code you can paste into Google Classroom.
              </p>

              <form onSubmit={handleGenerateSubmission} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Student Full Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Alex Chen"
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 text-xs space-y-1.5 font-mono">
                  <div className="flex justify-between text-slate-400">
                    <span>Challenges Score:</span>
                    <span className="text-amber-300 font-bold">{gradePercentage}% ({passedChecks} of {TOTAL_CHECKS} checks)</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Sandbox Diagram Stems:</span>
                    <span className="text-indigo-300 font-bold">{sandboxBubbles.length} Tracks</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Arrangement Timeline:</span>
                    <span className="text-emerald-400 font-bold">Included</span>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition"
                >
                  <Lock className="w-4 h-4" />
                  <span>Lock & Generate Submission Code</span>
                </button>
              </form>

              {/* Generated Code Output Box */}
              {generatedCode && (
                <div className="mt-4 pt-4 border-t border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                      <Award className="w-3.5 h-3.5" />
                      <span>Submission Code Generated!</span>
                    </span>
                    <button
                      onClick={handleCopyCode}
                      className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1 transition"
                    >
                      {hasCopied ? <Check className="w-3 h-3 text-white" /> : <Copy className="w-3 h-3" />}
                      <span>{hasCopied ? 'Copied!' : 'Copy Code'}</span>
                    </button>
                  </div>
                  <textarea
                    readOnly
                    onClick={(e) => (e.target as HTMLTextAreaElement).select()}
                    value={generatedCode}
                    rows={3}
                    className="w-full bg-slate-950 border border-emerald-500/40 rounded-xl p-2.5 font-mono text-[11px] text-emerald-300 select-all focus:outline-none resize-none"
                  />
                  <p className="text-[10px] text-slate-500">
                    Paste this code into your Google Classroom assignment or email it to your instructor.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Panel 2: Teacher Single Submission Check */}
          <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-sky-400 mb-3">
                <Search className="w-4 h-4" />
                <h3 className="font-bold text-sm text-white">Teacher Inspection: Single Code</h3>
              </div>
              <p className="text-xs text-slate-400 mb-4">
                Paste any student's <code className="text-indigo-300 font-mono">VML-...</code> code to see their challenge results, check it wasn't edited, and review their mix in the Sandbox (your own mix isn't changed).
              </p>

              <form onSubmit={handleInspectSingleCode} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Student Submission Code
                  </label>
                  <textarea
                    required
                    placeholder="Paste VML-... string here"
                    value={inspectionCode}
                    onChange={(e) => setInspectionCode(e.target.value)}
                    rows={2}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs font-mono text-white focus:outline-none focus:border-indigo-500 resize-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700 flex items-center justify-center gap-2 transition"
                >
                  <Search className="w-4 h-4 text-sky-400" />
                  <span>Verify & Inspect Code</span>
                </button>
              </form>

              {/* Inspection Result Preview */}
              {inspectionResult && inspectionResult.tested && (
                <div className="mt-4 pt-4 border-t border-slate-800">
                  {inspectionResult.success && inspectionResult.submission ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-bold text-sm text-white block">
                            {inspectionResult.submission.studentName}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {new Date(inspectionResult.submission.timestamp).toLocaleString()}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {inspectionResult.isValidSignature ? (
                            <span className="flex items-center gap-1 text-[11px] font-mono text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-500/30">
                              <ShieldCheck className="w-3.5 h-3.5" />
                              <span>Signature Verified</span>
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-[11px] font-mono text-red-400 bg-red-950/40 px-2 py-0.5 rounded border border-red-500/30">
                              <ShieldAlert className="w-3.5 h-3.5" />
                              <span>Tampered!</span>
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
                        <div>
                          <span className="text-slate-400 block text-[11px]">Challenges Earned:</span>
                          <span className="font-bold text-amber-300">
                            {Math.round((inspectionResult.submission.totalStars / (inspectionResult.submission.maxStars || 1)) * 100)}% ({inspectionResult.submission.totalStars} of {inspectionResult.submission.maxStars} checks)
                          </span>
                        </div>
                        <button
                          onClick={() => handleReviewSingle(inspectionResult.submission!)}
                          className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center gap-1.5 shadow-md transition"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>Review Mix</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 bg-red-950/30 border border-red-500/40 rounded-xl text-red-400 text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{inspectionResult.error || 'Invalid code structure'}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Batch Roster Grader Section */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-indigo-400">
              <Users className="w-4 h-4" />
              <h3 className="font-bold text-sm text-white">Batch Roster Grader (Whole Class)</h3>
            </div>
            {rosterRows.length > 0 && (
              <div className="flex items-center gap-2">
              <button
                onClick={() => onReviewStudents(rosterRows, 0)}
                className="px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow transition"
                title="Open each student's mix in the Sandbox, one at a time (← → to move between students)"
              >
                <Search className="w-3.5 h-3.5" />
                <span>Review one by one</span>
              </button>
              <button
                onClick={handleExportCSV}
                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow transition"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Gradebook CSV</span>
              </button>
              </div>
            )}
          </div>

          <p className="text-xs text-slate-400">
            Paste multiple student codes at once (one per line, or pasted from a Google Classroom assignment submission list).
          </p>

          <div className="flex flex-col sm:flex-row gap-3">
            <textarea
              placeholder="Paste student submission codes here (e.g. VML-eyJzdHVkZW50...)..."
              value={batchInput}
              onChange={(e) => setBatchInput(e.target.value)}
              rows={3}
              className="flex-1 bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-mono text-white focus:outline-none focus:border-indigo-500 resize-none"
            />
            <button
              onClick={handleProcessBatchRoster}
              disabled={isWorking}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white font-bold text-xs flex items-center justify-center gap-1.5 shrink-0 shadow-lg shadow-indigo-600/30 transition"
            >
              <span>{isWorking ? 'Reading codes…' : 'Process Roster'}</span>
            </button>
          </div>

          {/* What happened to everything that was pasted */}
          {roster && (
            <div className="text-xs space-y-1">
              <p className="text-slate-300">
                Read <span className="font-bold text-white">{roster.rows.length}</span> submission
                {roster.rows.length === 1 ? '' : 's'}
                {roster.duplicatesRemoved > 0 && (
                  <span className="text-slate-400"> · skipped {roster.duplicatesRemoved} exact duplicate{roster.duplicatesRemoved === 1 ? '' : 's'}</span>
                )}
                .
              </p>
              {roster.unreadable.length > 0 && (
                <p className="text-amber-300 flex items-start gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <span>
                    Couldn't read {roster.unreadable.length} code{roster.unreadable.length === 1 ? '' : 's'} (cut off or edited):{' '}
                    <span className="font-mono text-amber-200/80">{roster.unreadable.join(', ')}</span>. Ask
                    {roster.unreadable.length === 1 ? ' that student' : ' those students'} to copy their code again.
                  </span>
                </p>
              )}
            </div>
          )}

          {/* Roster Table */}
          {rosterRows.length > 0 && (
            <div className="mt-4 border border-slate-800 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-950 text-slate-400 font-mono uppercase text-[10px] border-b border-slate-800">
                  <tr>
                    <th className="p-3">Student Name</th>
                    <th className="p-3">Checks Passed</th>
                    <th className="p-3">Grade %</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Submitted At</th>
                    <th className="p-3 text-right">Mix Diagram</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80 bg-slate-900/40">
                  {rosterRows.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/50 transition">
                      <td className="p-3 font-semibold text-white">
                        {row.studentName}
                        {row.hasMultipleSubmissions && (
                          <span className="ml-2 text-[10px] font-normal text-amber-300" title="This student submitted more than one code">
                            more than one code
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-amber-300 font-mono font-bold">
                        {row.totalStars} / {row.maxStars}
                      </td>
                      <td className="p-3 font-mono text-slate-300">{row.percentage}%</td>
                      <td className="p-3">
                        <span
                          className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                            row.status === 'Perfect'
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                              : row.status === 'Passed'
                              ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
                              : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                          }`}
                        >
                          {row.status}
                        </span>
                      </td>
                      <td className="p-3 text-slate-400 text-[11px] font-mono">
                        {new Date(row.timestamp).toLocaleDateString()} {new Date(row.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => onReviewStudents(rosterRows, idx)}
                          className="px-2.5 py-1 rounded bg-slate-800 hover:bg-indigo-600 text-slate-300 hover:text-white font-medium text-xs transition"
                        >
                          Review
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
