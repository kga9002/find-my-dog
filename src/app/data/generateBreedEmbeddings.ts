import fs from 'fs';
import path from 'path';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { fileURLToPath } from 'url';

// 환경변수 확인
if (!process.env.GEMINI_API_KEY) {
	throw new Error('환경변수 GEMINI_API_KEY가 필요합니다!');
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// ES Module에서 __dirname 대체
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// breed.json 경로
const breedFilePath = path.join(__dirname, 'breed.json');

async function main() {
	const raw = fs.readFileSync(breedFilePath, 'utf-8');
	const breeds = JSON.parse(raw);

	for (let i = 0; i < breeds.length; i++) {
		const breed = breeds[i];
		const text = `${breed.name}. ${breed.description}. 에너지: ${
			breed.energy_level
		}. 성격: ${
			Array.isArray(breed.temperament)
				? breed.temperament.join(' ')
				: breed.temperament
		}`;

		console.log(`임베딩 생성 중: ${breed.name} (${i + 1}/${breeds.length})`);

		// 임베딩 생성
		const embedModel = genAI.getGenerativeModel({ model: 'embedding-001' });
		const embedRes = await embedModel.embedContent(text);

		// vector 필드에 임베딩 값 저장
		breed.vector = embedRes.embedding.values;
	}

	// 새 JSON 파일로 저장 (기존 덮어쓰기)
	fs.writeFileSync(breedFilePath, JSON.stringify(breeds, null, 2), 'utf-8');
	console.log('✅ 모든 품종 임베딩 생성 완료!');
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
