'use client';

import { useState, useEffect } from 'react';
import { X, ExternalLink, Download, FileText, AlertCircle, RefreshCw } from 'lucide-react';

export default function PdfViewerModal({ isOpen, onClose, fileUrl, title }) {
  const [viewerType, setViewerType] = useState('google'); // 'google' | 'direct'
  const [loading, setLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      setHasError(false);
      setViewerType('google'); // Google Docs viewer works universally on all mobile & desktop browsers
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, fileUrl]);

  if (!isOpen || !fileUrl) return null;

  // Ensure valid URL with safe encoding
  const cleanUrl = fileUrl.trim();
  const encodedUrl = encodeURIComponent(cleanUrl);
  const googleDocsViewerUrl = `https://docs.google.com/viewer?url=${encodedUrl}&embedded=true`;

  const activeSrc = viewerType === 'google' ? googleDocsViewerUrl : cleanUrl;

  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = cleanUrl;
    a.download = `${title || 'document'}.pdf`;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200 text-[#f5efeb]">
      {/* Modal Container */}
      <div 
        className="relative w-full max-w-5xl h-[92vh] max-h-[850px] bg-[#241f1e] border border-[#463c39] rounded-2xl shadow-2xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Navigation Header */}
        <div className="px-4 py-3 bg-[#312a28] border-b border-[#463c39] flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center space-x-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-[#b5c7d3]/15 border border-[#b5c7d3]/30 flex items-center justify-center text-[#b5c7d3] shrink-0">
              <FileText className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h3 className="text-xs sm:text-sm font-bold text-[#f5efeb] truncate max-w-[200px] sm:max-w-md md:max-w-lg">
                {title || 'Academic Document Preview'}
              </h3>
            </div>
          </div>

          {/* Action Controls */}
          <div className="flex items-center space-x-1.5 sm:space-x-2 shrink-0">
            {/* Viewer Mode Switcher (helpful if google preview is slow) */}
            <div className="hidden sm:flex items-center bg-[#282220] rounded-lg p-0.5 border border-[#463c39] text-[10px]">
              <button
                onClick={() => { setViewerType('google'); setLoading(true); }}
                className={`px-2 py-1 rounded-md transition-all font-medium ${
                  viewerType === 'google' 
                    ? 'bg-[#b5c7d3] text-[#2c2624] font-bold shadow' 
                    : 'text-[#c8bfb8] hover:text-[#f5efeb]'
                }`}
                title="Universal mobile-friendly cloud viewer"
              >
                Cloud Preview
              </button>
              <button
                onClick={() => { setViewerType('direct'); setLoading(true); }}
                className={`px-2 py-1 rounded-md transition-all font-medium ${
                  viewerType === 'direct' 
                    ? 'bg-[#b5c7d3] text-[#2c2624] font-bold shadow' 
                    : 'text-[#c8bfb8] hover:text-[#f5efeb]'
                }`}
                title="Direct browser PDF render"
              >
                Direct
              </button>
            </div>

            {/* Direct Open in New Tab */}
            <a
              href={cleanUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 sm:px-3 sm:py-1.5 rounded-lg bg-[#282220] hover:bg-[#463c39] border border-[#463c39] text-[#c8bfb8] hover:text-[#f5efeb] text-xs flex items-center space-x-1.5 transition-colors"
              title="Open raw PDF in new tab"
            >
              <ExternalLink className="w-3.5 h-3.5 text-[#b5c7d3]" />
              <span className="hidden sm:inline font-medium">New Tab</span>
            </a>

            {/* Download Button */}
            <button
              onClick={handleDownload}
              className="p-2 sm:px-3 sm:py-1.5 rounded-lg bg-[#b5c7d3]/20 hover:bg-[#b5c7d3]/30 border border-[#b5c7d3]/30 text-[#f5efeb] text-xs flex items-center space-x-1.5 transition-colors"
              title="Download PDF to device"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline font-medium">Download</span>
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-[#282220] hover:bg-red-500/20 hover:text-red-300 text-[#c8bfb8] border border-[#463c39] transition-colors"
              title="Close Preview"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* PDF Frame Body */}
        <div className="relative flex-1 w-full bg-[#1a1615] flex items-center justify-center overflow-hidden">
          {loading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#1a1615] z-10 space-y-3">
              <div className="w-8 h-8 border-2 border-[#b5c7d3] border-t-transparent rounded-full animate-spin"></div>
              <p className="text-xs text-[#c8bfb8] font-medium">Rendering PDF for your device...</p>
            </div>
          )}

          {hasError ? (
            <div className="p-6 text-center max-w-md space-y-4">
              <AlertCircle className="w-10 h-10 text-amber-400 mx-auto" />
              <h4 className="text-sm font-bold text-[#f5efeb]">Browser Preview Restricted</h4>
              <p className="text-xs text-[#c8bfb8] leading-relaxed">
                This device's browser is blocking embedded preview. You can open it directly in a new tab or download the file.
              </p>
              <div className="flex justify-center gap-3 pt-2">
                <a
                  href={cleanUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 rounded-xl bg-[#b5c7d3] text-[#2c2624] text-xs font-bold flex items-center space-x-1.5 hover:bg-[#a3b8c8] transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open in Browser</span>
                </a>
                <button
                  onClick={handleDownload}
                  className="px-4 py-2 rounded-xl bg-[#312a28] text-[#f5efeb] text-xs font-semibold flex items-center space-x-1.5 hover:bg-[#463c39] transition-colors border border-[#463c39]"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </button>
              </div>
            </div>
          ) : (
            <iframe
              src={activeSrc}
              title={title || 'PDF Document'}
              className="w-full h-full border-0 bg-white"
              onLoad={() => setLoading(false)}
              onError={() => {
                setLoading(false);
                setHasError(true);
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
