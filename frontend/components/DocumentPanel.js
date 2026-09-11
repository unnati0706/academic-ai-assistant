'use client';

import { useState, useEffect } from 'react';
import { FileText, Hash, BookOpen, Layers, Tag, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';

/**
 * DocumentPanel — shows rich document intelligence metadata after upload.
 * Displays: filename, page/word count, detected key topics as chips, section headings.
 * Animated entry with staggered reveal.
 */
export default function DocumentPanel({ metadata, onAskFollowUp }) {
  const [expanded, setExpanded] = useState(true);
  const [visibleTopics, setVisibleTopics] = useState(0);

  const {
    filename = 'Document',
    page_count = 0,
    word_count = 0,
    char_count = 0,
    key_topics = [],
    sections_found = []
  } = metadata || {};

  // Staggered reveal of topic chips
  useEffect(() => {
    if (!key_topics.length) return;
    let i = 0;
    const timer = setInterval(() => {
      i++;
      setVisibleTopics(i);
      if (i >= key_topics.length) clearInterval(timer);
    }, 60);
    return () => clearInterval(timer);
  }, [key_topics]);

  const followUpQuestions = [
    `Summarize the main ideas in ${filename}`,
    `What are the key formulas or algorithms in this document?`,
    `List all important definitions from this document`,
    `Generate 5 exam questions based on this document`,
  ];

  if (!metadata) return null;

  return (
    <div className="doc-panel animate-slide-in">
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 cursor-pointer select-none"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-emerald-300 uppercase tracking-wider">Document Intelligence</p>
            <p className="text-[10px] text-gray-500 truncate max-w-[180px]">{filename}</p>
          </div>
        </div>
        <button className="text-gray-500 hover:text-gray-300 transition-colors">
          {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {expanded && (
        <div className="px-4 pb-4 space-y-3.5">
          {/* Stats row */}
          <div className="grid grid-cols-3 gap-2">
            <StatCard icon={<FileText className="w-3 h-3" />} label="Pages" value={page_count} color="indigo" />
            <StatCard icon={<Hash className="w-3 h-3" />} label="Words" value={word_count >= 1000 ? `${(word_count / 1000).toFixed(1)}k` : word_count} color="purple" />
            <StatCard icon={<BookOpen className="w-3 h-3" />} label="Sections" value={sections_found.length || '—'} color="cyan" />
          </div>

          {/* Key Topics */}
          {key_topics.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <Tag className="w-3 h-3 text-amber-400" />
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Key Topics Detected</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {key_topics.slice(0, visibleTopics).map((topic, i) => (
                  <button
                    key={i}
                    onClick={() => onAskFollowUp && onAskFollowUp(`Explain "${topic}" from this document`)}
                    className="topic-chip"
                    style={{ animationDelay: `${i * 40}ms` }}
                    title={`Ask about: ${topic}`}
                  >
                    {topic}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Detected Sections */}
          {sections_found.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <Layers className="w-3 h-3 text-cyan-400" />
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Detected Sections</span>
              </div>
              <div className="space-y-1">
                {sections_found.slice(0, 5).map((sec, i) => (
                  <div key={i} className="text-[11px] text-gray-400 flex items-center gap-1.5 px-2 py-1 rounded-lg hover:bg-gray-800/40 transition-colors">
                    <span className="text-gray-600 font-mono text-[10px]">{String(i + 1).padStart(2, '0')}</span>
                    <span className="truncate">{sec}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick follow-up questions */}
          {onAskFollowUp && (
            <div>
              <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">
                💬 Ask a follow-up
              </div>
              <div className="space-y-1.5">
                {followUpQuestions.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => onAskFollowUp(q)}
                    className="w-full text-left text-[11px] text-gray-400 hover:text-indigo-300 px-2.5 py-1.5 rounded-lg hover:bg-indigo-500/10 border border-transparent hover:border-indigo-500/20 transition-all flex items-start gap-2"
                  >
                    <span className="text-indigo-500 shrink-0 mt-0.5">›</span>
                    <span className="leading-relaxed">{q}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <style jsx>{`
        .doc-panel {
          background: linear-gradient(135deg, rgba(16, 185, 129, 0.04) 0%, rgba(6, 182, 212, 0.04) 100%);
          border: 1px solid rgba(16, 185, 129, 0.2);
          border-radius: 12px;
          overflow: hidden;
        }

        .topic-chip {
          padding: 3px 10px;
          border-radius: 999px;
          font-size: 10px;
          font-weight: 600;
          background: linear-gradient(135deg, rgba(245, 158, 11, 0.12), rgba(234, 179, 8, 0.08));
          border: 1px solid rgba(245, 158, 11, 0.3);
          color: #fbbf24;
          transition: all 0.15s ease;
          animation: fadeInScale 0.2s ease forwards;
          opacity: 0;
        }

        .topic-chip:hover {
          background: linear-gradient(135deg, rgba(245, 158, 11, 0.25), rgba(234, 179, 8, 0.18));
          border-color: rgba(245, 158, 11, 0.5);
          color: #fde68a;
          transform: translateY(-1px);
        }

        @keyframes fadeInScale {
          from { opacity: 0; transform: scale(0.8); }
          to { opacity: 1; transform: scale(1); }
        }

        .animate-slide-in {
          animation: slideIn 0.35s ease forwards;
        }

        @keyframes slideIn {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

function StatCard({ icon, label, value, color }) {
  const colorMap = {
    indigo: 'text-indigo-300 bg-indigo-500/10 border-indigo-500/20',
    purple: 'text-purple-300 bg-purple-500/10 border-purple-500/20',
    cyan: 'text-cyan-300 bg-cyan-500/10 border-cyan-500/20',
    emerald: 'text-emerald-300 bg-emerald-500/10 border-emerald-500/20',
  };

  return (
    <div className={`rounded-lg border px-2.5 py-2 ${colorMap[color] || colorMap.indigo}`}>
      <div className={`flex items-center gap-1 mb-1 opacity-70`}>{icon}<span className="text-[9px] uppercase tracking-wider font-bold">{label}</span></div>
      <div className="text-sm font-bold">{value}</div>
    </div>
  );
}
