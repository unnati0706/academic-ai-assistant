'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useState } from 'react';
import { Check, Copy } from 'lucide-react';

/**
 * MarkdownRenderer — renders AI markdown responses with full formatting support:
 * headers, bold, italic, lists, tables, code blocks (with copy), blockquotes.
 */
export default function MarkdownRenderer({ content, className = '' }) {
  return (
    <div className={`markdown-body ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Headings
          h1: ({ children }) => (
            <h1 className="text-base font-bold text-white mt-4 mb-2 pb-1 border-b border-gray-700/50">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-sm font-bold text-indigo-300 mt-4 mb-2 flex items-center gap-2">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-xs font-bold text-purple-300 mt-3 mb-1.5">
              {children}
            </h3>
          ),
          h4: ({ children }) => (
            <h4 className="text-xs font-semibold text-cyan-300 mt-2 mb-1">
              {children}
            </h4>
          ),

          // Paragraphs
          p: ({ children }) => (
            <p className="text-[12.5px] text-gray-200 leading-relaxed mb-2.5">
              {children}
            </p>
          ),

          // Lists
          ul: ({ children }) => (
            <ul className="list-none space-y-1 mb-3 pl-1">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal list-inside space-y-1 mb-3 pl-2 text-[12px] text-gray-200">
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className="text-[12px] text-gray-200 flex items-start gap-2">
              <span className="text-indigo-400 mt-0.5 shrink-0">▸</span>
              <span>{children}</span>
            </li>
          ),

          // Bold & Italic
          strong: ({ children }) => (
            <strong className="font-semibold text-white">{children}</strong>
          ),
          em: ({ children }) => (
            <em className="italic text-gray-300">{children}</em>
          ),

          // Inline code
          code: ({ inline, className: codeClass, children, ...props }) => {
            const match = /language-(\w+)/.exec(codeClass || '');
            const lang = match ? match[1] : '';
            const codeContent = String(children).replace(/\n$/, '');

            if (inline) {
              return (
                <code className="bg-gray-800/80 border border-gray-700/60 rounded px-1.5 py-0.5 text-[11px] font-mono text-emerald-300">
                  {children}
                </code>
              );
            }

            return <CodeBlock lang={lang} code={codeContent} />;
          },

          // Blockquotes
          blockquote: ({ children }) => (
            <blockquote className="border-l-2 border-indigo-500/60 pl-3 my-2 text-gray-400 italic text-[12px] bg-indigo-500/5 rounded-r py-1">
              {children}
            </blockquote>
          ),

          // Tables
          table: ({ children }) => (
            <div className="overflow-x-auto my-3 rounded-lg border border-gray-700/50">
              <table className="w-full text-[11px] border-collapse">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-gray-800/80">{children}</thead>
          ),
          tbody: ({ children }) => (
            <tbody className="divide-y divide-gray-800/50">{children}</tbody>
          ),
          tr: ({ children }) => (
            <tr className="hover:bg-gray-800/30 transition-colors">{children}</tr>
          ),
          th: ({ children }) => (
            <th className="px-3 py-2 text-left text-[10px] font-bold text-indigo-300 uppercase tracking-wider border-b border-gray-700/50">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="px-3 py-2 text-gray-300">{children}</td>
          ),

          // Horizontal rule
          hr: () => (
            <hr className="border-gray-700/50 my-3" />
          ),

          // Links
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noreferrer"
              className="text-indigo-400 hover:text-indigo-300 underline underline-offset-2 transition-colors"
            >
              {children}
            </a>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

/** Code block with syntax highlighting and copy button */
function CodeBlock({ lang, code }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="relative my-3 rounded-xl overflow-hidden border border-gray-700/60 bg-[#0d1117]">
      {/* Header bar */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-gray-800/80 border-b border-gray-700/60">
        <span className="text-[10px] font-mono text-gray-400 uppercase tracking-wider">
          {lang || 'code'}
        </span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 text-[10px] text-gray-400 hover:text-white transition-colors px-2 py-0.5 rounded hover:bg-gray-700/50"
        >
          {copied ? (
            <>
              <Check className="w-3 h-3 text-emerald-400" />
              <span className="text-emerald-400">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3 h-3" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      {/* Code content */}
      <pre className="p-4 overflow-x-auto text-[11.5px] font-mono text-gray-200 leading-relaxed whitespace-pre">
        <code>{code}</code>
      </pre>
    </div>
  );
}
