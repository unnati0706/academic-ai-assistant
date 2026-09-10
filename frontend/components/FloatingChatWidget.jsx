'use client';

import { useState, useRef, useEffect } from 'react';
import { Bot, MessageSquare, X, Send, Sparkles, Trash2, BookOpen, ExternalLink, RefreshCw } from 'lucide-react';
import { api } from '@/lib/api';
import { getDocumentUrl } from '@/lib/supabase';

export default function FloatingChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Hello! I am AcademicAI, your intelligent course tutor. Ask me any question about your faculty course materials or topics!'
    }
  ]);
  const [inputQuestion, setInputQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    const q = inputQuestion.trim();
    if (!q || loading) return;

    // Append user message
    const userMsg = { role: 'user', content: q };
    setMessages(prev => [...prev, userMsg]);
    setInputQuestion('');
    setLoading(true);

    try {
      const response = await api.askQuestion(q, sessionId).catch(() => null);

      if (response && response.answer) {
        if (response.session_id) {
          setSessionId(response.session_id);
        }
        setMessages(prev => [
          ...prev,
          {
            role: 'assistant',
            content: response.answer,
            sources: response.sources || []
          }
        ]);
      } else {
        // Dev / offline fallback response
        setMessages(prev => [
          ...prev,
          {
            role: 'assistant',
            content: "I could not find relevant explanations for this in the uploaded faculty materials. Please verify if notes for this topic are uploaded.",
            sources: []
          }
        ]);
      }
    } catch (err) {
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: "Sorry, I encountered an error searching materials. Please check your backend connection.",
          sources: []
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleClearChat = () => {
    setMessages([
      {
        role: 'assistant',
        content: 'Chat cleared. How can I assist you with your academic study materials now?'
      }
    ]);
    setSessionId(null);
  };

  return (
    <>
      {/* Fixed Bottom-Right Floating Toggle Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-14 h-14 rounded-full gradient-bg flex items-center justify-center text-white shadow-2xl shadow-indigo-600/50 hover:scale-105 active:scale-95 transition-all duration-200 border-2 border-indigo-400/30 group"
          title="Open Academic AI Assistant"
        >
          {isOpen ? (
            <X className="w-6 h-6 text-white" />
          ) : (
            <div className="relative">
              <Bot className="w-7 h-7 text-white" />
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full ring-2 ring-[#0b0f19]"></span>
            </div>
          )}
        </button>
      </div>

      {/* Floating Popup Drawer Chat Modal */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-96 max-w-[calc(100vw-3rem)] h-[540px] max-h-[calc(100vh-8rem)] z-50 bg-[#0d121f] border border-indigo-500/30 rounded-2xl shadow-2xl flex flex-col overflow-hidden backdrop-blur-xl animate-in fade-in slide-in-from-bottom-5 duration-200">
          {/* Header */}
          <div className="gradient-bg p-4 flex items-center justify-between text-white shrink-0">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-bold leading-tight">AcademicAI Tutor</h3>
                <p className="text-[10px] text-indigo-200 font-medium">Faculty Material RAG Search</p>
              </div>
            </div>

            <div className="flex items-center space-x-1">
              <button
                onClick={handleClearChat}
                className="p-1.5 rounded-lg hover:bg-white/20 text-indigo-100 transition-colors"
                title="Clear Chat History"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg hover:bg-white/20 text-indigo-100 transition-colors"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages Body */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3.5 text-xs">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex flex-col ${
                  msg.role === 'user' ? 'items-end' : 'items-start'
                }`}
              >
                <div
                  className={`max-w-[85%] p-3.5 rounded-2xl leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-indigo-600 text-white rounded-br-none shadow-md shadow-indigo-600/20'
                      : 'bg-gray-900/90 text-gray-200 border border-gray-800 rounded-bl-none'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.content}</p>

                  {/* Cited Sources */}
                  {msg.sources && msg.sources.length > 0 && (
                    <div className="mt-3 pt-2.5 border-t border-gray-800 space-y-1">
                      <div className="text-[10px] font-bold text-indigo-300 uppercase tracking-wider flex items-center space-x-1">
                        <BookOpen className="w-3 h-3 text-indigo-400" />
                        <span>Sources Cited:</span>
                      </div>
                      {msg.sources.map((src, sIdx) => (
                        <div key={sIdx} className="text-[10px] text-gray-400 flex items-center justify-between">
                          <span className="truncate max-w-[180px]">{src.title} (Page {src.page_number})</span>
                          {(src.file_url || src.file_path || src.material_id) && (
                            <a
                              href={getDocumentUrl(src.file_url || src.file_path, 'academic-documents', src.material_id)}
                              target="_blank"
                              rel="noreferrer"
                              className="text-indigo-400 hover:text-indigo-300 ml-1 inline-flex items-center"
                            >
                              <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex items-center space-x-2 text-gray-400 text-xs py-2">
                <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                <span>Searching faculty materials...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Chat Input Form */}
          <form onSubmit={handleSendMessage} className="p-3 bg-gray-900/90 border-t border-gray-800 shrink-0">
            <div className="relative flex items-center">
              <input
                type="text"
                value={inputQuestion}
                onChange={(e) => setInputQuestion(e.target.value)}
                placeholder="Ask about your course materials..."
                disabled={loading}
                className="w-full pl-3.5 pr-10 py-2.5 bg-[#0b0f19] border border-gray-700/80 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-all disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={loading || !inputQuestion.trim()}
                className="absolute right-1.5 p-1.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-500 transition-all disabled:opacity-40"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
