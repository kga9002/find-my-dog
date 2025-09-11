import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dogBreeds from '../../data/breed.json';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// 사용자 정보 추출 함수
function extractUserInfo(conversationHistory: string) {
  const userText = conversationHistory.toLowerCase();

  const traits = {
    activity: 0, // 활동성
    social: 0, // 사교성
    calm: 0, // 차분함
    family: 0, // 가족지향
    independent: 0, // 독립성
    experience: 0, // 반려동물 경험
  };

  // 활동성 키워드
  const activityKeywords = [
    '운동',
    '산책',
    '등산',
    '야외',
    '활동',
    '뛰어',
    '에너지',
  ];
  const calmKeywords = ['집', '독서', '영화', '휴식', '조용', '평온', '차분'];

  // 사교성 키워드
  const socialKeywords = ['친구', '모임', '파티', '사람들', '만남', '외향'];
  const introvertKeywords = ['혼자', '개인', '내향', '조용'];

  // 가족 키워드
  const familyKeywords = ['가족', '아이', '어린이', '함께', '집'];

  // 독립성 키워드
  const independentKeywords = ['독립', '자유', '개인', '혼자'];

  // 키워드 점수 계산
  activityKeywords.forEach((word) => {
    if (userText.includes(word)) traits.activity += 1;
  });

  calmKeywords.forEach((word) => {
    if (userText.includes(word)) traits.calm += 1;
  });

  socialKeywords.forEach((word) => {
    if (userText.includes(word)) traits.social += 1;
  });

  introvertKeywords.forEach((word) => {
    if (userText.includes(word)) traits.independent += 1;
  });

  familyKeywords.forEach((word) => {
    if (userText.includes(word)) traits.family += 1;
  });

  return traits;
}

// 품종 매칭 함수
function matchBreed(userTraits: any) {
  let bestMatch = dogBreeds[0];
  let bestScore = 0;

  dogBreeds.forEach((breed: any) => {
    let score = 0;

    // 활동성 매칭
    if (
      breed.energy_level === 'high' &&
      userTraits.activity > userTraits.calm
    ) {
      score += 3;
    } else if (
      breed.energy_level === 'low' &&
      userTraits.calm > userTraits.activity
    ) {
      score += 3;
    } else if (breed.energy_level === 'medium') {
      score += 2;
    }

    // 사교성 매칭
    if (breed.temperament.includes('사교적') && userTraits.social > 0) {
      score += 2;
    } else if (
      breed.temperament.includes('독립적') &&
      userTraits.independent > 0
    ) {
      score += 2;
    }

    // 가족 친화성
    if (breed.temperament.includes('친화적') && userTraits.family > 0) {
      score += 2;
    }

    if (score > bestScore) {
      bestScore = score;
      bestMatch = breed;
    }
  });

  return { breed: bestMatch, score: bestScore };
}

export async function POST(req: NextRequest) {
  try {
    const { message, conversationHistory = [] } = await req.json();

    // 대화 히스토리에 새 메시지 추가
    const newHistory = [
      ...conversationHistory,
      { role: 'user', content: message },
    ];
    const fullConversation = newHistory
      .map((msg) => `${msg.role}: ${msg.content}`)
      .join('\n');

    // 사용자 메시지 개수 확인
    const userMessageCount = newHistory.filter(
      (msg) => msg.role === 'user'
    ).length;

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    // 🔥 4번째 사용자 메시지부터는 무조건 추천!
    let judgment = 'CONTINUE';

    if (userMessageCount >= 5) {
      judgment = 'RECOMMEND';
    } else {
      // 3번째까지는 AI 판단
      const judgePrompt = `
대화: ${fullConversation}

강아지 추천할 만큼 정보가 충분한가요?
사용자가 3번 이상 답변했고 성격이 어느정도 파악되면 "RECOMMEND"
아직 더 알아야 하면 "CONTINUE"

답변: CONTINUE 또는 RECOMMEND 중 하나만`;

      const judgeResult = await model.generateContent(judgePrompt);
      judgment = (await judgeResult.response.text()).trim();
    }

    if (judgment === 'RECOMMEND') {
      // 추천 단계
      const userTraits = extractUserInfo(fullConversation);
      const matchResult = matchBreed(userTraits);

      const buttonMessage = `🎉 당신에게 딱 맞는 강아지 품종을 찾았어요! 아래 버튼을 눌러서 결과를 확인해보세요.`;

      return NextResponse.json({
        message: buttonMessage,
        type: 'recommendation',
        recommendedBreed: matchResult.breed.name,
        // breedData: matchResult.breed,
        // userTraits: userTraits,
        conversationHistory: [
          ...newHistory,
          { role: 'assistant', content: buttonMessage },
        ],
      });
    } else {
      // 계속 대화
      const chatPrompt = `
대화: ${fullConversation}

강아지 추천 상담사로서 자연스럽게 대화하세요.
- 1-2문장으로 짧게 답변
- 사용자 답변에 공감 한마디 + 또 다른 질문 하나
- 생활패턴, 성격, 거주환경 등을 파악하는것이 목표
- 친근하고 간단하게

예시: "와 활동적이시네요! 보통 집에서는 어떻게 시간 보내세요?"`;

      const chatResult = await model.generateContent(chatPrompt);
      const response = await chatResult.response.text();

      return NextResponse.json({
        message: response,
        type: 'conversation',
        conversationHistory: [
          ...newHistory,
          { role: 'assistant', content: response },
        ],
      });
    }
  } catch (error) {
    console.error('Chat API 오류:', error);
    return NextResponse.json(
      {
        error: '대화 처리 중 오류가 발생했습니다.',
      },
      { status: 500 }
    );
  }
}
