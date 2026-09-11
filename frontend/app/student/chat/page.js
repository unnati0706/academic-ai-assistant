'use client';

import { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  MessageSquare, Plus, Send, Sparkles, BookOpen, ExternalLink,
  Bot, User, FileText, X, Paperclip, Copy, Check, Upload,
  Brain, ChevronRight, Zap, RefreshCw
} from 'lucide-react';
import { api } from '@/lib/api';
import MarkdownRenderer from '@/components/MarkdownRenderer';
import DocumentPanel from '@/components/DocumentPanel';

// ─── Typing Animation Hook ────────────────────────────────────────────────────
function useTypingAnimation(text, speed = 8) {
  const [displayed, setDisplayed] = useState('');
  const [done, setDone] = useState(false);
  const frameRef = useRef(null);

  useEffect(() => {
    if (!text) { setDisplayed(''); setDone(true); return; }
    setDisplayed('');
    setDone(false);

    let i = 0;
    const totalChars = text.length;

    // Adaptive speed: longer texts reveal faster
    const charsPerFrame = totalChars > 2000 ? 12 : totalChars > 800 ? 6 : 3;

    function tick() {
      i += charsPerFrame;
      if (i >= totalChars) {
        setDisplayed(text);
        setDone(true);
        return;
      }
      setDisplayed(text.slice(0, i));
      frameRef.current = requestAnimationFrame(tick);
    }
    frameRef.current = requestAnimationFrame(tick);
    return () => { if (frameRef.current) cancelAnimationFrame(frameRef.current); };
  }, [text, speed]);

  return { displayed, done };
}

// ─── Single Message Component ─────────────────────────────────────────────────
function ChatMessage({ msg, isLatest, onCitationClick, onAskFollowUp }) {
  const [copied, setCopied] = useState(false);
  const isUser = msg.role === 'user';
  const isAssistant = msg.role === 'assistant';
  const animate = isAssistant && isLatest && !msg._static;

  const { displayed, done } = useTypingAnimation(
    animate ? msg.content : null
  );

  const displayContent = animate ? displayed : msg.content;

  const handleCopy = () => {
    navigator.clipboard.writeText(msg.content || '').then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className={`flex items-start gap-3 group ${isUser ? 'justify-end' : 'justify-start'} msg-enter`}>
      {/* AI Avatar */}
      {isAssistant && (
        <div className="w-8 h-8 rounded-xl gradient-bg flex items-center justify-center text-white shrink-0 shadow-lg shadow-indigo-500/20 mt-0.5">
          <Bot className="w-4 h-4" />
        </div>
      )}

      <div className={`flex flex-col gap-1 ${isUser ? 'items-end' : 'items-start'} max-w-[85%]`}>
        {/* Message bubble */}
        <div
          className={`rounded-2xl px-4 py-3 relative ${
            isUser
              ? 'bg-gradient-to-br from-indigo-600 to-indigo-700 text-white shadow-lg shadow-indigo-600/20 rounded-tr-sm'
              : 'bg-gray-900/95 border border-gray-800/80 text-gray-200 rounded-tl-sm shadow-md'
          }`}
        >
          {isUser ? (
            <p className="text-[12.5px] leading-relaxed whitespace-pre-wrap">{msg.content}</p>
          ) : (
            <>
              <MarkdownRenderer content={displayContent || '...'} />
              {/* Typing cursor */}
              {animate && !done && (
                <span className="inline-block w-0.5 h-3.5 bg-indigo-400 ml-0.5 animate-pulse rounded-full" />
              )}
            </>
          )}

          {/* Copy button (assistant only) */}
          {isAssistant && done && (
            <button
              onClick={handleCopy}
              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-md bg-gray-800/80 hover:bg-gray-700 text-gray-400 hover:text-white"
              title="Copy response"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            </button>
          )}
        </div>

        {/* Document Intelligence Panel (only on upload messages) */}
        {isAssistant && msg.document_metadata && done && (
          <div className="w-full mt-1">
            <DocumentPanel
              metadata={msg.document_metadata}
              onAskFollowUp={onAskFollowUp}
            />
          </div>
        )}

        {/* Source Citations */}
        {isAssistant && msg.cited_sources && msg.cited_sources.length > 0 && done && (
          <div className="mt-1">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
              📚 Sources
            </span>
            <div className="flex flex-wrap gap-1.5">
              {msg.cited_sources.map((src, idx) => (
                <button
                  key={idx}
                  onClick={() => onCitationClick(src)}
                  className="px-2.5 py-1.5 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-[11px] font-medium flex items-center gap-1.5 transition-all hover:scale-[1.02]"
                >
                  <BookOpen className="w-3 h-3 text-indigo-400 shrink-0" />
                  <span>{src.title?.slice(0, 28)}{src.title?.length > 28 ? '…' : ''} — p.{src.page_number}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* User Avatar */}
      {isUser && (
        <div className="w-8 h-8 rounded-xl bg-gray-800 border border-gray-700/70 flex items-center justify-center text-gray-300 shrink-0 mt-0.5">
          <User className="w-4 h-4" />
        </div>
      )}
    </div>
  );
}

// ─── Upload Zone Component ────────────────────────────────────────────────────
function UploadZone({ onFileSelect, disabled }) {
  const [dragging, setDragging] = useState(false);
  const ref = useRef(null);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragging(false);
    if (disabled) return;
    const f = e.dataTransfer.files?.[0];
    if (f) onFileSelect(f);
  }, [disabled, onFileSelect]);

  const handleDragOver = (e) => { e.preventDefault(); if (!disabled) setDragging(true); };
  const handleDragLeave = () => setDragging(false);

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      className={`relative rounded-xl border-2 border-dashed transition-all duration-200 cursor-pointer p-4 text-center
        ${dragging
          ? 'border-indigo-400 bg-indigo-500/10 scale-[1.01]'
          : 'border-gray-700/60 hover:border-indigo-500/50 hover:bg-gray-800/30'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      onClick={() => !disabled && ref.current?.click()}
    >
      <input
        type="file"
        ref={ref}
        className="hidden"
        accept=".pdf,.txt,.doc,.docx,.png,.jpg,.jpeg,.md"
        onChange={(e) => e.target.files?.[0] && onFileSelect(e.target.files[0])}
        disabled={disabled}
      />
      <div className="flex flex-col items-center gap-2">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all
          ${dragging ? 'bg-indigo-500/20 text-indigo-300' : 'bg-gray-800/60 text-gray-400'}`}>
          <Upload className="w-5 h-5" />
        </div>
        <div>
          <p className="text-xs font-semibold text-gray-300">
            {dragging ? '✨ Drop to analyze!' : 'Drop file here or click'}
          </p>
          <p className="text-[10px] text-gray-500 mt-0.5">PDF, TXT, DOC, Images — ChatGPT-style analysis</p>
        </div>
      </div>
    </div>
  );
}

// ─── Main Chat Page ───────────────────────────────────────────────────────────
function ChatContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('query') || '';

  const [sessions, setSessions] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [messages, setMessages] = useState([
    {
      id: 'welcome-msg',
      role: 'assistant',
      content: '## 👋 Welcome to AcademicAI Tutor!\n\nI\'m your intelligent academic assistant powered by RAG (Retrieval-Augmented Generation). Here\'s what I can do:\n\n- **📚 Answer questions** about your course materials with citations\n- **📄 Deep-analyze uploaded documents** — just like ChatGPT with files\n- **🔍 Find relevant content** across all faculty-uploaded materials\n- **🎓 Generate exam tips** and structured explanations\n\nTry uploading a PDF or ask me anything about your syllabus!',
      cited_sources: [],
      _static: true
    }
  ]);
  const [inputQuery, setInputQuery] = useState(initialQuery);
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingStage, setLoadingStage] = useState('');
  const [selectedCitation, setSelectedCitation] = useState(null);
  const [showUploadZone, setShowUploadZone] = useState(false);

  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  const latestMsgId = useRef(null);

  const suggestedPrompts = [
    { icon: '📖', text: 'Summarize Unit 2 key concepts' },
    { icon: '🔬', text: 'What are the main algorithms in OS?' },
    { icon: '📐', text: 'Key formulas for mid-term exam' },
    { icon: '🗄️', text: 'Explain database normalization' },
  ];

  // ── Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // ── Textarea auto-resize
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
    }
  }, [inputQuery]);

  // ── Load sessions
  useEffect(() => {
    api.getChatSessions().then(d => d?.length && setSessions(d)).catch(() => {});
  }, []);

  // ── File selection
  const handleFileSelect = (f) => {
    setSelectedFile(f);
    setShowUploadZone(false);
  };

  // ── New chat
  const handleNewChat = () => {
    setActiveSessionId(null);
    setSelectedFile(null);
    setShowUploadZone(false);
    setMessages([{
      id: `welcome-${Date.now()}`,
      role: 'assistant',
      content: 'New session started! Upload a document or ask me anything about your course materials.',
      cited_sources: [],
      _static: true
    }]);
  };

  // ── Load session history
  const handleSelectSession = async (sessionId) => {
    setActiveSessionId(sessionId);
    setLoading(true);
    try {
      const details = await api.getChatSessionDetails(sessionId).catch(() => null);
      if (details?.messages) {
        const staticMsgs = details.messages.map(m => ({ ...m, _static: true }));
        setMessages(staticMsgs);
      }
    } finally {
      setLoading(false);
    }
  };

  // ── Send message / upload
  const handleSend = async (queryOverride) => {
    const questionText = (queryOverride || inputQuery).trim();
    if ((!questionText && !selectedFile) || loading) return;

    const fileToUpload = selectedFile;
    const userContent = fileToUpload
      ? `📄 **Uploaded:** \`${fileToUpload.name}\`${questionText ? `\n\n${questionText}` : ''}`
      : questionText;

    const userMsg = { id: `user-${Date.now()}`, role: 'user', content: userContent };
    setMessages(prev => [...prev, userMsg]);
    setInputQuery('');
    setSelectedFile(null);
    setShowUploadZone(false);
    setLoading(true);

    // Stage labels for upload vs question
    if (fileToUpload) {
      const stages = [
        '🔍 Reading document pages…',
        '🧩 Chunking into semantic segments…',
        '🧠 Embedding chunks & ranking relevance…',
        '✨ Generating structured analysis…',
      ];
      let si = 0;
      setLoadingStage(stages[si]);
      const stageTimer = setInterval(() => {
        si = Math.min(si + 1, stages.length - 1);
        setLoadingStage(stages[si]);
      }, 1800);

      try {
        const formData = new FormData();
        formData.append('file', fileToUpload);
        if (questionText) formData.append('question', questionText);
        if (activeSessionId) formData.append('session_id', activeSessionId);

        const res = await api.uploadChatFile(formData).catch(() => null);
        clearInterval(stageTimer);

        if (res?.answer) {
          const newId = `assistant-${Date.now()}`;
          latestMsgId.current = newId;
          if (!activeSessionId && res.session_id) {
            setActiveSessionId(res.session_id);
            setSessions(prev => [
              { id: res.session_id, title: fileToUpload.name.slice(0, 40), created_at: new Date().toISOString() },
              ...prev
            ]);
          }
          setMessages(prev => [...prev, {
            id: newId,
            role: 'assistant',
            content: res.answer,
            cited_sources: res.sources || [],
            document_metadata: res.document_metadata || null,
          }]);
        }
      } catch {
        clearInterval(stageTimer);
        setMessages(prev => [...prev, {
          id: `err-${Date.now()}`,
          role: 'assistant',
          content: '⚠️ **Error processing document.** Please ensure the backend is running and try again.',
          cited_sources: [],
          _static: true
        }]);
      } finally {
        setLoading(false);
        setLoadingStage('');
      }
    } else {
      setLoadingStage('🔍 Searching academic documents…');
      try {
        const res = await api.askQuestion(questionText, activeSessionId).catch(() => null);

        if (res?.answer) {
          const newId = `assistant-${Date.now()}`;
          latestMsgId.current = newId;
          if (!activeSessionId && res.session_id) {
            setActiveSessionId(res.session_id);
            setSessions(prev => [
              { id: res.session_id, title: questionText.slice(0, 40), created_at: new Date().toISOString() },
              ...prev
            ]);
          }
          setMessages(prev => [...prev, {
            id: newId,
            role: 'assistant',
            content: res.answer,
            cited_sources: res.sources || [],
          }]);
        }
      } catch {
        setMessages(prev => [...prev, {
          id: `err-${Date.now()}`,
          role: 'assistant',
          content: '⚠️ **Connection error.** Please ensure the backend is running.',
          cited_sources: [],
          _static: true
        }]);
      } finally {
        setLoading(false);
        setLoadingStage('');
      }
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="h-[calc(100vh-6.5rem)] flex gap-4 max-w-7xl mx-auto overflow-hidden">
      {/* ── Left Sidebar ─────────────────────────────────── */}
      <aside className="w-64 glass-panel rounded-2xl flex flex-col shrink-0 border border-gray-800/70 hidden md:flex overflow-hidden">
        <div className="p-3 border-b border-gray-800/60">
          <button
            onClick={handleNewChat}
            className="w-full py-2.5 px-3 rounded-xl gradient-bg hover:opacity-90 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            New Chat
          </button>
        </div>

        <div className="px-3 pt-3 pb-1">
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Recent Sessions</p>
        </div>

        <div className="flex-1 overflow-y-auto px-2 pb-3 space-y-1">
          {sessions.length === 0 ? (
            <div className="text-center py-8 px-3">
              <MessageSquare className="w-6 h-6 text-gray-700 mx-auto mb-2" />
              <p className="text-[10px] text-gray-600">No sessions yet.</p>
              <p className="text-[10px] text-gray-600">Start by asking a question!</p>
            </div>
          ) : (
            sessions.map(sess => (
              <button
                key={sess.id}
                onClick={() => handleSelectSession(sess.id)}
                className={`w-full text-left px-3 py-2.5 rounded-xl text-[11px] flex items-start gap-2.5 transition-all ${
                  activeSessionId === sess.id
                    ? 'bg-indigo-600/15 text-indigo-300 border border-indigo-500/25 font-semibold'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800/50 border border-transparent'
                }`}
              >
                <MessageSquare className="w-3 h-3 shrink-0 mt-0.5" />
                <span className="truncate leading-relaxed">{sess.title || 'Academic Chat'}</span>
              </button>
            ))
          )}
        </div>

        {/* Upload Zone in sidebar */}
        <div className="p-3 border-t border-gray-800/60">
          <UploadZone onFileSelect={handleFileSelect} disabled={loading} />
        </div>
      </aside>

      {/* ── Main Chat Panel ───────────────────────────────── */}
      <div className="flex-1 glass-panel rounded-2xl flex flex-col overflow-hidden border border-gray-800/70">

        {/* Header */}
        <div className="px-5 py-3.5 border-b border-gray-800/70 flex items-center justify-between bg-[#0d121f]/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/15 border border-indigo-500/25 flex items-center justify-center text-indigo-400">
              <Brain className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-xs font-bold text-white">AcademicAI RAG Assistant</h1>
              <p className="text-[10px] text-gray-500">Deep Document Analysis • Semantic Search • Page Citations</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Mobile: new chat */}
            <button
              onClick={handleNewChat}
              className="md:hidden p-2 rounded-lg bg-indigo-600 text-white"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">
          {messages.map((msg, idx) => (
            <ChatMessage
              key={msg.id}
              msg={msg}
              isLatest={idx === messages.length - 1}
              onCitationClick={setSelectedCitation}
              onAskFollowUp={(q) => {
                setInputQuery(q);
                textareaRef.current?.focus();
              }}
            />
          ))}

          {/* ── Loading indicator ── */}
          {loading && (
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl gradient-bg flex items-center justify-center text-white shrink-0">
                <Bot className="w-4 h-4" />
              </div>
              <div className="glass-panel rounded-2xl rounded-tl-sm px-4 py-3 border border-gray-800/70">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                {loadingStage && (
                  <p className="text-[11px] text-gray-400">{loadingStage}</p>
                )}
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* ── Suggested Prompts ── */}
        {messages.length <= 1 && (
          <div className="px-5 py-2 border-t border-gray-800/50 bg-[#0d121f]/30">
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              <span className="text-[10px] font-bold text-gray-600 uppercase tracking-wider shrink-0">Try:</span>
              {suggestedPrompts.map((p, i) => (
                <button
                  key={i}
                  onClick={() => handleSend(p.text)}
                  className="px-3 py-1.5 rounded-full bg-gray-800/70 hover:bg-gray-700/80 text-gray-300 hover:text-white text-[11px] shrink-0 border border-gray-700/40 hover:border-gray-600 transition-all flex items-center gap-1.5"
                >
                  <span>{p.icon}</span>
                  <span>{p.text}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Input Area ── */}
        <div className="px-4 py-3.5 border-t border-gray-800/70 bg-[#0d121f]/90 shrink-0">
          {/* Selected file preview */}
          {selectedFile && (
            <div className="mb-2.5 px-3 py-2 bg-indigo-900/30 border border-indigo-500/30 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center shrink-0">
                  <FileText className="w-3.5 h-3.5 text-indigo-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold text-indigo-200 truncate">{selectedFile.name}</p>
                  <p className="text-[10px] text-gray-500">{(selectedFile.size / 1024).toFixed(1)} KB • Ready to analyze</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedFile(null)}
                className="text-gray-500 hover:text-white ml-2 shrink-0 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          <div className="flex items-end gap-2.5">
            {/* Attach button */}
            <button
              type="button"
              onClick={() => setShowUploadZone(!showUploadZone)}
              disabled={loading}
              className={`p-2.5 rounded-xl border transition-all shrink-0 ${
                showUploadZone || selectedFile
                  ? 'bg-indigo-600/20 border-indigo-500/50 text-indigo-400'
                  : 'bg-gray-900 border-gray-700/70 text-gray-400 hover:text-indigo-400 hover:border-indigo-500/40'
              } disabled:opacity-40`}
              title="Attach document (PDF, TXT, Image)"
            >
              <Paperclip className="w-4 h-4" />
            </button>

            {/* Textarea */}
            <div className="flex-1 relative">
              <textarea
                ref={textareaRef}
                value={inputQuery}
                onChange={e => setInputQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={
                  selectedFile
                    ? `Ask a question about "${selectedFile.name}"… (or press Send for full analysis)`
                    : 'Ask about course materials, or attach a document for ChatGPT-style analysis…'
                }
                disabled={loading}
                rows={1}
                className="w-full bg-gray-900/80 border border-gray-700/70 rounded-xl px-4 py-2.5 text-[12.5px] text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500/70 focus:ring-1 focus:ring-indigo-500/30 transition-all resize-none overflow-hidden"
                style={{ minHeight: '42px', maxHeight: '120px' }}
              />
              <div className="absolute right-2.5 bottom-2 text-[9px] text-gray-600 hidden sm:block">
                ↵ Send · Shift+↵ Newline
              </div>
            </div>

            {/* Send button */}
            <button
              onClick={() => handleSend()}
              disabled={(!inputQuery.trim() && !selectedFile) || loading}
              className="py-2.5 px-4 rounded-xl gradient-bg hover:opacity-90 text-white font-semibold text-xs flex items-center gap-2 shadow-lg shadow-indigo-600/20 transition-all disabled:opacity-40 shrink-0"
            >
              {loading ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Send className="w-3.5 h-3.5" />
              )}
              <span className="hidden sm:inline">
                {selectedFile ? 'Analyze' : 'Ask AI'}
              </span>
            </button>
          </div>

          {/* Mobile upload zone */}
          {showUploadZone && !selectedFile && (
            <div className="mt-2.5">
              <UploadZone onFileSelect={handleFileSelect} disabled={loading} />
            </div>
          )}
        </div>
      </div>

      {/* ── Citation Modal ─────────────────────────────── */}
      {selectedCitation && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedCitation(null)}
        >
          <div
            className="glass-panel max-w-md w-full rounded-2xl p-6 border border-gray-700/70 shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-gray-800 mb-4">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-indigo-400" />
                <h4 className="text-sm font-bold text-white">Citation Details</h4>
              </div>
              <button
                onClick={() => setSelectedCitation(null)}
                className="text-gray-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-gray-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="p-3 rounded-xl bg-gray-900/60 border border-gray-800">
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">Document</p>
                <p className="font-semibold text-white">{selectedCitation.title}</p>
              </div>
              <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">Page Reference</p>
                <p className="font-bold text-indigo-300 text-sm">Page {selectedCitation.page_number}</p>
              </div>
              <div className="p-3 rounded-xl bg-gray-900/40 border border-gray-800 text-[11px] text-gray-400 italic leading-relaxed">
                "Content verified from syllabus reference material — click below to open the full document."
              </div>
            </div>

            <div className="mt-5 flex gap-2.5">
              <button
                onClick={() => setSelectedCitation(null)}
                className="flex-1 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-medium transition-colors"
              >
                Close
              </button>
              {selectedCitation.file_url && (
                <a
                  href={selectedCitation.file_url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 py-2 rounded-xl gradient-bg text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20"
                >
                  Open PDF
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Global styles ── */}
      <style jsx global>{`
        .msg-enter {
          animation: msgFadeIn 0.25s ease forwards;
        }
        @keyframes msgFadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

export default function StudentChatPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#0b0f19]">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <ChatContent />
    </Suspense>
  );
}
