'use client';

import { useRouter } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';

type Message = { id: number; sender: 'user' | 'bot'; text: string };

interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
}

export default function Chatbot() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isBotTyping, setIsBotTyping] = useState(false);
  const [conversationHistory, setConversationHistory] = useState<
    ConversationMessage[]
  >([]);
  const [isRecommended, setIsRecommended] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [recommendedBreed, setRecommendedBreed] = useState<string>('');
  const router = useRouter();

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || '';
  // 자동 스크롤
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!isBotTyping) {
      inputRef.current?.focus();
    }
  }, [isBotTyping]);

  useEffect(() => {
    const initialPrompt =
      '안녕하세요! 🐕 저는 강아지 추천 챗봇이에요. 평소 어떤 활동을 즐기시는지 자유롭게 말씀해주세요.';

    setMessages([{ id: Date.now(), sender: 'bot', text: initialPrompt }]);

    // 초기 로드 시 input에 focus
    setTimeout(() => {
      inputRef.current?.focus();
    }, 500);
  }, []);

  const handleSend = async () => {
    if (!input.trim() || isBotTyping) return;

    const userMsg: Message = {
      id: Date.now(),
      sender: 'user',
      text: input.trim(),
    };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setIsBotTyping(true);

    try {
      // AI 판단 기반 대화 시스템 호출
      const res = await fetch(`${baseUrl}/api/gemini`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMsg.text,
          conversationHistory: conversationHistory,
        }),
      });

      if (!res.ok) {
        throw new Error('API 호출 실패');
      }

      const data = await res.json();

      const botMsg: Message = {
        id: Date.now() + 1,
        sender: 'bot',
        text: data.message,
      };

      setMessages((prev) => [...prev, botMsg]);

      // 대화 히스토리 업데이트
      if (data.conversationHistory) {
        setConversationHistory(data.conversationHistory);
      } else {
        setConversationHistory((prev) => [
          ...prev,
          { role: 'user', content: userMsg.text },
          { role: 'assistant', content: data.message },
        ]);
      }

      // 추천 완료 체크
      if (data.type === 'recommendation') {
        setIsRecommended(true);
        setRecommendedBreed(data.recommendedBreed);
      }
    } catch (err) {
      console.error('Chat API 오류:', err);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: 'bot',
          text: '죄송합니다. 응답 중 오류가 발생했습니다. 다시 시도해주세요.',
        },
      ]);
    }

    setIsBotTyping(false);
  };

  return (
    <div className="flex flex-col min-w-md max-w-md mx-4 h-[calc(100vh-100px)] border border-yellow-800 rounded-lg shadow-md">
      {/* 메시지 영역 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex ${
              m.sender === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            <div
              className={`px-3 py-2 rounded-2xl max-w-[75%] text-sm ${
                m.sender === 'user'
                  ? 'bg-[#FFFBF2] text-gray-900'
                  : 'bg-white text-gray-900'
              } whitespace-pre-wrap`}
            >
              {m.text}
            </div>
          </div>
        ))}

        {/* 봇 타이핑 표시 */}
        {isBotTyping && (
          <div className="flex justify-start">
            <div className="px-3 py-2 rounded-2xl max-w-[75%] text-sm bg-white text-gray-900">
              <TypingIndicator />
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* 추천 완료 상태 표시 */}
      {isRecommended && recommendedBreed && (
        <div className="mt-3">
          <button
            onClick={() =>
              router.push(`/result?dog=${encodeURIComponent(recommendedBreed)}`)
            }
            className="w-full bg-[#100F0D] text-white px-4 py-2 hover:bg-gray-800 transition-colors text-sm font-medium"
          >
            🎉 추천 결과 보기
          </button>
        </div>
      )}

      {/* 입력 영역 */}
      <div className="border-t border-yellow-800 p-3 flex gap-2">
        <input
          className="flex-1 border border-yellow-800 rounded-xl px-3 py-2 focus:outline-yellow-900 text-sm"
          value={input}
          ref={inputRef}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
          placeholder="자유롭게 대화해보세요..."
          disabled={isBotTyping}
        />
        <button
          onClick={handleSend}
          disabled={isBotTyping || !input.trim()}
          className="bg-[#100F0D] text-white px-4 py-2 rounded-xl hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
        >
          {isBotTyping ? '...' : '전송'}
        </button>
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex items-center space-x-1">
      <span className="text-gray-500">AI가 생각하고 있어요</span>
      <span className="flex space-x-1">
        <span className="w-1 h-1 bg-gray-400 rounded-full animate-bounce"></span>
        <span
          className="w-1 h-1 bg-gray-400 rounded-full animate-bounce"
          style={{ animationDelay: '0.1s' }}
        ></span>
        <span
          className="w-1 h-1 bg-gray-400 rounded-full animate-bounce"
          style={{ animationDelay: '0.2s' }}
        ></span>
      </span>
    </div>
  );
}
