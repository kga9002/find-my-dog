import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dogBreeds from '../../data/breed.json';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// 코사인 유사도 함수 (안전하게 벡터 길이 맞춤)
function cosineSimilarity(a: number[], b: number[]): number {
	const len = Math.min(a.length, b.length);
	const dot = a.slice(0, len).reduce((sum, v, i) => sum + v * b[i], 0);
	const magA = Math.sqrt(a.slice(0, len).reduce((sum, v) => sum + v * v, 0));
	const magB = Math.sqrt(b.slice(0, len).reduce((sum, v) => sum + v * v, 0));
	return dot / (magA * magB);
}

export async function POST(req: NextRequest) {
	try {
		const { message, conversationHistory = [] } = await req.json();

		// 대화 히스토리 누적
		const newHistory = [
			...conversationHistory,
			{ role: 'user', content: message },
		];
		const fullConversation = newHistory
			.map((msg) => `${msg.role}: ${msg.content}`)
			.join('\n');

		// 사용자 메시지 개수
		const userMessageCount = newHistory.filter(
			(msg) => msg.role === 'user'
		).length;

		const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
		let judgment = 'CONTINUE';

		// 4번째 메시지부터는 무조건 추천
		if (userMessageCount >= 5) {
			judgment = 'RECOMMEND';
		} else {
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
			// 1. 사용자 메시지 임베딩
			const embedModel = genAI.getGenerativeModel({ model: 'embedding-001' });
			const embedRes = await embedModel.embedContent(message);
			const userVector = embedRes.embedding.values;

			// 2. 품종과 유사도 계산 (임베딩은 breed.json에 있음)
			const scored = dogBreeds.map((breed: any) => {
				const sim = cosineSimilarity(userVector, breed.vector);
				return { ...breed, score: sim };
			});

			// 3. 상위 3개 추출
			const topBreeds = scored.sort((a, b) => b.score - a.score).slice(0, 3);

			// 4. Gemini에게 최종 추천 요청
			const prompt = `
사용자 설명: ${message}
후보 품종:
${topBreeds.map((b) => `- ${b.name}: ${b.description}`).join('\n')}

위 후보 중에서 사용자에게 가장 잘 맞는 품종을 한 가지 고르고,
간단한 이유를 설명하세요.`;

			const result = await model.generateContent(prompt);
			const explanation = await result.response.text();

			const buttonMessage = `🎉 당신에게 딱 맞는 강아지 품종을 찾았어요! 아래 버튼을 눌러서 결과를 확인해보세요.`;

			return NextResponse.json({
				message: buttonMessage,
				type: 'recommendation',
				recommendedBreed: topBreeds[0].name,
				explanation,
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
- 친근하고 간단하게`;

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
			{ error: '대화 처리 중 오류가 발생했습니다.' },
			{ status: 500 }
		);
	}
}
