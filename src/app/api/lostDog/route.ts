import { NextResponse, NextRequest } from 'next/server';
import axios from 'axios';

interface DogRequestBody {
  pageNo: number;
  numOfRows: number;
  searchCondition: number;
  searchCondition3: number;
  species: string;
  searchKeyword: string;
}

export async function POST(req: NextRequest) {
  try {
    const body: DogRequestBody = await req.json();

    // 공공 API 키 (환경변수로 관리)
    const serviceKey = process.env.API_KEY;

    if (!serviceKey) {
      return NextResponse.json(
        { error: 'API Key가 설정되지 않았습니다.' },
        { status: 500 }
      );
    }

    // axios로 POST 요청 (body로 전달)
    const apiRes = await axios.get(
      'http://apis.data.go.kr/6300000/animalDaejeonService/animalDaejeonList',
      {
        params: {
          serviceKey,
          pageNo: body.pageNo,
          numOfRows: body.numOfRows,
          searchCondition: 1,
          searchCondition3: 1,
          species: body.species,
          searchKeyword: body.species,
          _type: 'json', // JSON으로 받기
        },
      }
    );

    const data = apiRes.data;

    return NextResponse.json({ data });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: '대전시 강아지 정보 조회 실패' },
      { status: 500 }
    );
  }
}
