import React, { useState } from 'react';
import { X, FileText, Download, Copy, Printer, Check, RefreshCw, Sparkles, Globe } from 'lucide-react';

interface SitRepModalProps {
  isOpen: boolean;
  onClose: () => void;
  sitRepText: string;
  isGenerating: boolean;
  onRegenerate: (lang: 'en' | 'ne') => void;
  language: 'en' | 'ne';
  setLanguage: (lang: 'en' | 'ne') => void;
}

export const SitRepModal: React.FC<SitRepModalProps> = ({
  isOpen,
  onClose,
  sitRepText,
  isGenerating,
  onRegenerate,
  language,
  setLanguage,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(sitRepText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([sitRepText], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Nepal_Terai_Flood_SitRep_${language.toUpperCase()}_${new Date().toISOString().slice(0, 10)}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-3xl w-full max-h-[92vh] flex flex-col text-slate-100 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-900/95 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-sky-950 border border-sky-800 flex items-center justify-center text-sky-400">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                <span>Official Humanitarian Situation Report (SitRep)</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-sky-950 text-sky-300 border border-sky-800 font-mono">
                  NDRRMA / ICIMOD Format
                </span>
              </h2>
              <div className="text-xs text-slate-400 mt-0.5">
                Automated multi-sensor synthesis &amp; operational response directive
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Language Switcher */}
            <div className="flex items-center gap-1 p-0.5 bg-slate-950 border border-slate-800 rounded-md text-xs mr-2">
              <button
                onClick={() => {
                  setLanguage('en');
                  onRegenerate('en');
                }}
                className={`px-2 py-1 rounded transition-colors ${
                  language === 'en' ? 'bg-sky-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                English
              </button>
              <button
                onClick={() => {
                  setLanguage('ne');
                  onRegenerate('ne');
                }}
                className={`px-2 py-1 rounded transition-colors ${
                  language === 'ne' ? 'bg-sky-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                नेपाली
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {isGenerating ? (
            <div className="flex flex-col items-center justify-center py-16 space-y-3">
              <RefreshCw className="w-8 h-8 text-sky-400 animate-spin" />
              <div className="text-sm font-semibold text-slate-200">
                Synthesizing SAR radar layers and generating situation report...
              </div>
              <div className="text-xs text-slate-500">
                Evaluating inundation vectors and settlement impact assessments
              </div>
            </div>
          ) : (
            <div className="bg-slate-950 border border-slate-800 rounded-lg p-6 font-mono text-xs leading-relaxed whitespace-pre-wrap text-slate-200 select-text">
              {sitRepText}
            </div>
          )}
        </div>

        {/* Actions Footer */}
        <div className="flex items-center justify-between p-4 border-t border-slate-800 bg-slate-950">
          <button
            onClick={() => onRegenerate(language)}
            disabled={isGenerating}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-900 border border-slate-800 rounded-md hover:bg-slate-800 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
            <span>Re-Synthesize</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-900 border border-slate-800 rounded-md hover:bg-slate-800 transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>

            <button
              onClick={handleDownload}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-900 border border-slate-800 rounded-md hover:bg-slate-800 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download (.md)</span>
            </button>

            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-950 bg-sky-400 rounded-md hover:bg-sky-300 transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / PDF</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
