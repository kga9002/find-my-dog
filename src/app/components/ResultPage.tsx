'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import breedData from '../data/breed.json';
import { useEffect, useState } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'swiper/css/scrollbar';

import { MdKeyboardArrowLeft } from 'react-icons/md';
import { MdKeyboardArrowRight } from 'react-icons/md';

export default function ResultPage() {
  const searchParams = useSearchParams();
  const dogParam = searchParams.get('dog');
  const dogName = dogParam ? decodeURIComponent(dogParam) : null;

  const dogInfo = dogName
    ? breedData.find((dog) => dog.name === dogName)
    : null;

  const [apiData, setApiData] = useState<any[] | null>(null);

  const router = useRouter();

  useEffect(() => {
    if (!dogName) return;

    const fetchData = async () => {
      try {
        const res = await fetch('/api/lostDog', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            pageNo: 1,
            numOfRows: 5,
            species: dogName,
          }),
        });

        if (!res.ok) {
          console.error('API 요청 실패:', res.status);
          return;
        }

        // 1. 응답을 JSON 객체로 파싱
        const jsonResponse = await res.json();
        // 2. JSON 객체에서 XML 문자열 추출
        const xmlString = jsonResponse.data;

        console.log('fetchData 내부 XML:', xmlString);

        // XML 파싱 (DOMParser 사용)
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlString, 'text/xml');

        // Change 'item' to 'items'
        const items = Array.from(xmlDoc.getElementsByTagName('items')).map(
          (item) => ({
            age: item.getElementsByTagName('age')[0]?.textContent,
            image: item.getElementsByTagName('filePath')[0]?.textContent,
            regId: item.getElementsByTagName('regId')[0]?.textContent,
          })
        );

        console.log('파싱된 데이터:', items);
        setApiData(items);
      } catch (err) {
        console.error('fetch 에러:', err);
      }
    };

    fetchData();
  }, [dogName]);

  return (
    <div className="flex flex-col mx-auto my-auto">
      <p className="font-bold text-2xl text-yellow-900 text-center">
        당신에게 추천하는 강아지는...
      </p>
      <p className="mt-5 text-center text-3xl font-extrabold">{dogName}</p>
      <p className="mt-2 text-center font-medium">
        {dogInfo ? dogInfo.description : ''}
      </p>
      <div className="flex flex-row mx-auto gap-4 mt-2">
        {dogInfo?.temperament.map((o) => (
          <div
            key={o}
            className="rounded-2xl bg-yellow-700 px-4 py-2 text-white font-medium text-sm"
          >
            {o}
          </div>
        ))}
      </div>
      <div className="mt-12 w-[400px] mx-auto flex flex-col">
        {apiData === null ? ( // null이면 아직 로딩 중
          <p className="text-center font-medium">로딩중...</p>
        ) : apiData.length === 0 ? (
          <p className="text-center font-medium whitespace-pre-line">
            {`해당 품종의 유기동물 공고가 없습니다.\n좋은일이죠😊`}
          </p>
        ) : (
          <div className="flex flex-row items-center gap-8">
            <button
              type="button"
              className="bg-[rgba(156,163,175,0.3)] rounded-full p-3 swiper-prev"
            >
              <MdKeyboardArrowLeft />
            </button>
            <Swiper
              spaceBetween={50}
              slidesPerView={1}
              centeredSlides={true}
              modules={[Navigation]}
              navigation={{
                prevEl: '.swiper-prev',
                nextEl: '.swiper-next',
              }}
            >
              {apiData.map((o: any) => (
                <SwiperSlide key={o.regIg}>
                  <div className="flex flex-col justify-center items-center h-full bg-white py-4 rounded-3xl">
                    <img
                      src={`http://www.daejeon.go.kr/${o.image}`}
                      className="w-[200px] aspect-square object-cover"
                      alt=""
                    />
                    <p className="mt-4">{`나이 : ${o.age}`}</p>
                    <p className="mt-2">{`동물등록번호 : ${o.regId}`}</p>
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>
            <button
              type="button"
              className="bg-[rgba(156,163,175,0.3)] rounded-full p-3 swiper-next"
            >
              <MdKeyboardArrowRight />
            </button>
          </div>
        )}
        <button
          type="button"
          onClick={() => router.replace('/')}
          className="mx-auto mt-8 bg-white px-4 py-2 rounded-xl border-2 border-solid border-yellow-900"
        >
          홈으로 가기
        </button>
      </div>
    </div>
  );
}
