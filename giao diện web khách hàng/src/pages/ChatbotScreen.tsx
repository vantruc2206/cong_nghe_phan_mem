import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, User, Sparkles, RefreshCw } from 'lucide-react';
import { sendChatbotMessageApi } from '../api';
import { ChatMessage, UserProfile } from '../types';

interface ChatbotScreenProps {
  user?: UserProfile | null;
}

export const ChatbotScreen: React.FC<ChatbotScreenProps> = ({ user }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      sender: 'bot',
      text: `Xin chào ${user?.ho_ten || 'bạn'}! 👋 Tôi là Trợ Lý AI SmartDrone. Tôi có thể giúp bạn:\n• Tra cứu trạng thái đơn hàng\n• Tính cước phí giao hàng\n• Giải đáp thắc mắc về dịch vụ Drone\n\nBạn muốn hỏi gì?`,
      timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: input,
      timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, userMsg]);
    const currentQuery = input;
    setInput('');
    setLoading(true);

    try {
      const customerId = user?.ma_khach_hang || user?.ma_nguoi_dung || user?.email;
      const res = await sendChatbotMessageApi(currentQuery, customerId);
      const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'bot',
        text: res.text || 'Tôi đã ghi nhận câu hỏi của bạn. Hệ thống Drone vận hành 7h00 - 21h00 hàng ngày.',
        timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages(prev => [...prev, botMsg]);
    } catch {
      const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'bot',
        text: '⚠️ Kết nối chatbot tạm thời gián đoạn. Vui lòng thử lại sau hoặc liên hệ hotline: 1900-DRONE.',
        timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages(prev => [...prev, botMsg]);
    } finally {
      setLoading(false);
    }
  };

  const executeQuery = async (queryText: string) => {
    if (loading || !queryText.trim()) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: queryText,
      timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      const customerId = user?.ma_khach_hang || user?.ma_nguoi_dung || user?.email;
      const res = await sendChatbotMessageApi(queryText, customerId);
      const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'bot',
        text: res.text || 'Tôi đã ghi nhận câu hỏi của bạn.',
        timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages(prev => [...prev, botMsg]);
    } catch {
      const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'bot',
        text: '⚠️ Kết nối chatbot tạm thời gián đoạn. Vui lòng thử lại sau.',
        timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages(prev => [...prev, botMsg]);
    } finally {
      setLoading(false);
    }
  };

  const quickReplies = ['Đơn hàng của tôi ở đâu?', 'Phí giao hàng là bao nhiêu?', 'Drone có thể tải bao nhiêu kg?'];

  return (
    <div className="w-full max-w-4xl mx-auto flex-1 flex flex-col min-h-0 bg-white border border-slate-100 rounded-2xl p-2 sm:p-4 shadow-xs animate-fade-up">
      {/* Header */}
      <div className="shrink-0 flex items-center gap-3 pb-3 border-b border-slate-100 mb-2">
        <div className="w-8 h-8 rounded-xl bg-emerald-100 text-[#00B14F] flex items-center justify-center font-bold shrink-0">
          <Bot className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="font-extrabold text-slate-900 text-xs truncate flex items-center gap-1.5">
            AI Chatbot SmartDrone <Sparkles className="w-3.5 h-3.5 text-[#00B14F]" />
          </h1>
          <p className="text-[10px] text-slate-500 truncate">Kết nối Groq AI • Trả lời tức thì 24/7</p>
        </div>
        <span className="badge-approved text-[10px]">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Online
        </span>
      </div>

      {/* Messages List - Fills available middle height */}
      <div className="flex-1 min-h-0 overflow-y-auto px-2 py-2 space-y-3">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex items-end gap-2.5 ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
              msg.sender === 'user' ? 'bg-[#00B14F] text-white' : 'bg-slate-100 text-[#00B14F] border border-slate-200'
            }`}>
              {msg.sender === 'user' ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
            </div>
            <div className={`max-w-[85%] space-y-1 ${msg.sender === 'user' ? 'items-end' : 'items-start'} flex flex-col`}>
              <div className={`p-3 rounded-2xl text-xs leading-relaxed ${
                msg.sender === 'user'
                  ? 'bg-[#00B14F] text-white rounded-br-sm shadow-sm font-medium'
                  : 'bg-slate-100 border border-slate-200 text-slate-800 rounded-bl-sm'
              }`}>
                <p className="whitespace-pre-line">{msg.text}</p>
              </div>
              <p className="text-[9px] text-slate-400 px-1">{msg.timestamp}</p>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex items-end gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-slate-100 text-[#00B14F] border border-slate-200 flex items-center justify-center">
              <Bot className="w-3.5 h-3.5" />
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500 px-3.5 py-2.5 bg-slate-100 border border-slate-200 rounded-2xl rounded-bl-sm">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#00B14F]" />
              <span>AI đang tra cứu CSDL & phân tích...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Replies */}
      <div className="shrink-0 pt-2 pb-1.5 flex gap-1.5 overflow-x-auto border-t border-slate-100">
        {quickReplies.map(q => (
          <button
            key={q}
            onClick={() => executeQuery(q)}
            className="shrink-0 px-2.5 py-1 text-[11px] font-semibold text-[#00B14F] bg-slate-50 border border-slate-200 hover:border-emerald-400 rounded-full transition-all whitespace-nowrap cursor-pointer"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Input Form */}
      <form onSubmit={handleSend} className="shrink-0 flex items-center gap-2 pt-2 border-t border-slate-100 bg-white">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Nhập tin nhắn..."
          className="input-field py-2 text-xs"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="btn-primary py-2 px-3.5 shrink-0 text-xs"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
};
