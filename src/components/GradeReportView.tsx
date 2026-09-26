import React, { useState } from 'react';
import { SoundBubble, StudentSubmission, RosterStudentRow } from '../types';
import {
  encodeStudentSubmission,
  decodeStudentSubmission,
  parseBatchRoster,
  generateRosterCSV
} from '../utils/serialization';
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
  onImportStudentMix: (bubbles: SoundBubble[], songDuration: number) => void;
  onSwitchToSandbox: () => void;
}

export const GradeReportView: React.FC<GradeReportViewProps> = ({
  challengeScores,
  sandboxBubbles,
  songDuration,
  onImportStudentMix,
  onSwitchToSandbox,
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

  // Teacher Batch Roster State
  const [batchInput, setBatchInput] = useState('');
  const [rosterRows, setRosterRows] = useState<RosterStudentRow[]>([]);

  const totalStars = (Object.values(challengeScores) as number[]).reduce((acc: number, curr: number) => acc + curr, 0);
  const maxStars = 15;
  const gradePercentage = Math.round((totalStars / maxStars) * 100);

  let letterGrade = 'F';
  if (gradePercentage >= 90) letterGrade = 'A';
  else if (gradePercentage >= 80) letterGrade = 'B';
  else if (gradePercentage >= 70) letterGrade = 'C';
  else if (gradePercentage >= 60) letterGrade = 'D';

  const handleGenerateSubmission = (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentName.trim()) return;

    const code = encodeStudentSubmission(
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

  const handleInspectSingleCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inspectionCode.trim()) return;

    const res = decodeStudentSubmission(inspectionCode.trim());
    setInspectionResult({
      tested: true,
      ...res,
    });
  };

  const handleProcessBatchRoster = () => {
    if (!batchInput.trim()) return;
    const rows = parseBatchRoster(batchInput);
    setRosterRows(rows);
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
  };

  const handleLoadStudentIntoSandbox = (submission: StudentSubmission) => {
    if (submission.sandboxSnapshot?.bubbles) {
      onImportStudentMix(
        submission.sandboxSnapshot.bubbles,
        submission.sandboxSnapshot.songDuration || 210
      );
      onSwitchToSandbox();
    }
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
              Cryptographically verified submission generator and teacher batch gradebook for Google Classroom / LMS.
            </p>
          </div>

          <div className="flex items-center gap-4 bg-slate-900 p-3 rounded-2xl border border-slate-800">
            <div className="text-right">
              <span className="text-[11px] font-mono text-slate-400 block uppercase">Mixing Mastery</span>
              <span className="text-sm font-bold text-amber-300">
                ⭐ {totalStars} / {maxStars} Stars ({gradePercentage}%)
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
                Locks your diagnostic challenge scores and bundles a complete snapshot of your current Sandbox stage and DAW timeline blocks into an encrypted verification code.
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
                    <span className="text-amber-300 font-bold">{totalStars} / 15 Stars ({gradePercentage}%)</span>
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
                Paste any student's <code className="text-indigo-300 font-mono">VML-...</code> code to inspect their earned stars, verify tampering signature, and load their exact mix diagram into the Sandbox.
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
                            ⭐ {inspectionResult.submission.totalStars} / {inspectionResult.submission.maxStars} Stars ({Math.round((inspectionResult.submission.totalStars / inspectionResult.submission.maxStars) * 100)}%)
                          </span>
                        </div>
                        <button
                          onClick={() => handleLoadStudentIntoSandbox(inspectionResult.submission!)}
                          className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center gap-1.5 shadow-md transition"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>Import & Inspect Mix</span>
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
              <button
                onClick={handleExportCSV}
                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow transition"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Gradebook CSV</span>
              </button>
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
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shrink-0 shadow-lg shadow-indigo-600/30 transition"
            >
              <span>Process Roster</span>
            </button>
          </div>

          {/* Roster Table */}
          {rosterRows.length > 0 && (
            <div className="mt-4 border border-slate-800 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-950 text-slate-400 font-mono uppercase text-[10px] border-b border-slate-800">
                  <tr>
                    <th className="p-3">Student Name</th>
                    <th className="p-3">Stars Earned</th>
                    <th className="p-3">Grade %</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Submitted At</th>
                    <th className="p-3 text-right">Mix Diagram</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80 bg-slate-900/40">
                  {rosterRows.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/50 transition">
                      <td className="p-3 font-semibold text-white">{row.studentName}</td>
                      <td className="p-3 text-amber-300 font-mono font-bold">
                        ⭐ {row.totalStars} / {row.maxStars}
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
                          onClick={() => handleLoadStudentIntoSandbox(row.submission)}
                          className="px-2.5 py-1 rounded bg-slate-800 hover:bg-indigo-600 text-slate-300 hover:text-white font-medium text-xs transition"
                        >
                          Inspect Mix
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
