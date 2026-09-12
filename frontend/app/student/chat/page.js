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
        <div className="w-8 h-8 rounded-xl gradient-bg flex items-center justify-center text-white shrink-0 shadow-md shadow-[#749190]/20 mt-0.5">
          <Bot className="w-4 h-4 text-white" />
        </div>
      )}

      <div className={`flex flex-col gap-1 ${isUser ? 'items-end' : 'items-start'} max-w-[85%]`}>
        {/* Message bubble */}
        <div
          className={`rounded-2xl px-4 py-3 relative ${
            isUser
              ? 'bg-[#749190] text-white shadow-md shadow-[#749190]/20 rounded-tr-sm'
              : 'bg-white border border-[#D8D6C9] text-[#263339] rounded-tl-sm shadow-xs'
          }`}
        >
          {isUser ? (
            <p className="text-[12.5px] leading-relaxed whitespace-pre-wrap">{msg.content}</p>
          ) : (
            <>
              <MarkdownRenderer content={displayContent || '...'} />
              {/* Typing cursor */}
              {animate && !done && (
                <span className="inline-block w-0.5 h-3.5 bg-[#749190] ml-0.5 animate-pulse rounded-full" />
              )}
            </>
          )}

          {/* Copy button (assistant only) */}
          {isAssistant && done && (
            <button
              onClick={handleCopy}
              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-md bg-[#fbf9f5] hover:bg-[#D8D6C9]/40 text-[#465F64] hover:text-[#263339] border border-[#D8D6C9]"
              title="Copy response"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
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
            <span className="text-[10px] font-bold text-[#465F64] uppercase tracking-wider block mb-1.5">
              📚 Sources Cited
            </span>
            <div className="flex flex-wrap gap-1.5">
              {msg.cited_sources.map((src, idx) => (
                <button
                  key={idx}
                  onClick={() => onCitationClick(src)}
                  className="px-2.5 py-1.5 rounded-lg bg-[#E6D9B9] hover:bg-[#E6D9B9]/80 border border-[#D8D6C9] text-[#263339] text-[11px] font-bold flex items-center gap-1.5 transition-all hover:scale-[1.02]"
                >
                  <BookOpen className="w-3 h-3 text-[#749190] shrink-0" />
                  <span>{src.title?.slice(0, 28)}{src.title?.length > 28 ? '…' : ''} — p.{src.page_number}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* User Avatar */}
      {isUser && (
        <div className="w-8 h-8 rounded-xl bg-white border border-[#D8D6C9] flex items-center justify-center text-[#263339] shrink-0 mt-0.5 shadow-xs">
          <User className="w-4 h-4 text-[#749190]" />
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
          ? 'border-[#749190] bg-[#749190]/10 scale-[1.01]'
          : 'border-[#D8D6C9] hover:border-[#749190] hover:bg-[#fbf9f5]'
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
          ${dragging ? 'bg-[#749190]/20 text-[#749190]' : 'bg-[#fbf9f5] border border-[#D8D6C9] text-[#749190]'}`}>
          <Upload className="w-5 h-5" />
        </div>
        <div>
          <p className="text-xs font-bold text-[#263339]">
            {dragging ? '✨ Drop to analyze!' : 'Drop file here or click'}
          </p>
          <p className="text-[10px] text-[#465F64] mt-0.5 font-medium">PDF, TXT, DOC, Images — Instant AI analysis</p>
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

  const handleNewChat = () => {
    setActiveSessionId(null);
    setSelectedFile(null);
    setInputQuery('');
    setMessages([
      {
        id: 'welcome-msg',
        role: 'assistant',
        content: 'New chat started. Ask any question or upload a course material document to get started!',
        cited_sources: [],
        _static: true
      }
    ]);
  };

  const handleSelectSession = (id) => {
    setActiveSessionId(id);
    // In demo mode or if loaded, keep current context
  };

  const handleSend = async (overrideText) => {
    const questionText = (overrideText !== undefined ? overrideText : inputQuery).trim();
    if (!questionText && !selectedFile) return;
    if (loading) return;

    const fileToUpload = selectedFile;
    const userMsgContent = fileToUpload
      ? `📄 **Attached:** \`${fileToUpload.name}\`${questionText ? `\n\n${questionText}` : ''}`
      : questionText;

    const userMsgId = `user-${Date.now()}`;
    setMessages(prev => [...prev, {
      id: userMsgId,
      role: 'user',
      content: userMsgContent,
      file: fileToUpload ? { name: fileToUpload.name, size: fileToUpload.size } : null,
    }]);

    setInputQuery('');
    setSelectedFile(null);
    setLoading(true);

    if (fileToUpload) {
      setLoadingStage('📄 Extracting text & structure…');
      const stages = [
        '🔍 Analyzing document chunks…',
        '🧠 Generating answer with AI…',
        '✨ Finalizing response…',
      ];
      let si = 0;
      const stageTimer = setInterval(() => {
        si = (si + 1) % stages.length;
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
    <div className="h-[calc(100vh-6.5rem)] flex gap-4 max-w-7xl mx-auto overflow-hidden text-[#263339]">
      {/* ── Left Sidebar ─────────────────────────────────── */}
      <aside className="w-64 bg-white rounded-2xl flex flex-col shrink-0 border border-[#D8D6C9] hidden md:flex overflow-hidden shadow-xs">
        <div className="p-3 border-b border-[#D8D6C9]">
          <button
            onClick={handleNewChat}
            className="w-full py-2.5 px-3 rounded-xl gradient-bg hover:opacity-90 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-[#749190]/20 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            New Chat
          </button>
        </div>

        <div className="px-3 pt-3 pb-1">
          <p className="text-[10px] font-bold text-[#465F64] uppercase tracking-wider">Recent Sessions</p>
        </div>

        <div className="flex-1 overflow-y-auto px-2 pb-3 space-y-1">
          {sessions.length === 0 ? (
            <div className="text-center py-8 px-3">
              <MessageSquare className="w-6 h-6 text-[#D8D6C9] mx-auto mb-2" />
              <p className="text-[10px] text-[#465F64]">No sessions yet.</p>
              <p className="text-[10px] text-[#465F64]">Start by asking a question!</p>
            </div>
          ) : (
            sessions.map(sess => (
              <button
                key={sess.id}
                onClick={() => handleSelectSession(sess.id)}
                className={`w-full text-left px-3 py-2.5 rounded-xl text-[11px] flex items-start gap-2.5 transition-all ${
                  activeSessionId === sess.id
                    ? 'bg-[#749190]/15 text-[#749190] border border-[#749190]/30 font-bold'
                    : 'text-[#465F64] hover:text-[#263339] hover:bg-[#fbf9f5] border border-transparent'
                }`}
              >
                <MessageSquare className="w-3 h-3 shrink-0 mt-0.5 text-[#749190]" />
                <span className="truncate leading-relaxed">{sess.title || 'Academic Chat'}</span>
              </button>
            ))
          )}
        </div>

        {/* Upload Zone in sidebar */}
        <div className="p-3 border-t border-[#D8D6C9]">
          <UploadZone onFileSelect={handleFileSelect} disabled={loading} />
        </div>
      </aside>

      {/* ── Main Chat Panel ───────────────────────────────── */}
      <div className="flex-1 bg-white rounded-2xl flex flex-col overflow-hidden border border-[#D8D6C9] shadow-xs">

        {/* Header */}
        <div className="px-5 py-3.5 border-b border-[#D8D6C9] flex items-center justify-between bg-[#fbf9f5] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#749190]/15 border border-[#749190]/30 flex items-center justify-center text-[#749190]">
              <Brain className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-xs font-bold text-[#263339]">AcademicAI RAG Assistant</h1>
              <p className="text-[10px] text-[#465F64]">Deep Document Analysis • Semantic Search • Page Citations</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Mobile: new chat */}
            <button
              onClick={handleNewChat}
              className="md:hidden p-2 rounded-lg bg-[#749190] text-white"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5 bg-[#fbf9f5]">
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
              <div className="bg-white rounded-2xl rounded-tl-sm px-4 py-3 border border-[#D8D6C9] shadow-xs">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#749190] animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-[#749190] animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-[#749190] animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                {loadingStage && (
                  <p className="text-[11px] text-[#465F64] font-medium">{loadingStage}</p>
                )}
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* ── Suggested Prompts ── */}
        {messages.length <= 1 && (
          <div className="px-5 py-2 border-t border-[#D8D6C9] bg-white">
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              <span className="text-[10px] font-bold text-[#465F64] uppercase tracking-wider shrink-0">Try:</span>
              {suggestedPrompts.map((p, i) => (
                <button
                  key={i}
                  onClick={() => handleSend(p.text)}
                  className="px-3 py-1.5 rounded-full bg-[#fbf9f5] hover:bg-[#D8D6C9]/40 text-[#263339] text-[11px] shrink-0 border border-[#D8D6C9] transition-all flex items-center gap-1.5 font-medium"
                >
                  <span>{p.icon}</span>
                  <span>{p.text}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Input Area ── */}
        <div className="px-4 py-3.5 border-t border-[#D8D6C9] bg-white shrink-0">
          {/* Selected file preview */}
          {selectedFile && (
            <div className="mb-2.5 px-3 py-2 bg-[#E6D9B9]/50 border border-[#D8D6C9] rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-[#749190]/20 border border-[#749190]/30 flex items-center justify-center shrink-0">
                  <FileText className="w-3.5 h-3.5 text-[#749190]" />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-bold text-[#263339] truncate">{selectedFile.name}</p>
                  <p className="text-[10px] text-[#465F64]">{(selectedFile.size / 1024).toFixed(1)} KB • Ready to analyze</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedFile(null)}
                className="text-[#465F64] hover:text-[#263339] ml-2 shrink-0 transition-colors"
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
                  ? 'bg-[#749190]/20 border-[#749190] text-[#749190]'
                  : 'bg-white border-[#D8D6C9] text-[#465F64] hover:text-[#749190] hover:border-[#749190]'
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
                    : 'Ask about course materials, or attach a document for AI analysis…'
                }
                disabled={loading}
                rows={1}
                className="w-full bg-[#fbf9f5] border border-[#D8D6C9] rounded-xl px-4 py-2.5 text-[12.5px] text-[#263339] placeholder-[#465F64]/50 focus:outline-none focus:border-[#749190] focus:ring-1 focus:ring-[#749190] transition-all resize-none overflow-hidden"
                style={{ minHeight: '42px', maxHeight: '120px' }}
              />
              <div className="absolute right-2.5 bottom-2 text-[9px] text-[#465F64]/60 hidden sm:block">
                ↵ Send · Shift+↵ Newline
              </div>
            </div>

            {/* Send button */}
            <button
              onClick={() => handleSend()}
              disabled={(!inputQuery.trim() && !selectedFile) || loading}
              className="py-2.5 px-4 rounded-xl gradient-bg hover:opacity-90 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-[#749190]/20 transition-all disabled:opacity-40 shrink-0"
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
          className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedCitation(null)}
        >
          <div
            className="bg-white max-w-md w-full rounded-2xl p-6 border border-[#D8D6C9] shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#D8D6C9] mb-4">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-[#749190]" />
                <h4 className="text-sm font-bold text-[#263339]">Citation Details</h4>
              </div>
              <button
                onClick={() => setSelectedCitation(null)}
                className="text-[#465F64] hover:text-[#263339] transition-colors p-1 rounded-lg hover:bg-[#fbf9f5]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="p-3 rounded-xl bg-[#fbf9f5] border border-[#D8D6C9]">
                <p className="text-[10px] text-[#465F64] font-bold uppercase tracking-wider mb-1">Document</p>
                <p className="font-bold text-[#263339]">{selectedCitation.title}</p>
              </div>
              <div className="p-3 rounded-xl bg-[#E6D9B9]/50 border border-[#D8D6C9]">
                <p className="text-[10px] text-[#465F64] font-bold uppercase tracking-wider mb-1">Page Reference</p>
                <p className="font-bold text-[#263339] text-sm">Page {selectedCitation.page_number}</p>
              </div>
              <div className="p-3 rounded-xl bg-[#fbf9f5] border border-[#D8D6C9] text-[11px] text-[#465F64] italic leading-relaxed">
                "Content verified from syllabus reference material — click below to open the full document."
              </div>
            </div>

            <div className="mt-5 flex gap-2.5">
              <button
                onClick={() => setSelectedCitation(null)}
                className="flex-1 py-2 rounded-xl bg-[#fbf9f5] hover:bg-[#D8D6C9]/40 border border-[#D8D6C9] text-[#465F64] text-xs font-semibold transition-colors"
              >
                Close
              </button>
              {selectedCitation.file_url && (
                <a
                  href={selectedCitation.file_url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 py-2 rounded-xl gradient-bg text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-[#749190]/20"
                >
                  Open PDF
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function StudentChatPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#fbf9f5]">
        <div className="w-8 h-8 border-4 border-[#749190] border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <ChatContent />
    </Suspense>
  );
}
