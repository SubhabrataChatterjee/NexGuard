import React, { useState } from 'react';
import { Bot, Send, X, Shield, Sparkles } from 'lucide-react';
import { api } from '../lib/api';

interface AssistantDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
}

export const AssistantDrawer: React.FC<AssistantDrawerProps> = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'm-0',
      sender: 'assistant',
      text: 'Hello! I am your NexGuard Safety Companion. Ask me for safety advice during your commute, guidance on nearby emergency resources, or tips on stay connected with trusted contacts.',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg: Message = { id: `u-${Date.now()}`, sender: 'user', text: input.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const responseText = await api.askAssistant(userMsg.text);
      const botMsg: Message = { id: `b-${Date.now()}`, sender: 'assistant', text: responseText };
      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          sender: 'assistant',
          text: 'I encountered an error connecting to my safety knowledge base. If you feel in danger, please tap the red SOS button or call emergency services (100).',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const quickPrompts = [
    "I'm walking home alone at night, what should I do?",
    'How do check-in grace periods work?',
    'Find nearby verified police or safe locations',
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex justify-end">
      <div className="w-full max-w-[440px] bg-white h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="p-5 bg-[#532dcf] text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/15 rounded-xl">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-base flex items-center gap-1.5">
                <span>NexGuard AI Assistant</span>
                <Sparkles className="w-4 h-4 text-amber-300" />
              </h3>
              <p className="text-[11px] text-[#eee7ff]">24/7 Safety Companion</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-white/80 hover:text-white rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Prompts */}
        <div className="p-3 bg-[#f0ecff] border-b border-[#c9c4d7]/40 flex gap-2 overflow-x-auto">
          {quickPrompts.map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => setInput(prompt)}
              className="text-[11px] bg-white text-[#532dcf] font-semibold px-3 py-1.5 rounded-full border border-[#532dcf]/20 shrink-0 hover:bg-[#e6deff]"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Message Log */}
        <div className="flex-1 p-4 overflow-y-auto space-y-4 text-xs">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] p-3.5 rounded-2xl whitespace-pre-wrap leading-relaxed ${
                  m.sender === 'user'
                    ? 'bg-[#532dcf] text-white rounded-tr-none'
                    : 'bg-[#f2f3f6] text-[#191c1e] rounded-tl-none border border-[#e1e2e5]'
                }`}
              >
                {m.text}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-[#f2f3f6] p-3 rounded-2xl text-xs text-[#797586] animate-pulse">
                Thinking safety advice...
              </div>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSend} className="p-4 border-t border-[#e1e2e5] flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask safety assistant..."
            className="flex-1 bg-[#f2f3f6] px-4 py-3 rounded-xl border border-transparent focus:border-[#532dcf] focus:bg-white outline-none text-xs text-[#191c1e]"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="p-3 bg-[#532dcf] text-white rounded-xl hover:bg-[#481cc4] disabled:opacity-50 transition-all shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
