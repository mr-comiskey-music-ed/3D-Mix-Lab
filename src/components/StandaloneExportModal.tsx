import React, { useState } from 'react';
import { generateStandaloneHtml } from '../utils/standaloneHtmlGenerator';
import {
  Code2,
  Copy,
  Check,
  Download,
  X,
  ExternalLink,
  FileCode,
  Sparkles
} from 'lucide-react';
import { ThemeMode } from '../types';

interface StandaloneExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme?: ThemeMode;
}

export const StandaloneExportModal: React.FC<StandaloneExportModalProps> = ({
  isOpen,
  onClose,
  theme = 'dark',
}) => {
  const [hasCopied, setHasCopied] = useState(false);
  const standaloneCode = generateStandaloneHtml();

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(standaloneCode);
    setHasCopied(true);
    setTimeout(() => setHasCopied(false), 2500);
  };

  const handleDownload = () => {
    const blob = new Blob([standaloneCode], { type: 'text/html;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'index.html');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 select-none">
      <div className={`border rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] ${
        theme === 'light' ? 'bg-white border-slate-300 text-slate-800' : 'bg-slate-900 border-slate-800 text-slate-300'
      }`}>
        {/* Header */}
        <div className={`p-4 border-b flex items-center justify-between ${
          theme === 'light' ? 'bg-slate-100 border-slate-200' : 'bg-slate-950/70 border-slate-800'
        }`}>
          <div className="flex items-center gap-2 text-indigo-500">
            <Code2 className="w-5 h-5" />
            <div>
              <h3 className={`font-bold text-sm ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
                Standalone HTML for Google Apps Script
              </h3>
              <p className={`text-[11px] ${theme === 'light' ? 'text-slate-600' : 'text-slate-400'}`}>
                Single-file self-contained bundle with React 18, Babel & Tailwind via CDNs
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-1 rounded ${theme === 'light' ? 'hover:bg-slate-200 text-slate-600 hover:text-slate-900' : 'hover:bg-slate-800 text-slate-400 hover:text-white'}`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className={`p-5 space-y-4 overflow-y-auto text-xs ${theme === 'light' ? 'text-slate-700' : 'text-slate-300'}`}>
          {/* Instructions banner */}
          <div className={`p-3.5 rounded-xl border space-y-2 ${
            theme === 'light' ? 'bg-indigo-50 border-indigo-200 text-slate-700' : 'bg-indigo-950/30 border-indigo-500/30 text-slate-300'
          }`}>
            <h4 className="font-bold text-indigo-600 flex items-center gap-1.5 text-xs">
              <Sparkles className="w-3.5 h-3.5" />
              <span>How to Deploy in Google Apps Script</span>
            </h4>
            <ol className={`list-decimal list-inside space-y-1 text-[11px] leading-relaxed ${theme === 'light' ? 'text-slate-700' : 'text-slate-300'}`}>
              <li>Create a new Google Apps Script project at <strong className={theme === 'light' ? 'text-slate-900' : 'text-white'}>script.google.com</strong>.</li>
              <li>In your Apps Script editor, add an HTML file named <code className={`px-1 py-0.5 rounded font-mono ${theme === 'light' ? 'text-indigo-600 bg-slate-200' : 'text-amber-300 bg-slate-950'}`}>index.html</code>.</li>
              <li>Paste the code below into <code className={`px-1 py-0.5 rounded font-mono ${theme === 'light' ? 'text-indigo-600 bg-slate-200' : 'text-amber-300 bg-slate-950'}`}>index.html</code>.</li>
              <li>In <code className={`px-1 py-0.5 rounded font-mono ${theme === 'light' ? 'text-indigo-600 bg-slate-200' : 'text-amber-300 bg-slate-950'}`}>Code.gs</code>, write:
                <div className={`font-mono p-2 rounded mt-1 ${theme === 'light' ? 'bg-slate-100 text-emerald-700' : 'bg-slate-950 text-emerald-300'}`}>
                  function doGet() &#123;<br />
                  &nbsp;&nbsp;return HtmlService.createHtmlOutputFromFile('index')<br />
                  &nbsp;&nbsp;&nbsp;&nbsp;.setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);<br />
                  &#125;
                </div>
              </li>
              <li>Deploy as a Web App with access set to "Anyone".</li>
            </ol>
          </div>

          {/* Code preview block */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className={`text-[11px] font-mono flex items-center gap-1 ${theme === 'light' ? 'text-slate-600' : 'text-slate-400'}`}>
                <FileCode className="w-3.5 h-3.5 text-indigo-500" />
                <span>Single-File index.html Preview</span>
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopy}
                  className="px-2.5 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center gap-1 shadow transition"
                >
                  {hasCopied ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{hasCopied ? 'Copied!' : 'Copy Entire HTML'}</span>
                </button>
                <button
                  onClick={handleDownload}
                  className={`px-2.5 py-1 rounded font-semibold text-xs flex items-center gap-1 border transition ${
                    theme === 'light' ? 'bg-slate-200 hover:bg-slate-300 text-slate-800 border-slate-300' : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                  }`}
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download index.html</span>
                </button>
              </div>
            </div>
            <textarea
              readOnly
              onClick={(e) => (e.target as HTMLTextAreaElement).select()}
              value={standaloneCode}
              rows={9}
              className={`w-full border rounded-xl p-3 font-mono text-[10px] select-all focus:outline-none resize-none leading-tight ${
                theme === 'light' ? 'bg-slate-100 border-slate-300 text-slate-800' : 'bg-slate-950 border-slate-800 text-slate-300'
              }`}
            />
          </div>
        </div>

        {/* Footer */}
        <div className={`p-3.5 border-t flex items-center justify-between ${
          theme === 'light' ? 'bg-slate-100 border-slate-200' : 'bg-slate-950/70 border-slate-800'
        }`}>
          <span className={`text-[11px] font-mono ${theme === 'light' ? 'text-slate-500' : 'text-slate-500'}`}>
            Self-contained standalone HTML bundle
          </span>
          <button
            onClick={onClose}
            className={`px-3.5 py-1.5 rounded-lg font-medium text-xs ${
              theme === 'light' ? 'bg-slate-200 hover:bg-slate-300 text-slate-800' : 'bg-slate-800 hover:bg-slate-700 text-white'
            }`}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
