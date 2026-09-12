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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200 text-[#263339]">
      {/* Modal Container */}
      <div 
        className="relative w-full max-w-5xl h-[92vh] max-h-[850px] bg-white border border-[#D8D6C9] rounded-2xl shadow-2xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Navigation Header */}
        <div className="px-4 py-3 bg-[#fbf9f5] border-b border-[#D8D6C9] flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center space-x-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-[#749190]/15 border border-[#749190]/30 flex items-center justify-center text-[#749190] shrink-0">
              <FileText className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h3 className="text-xs sm:text-sm font-bold text-[#263339] truncate max-w-[200px] sm:max-w-md md:max-w-lg">
                {title || 'Academic Document Preview'}
              </h3>
            </div>
          </div>

          {/* Action Controls */}
          <div className="flex items-center space-x-1.5 sm:space-x-2 shrink-0">
            {/* Viewer Mode Switcher */}
            <div className="hidden sm:flex items-center bg-white rounded-lg p-0.5 border border-[#D8D6C9] text-[10px]">
              <button
                onClick={() => { setViewerType('google'); setLoading(true); }}
                className={`px-2 py-1 rounded-md transition-all font-bold ${
                  viewerType === 'google' 
                    ? 'bg-[#749190] text-white shadow-xs' 
                    : 'text-[#465F64] hover:text-[#263339]'
                }`}
                title="Universal mobile-friendly cloud viewer"
              >
                Cloud Preview
              </button>
              <button
                onClick={() => { setViewerType('direct'); setLoading(true); }}
                className={`px-2 py-1 rounded-md transition-all font-bold ${
                  viewerType === 'direct' 
                    ? 'bg-[#749190] text-white shadow-xs' 
                    : 'text-[#465F64] hover:text-[#263339]'
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
              className="p-2 sm:px-3 sm:py-1.5 rounded-lg bg-white hover:bg-[#fbf9f5] border border-[#D8D6C9] text-[#465F64] hover:text-[#263339] text-xs flex items-center space-x-1.5 transition-colors font-medium"
              title="Open raw PDF in new tab"
            >
              <ExternalLink className="w-3.5 h-3.5 text-[#749190]" />
              <span className="hidden sm:inline">New Tab</span>
            </a>

            {/* Download Button */}
            <button
              onClick={handleDownload}
              className="p-2 sm:px-3 sm:py-1.5 rounded-lg bg-[#749190]/15 hover:bg-[#749190]/25 border border-[#749190]/30 text-[#749190] text-xs font-bold flex items-center space-x-1.5 transition-colors"
              title="Download PDF to device"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Download</span>
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-white hover:bg-red-50 hover:text-red-600 text-[#465F64] border border-[#D8D6C9] transition-colors"
              title="Close Preview"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* PDF Frame Body */}
        <div className="relative flex-1 w-full bg-[#f0ece1] flex items-center justify-center overflow-hidden">
          {loading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#f0ece1] z-10 space-y-3">
              <div className="w-8 h-8 border-2 border-[#749190] border-t-transparent rounded-full animate-spin"></div>
              <p className="text-xs text-[#465F64] font-semibold">Rendering PDF for your device...</p>
            </div>
          )}

          {hasError ? (
            <div className="p-6 text-center max-w-md space-y-4">
              <AlertCircle className="w-10 h-10 text-amber-500 mx-auto" />
              <h4 className="text-sm font-bold text-[#263339]">Browser Preview Restricted</h4>
              <p className="text-xs text-[#465F64] leading-relaxed">
                This device's browser is blocking embedded preview. You can open it directly in a new tab or download the file.
              </p>
              <div className="flex justify-center gap-3 pt-2">
                <a
                  href={cleanUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 rounded-xl bg-[#749190] text-white text-xs font-bold flex items-center space-x-1.5 hover:bg-[#5f7b7a] transition-colors shadow-sm"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open in Browser</span>
                </a>
                <button
                  onClick={handleDownload}
                  className="px-4 py-2 rounded-xl bg-white text-[#263339] text-xs font-bold flex items-center space-x-1.5 hover:bg-[#fbf9f5] transition-colors border border-[#D8D6C9]"
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
