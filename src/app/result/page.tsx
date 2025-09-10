'use client';
import { useSearchParams } from 'next/navigation';
import breedData from '../data/breed.json';

export default function Home() {
  const searchParams = useSearchParams();
  const dogParam = searchParams.get('dog');
  const dogName = dogParam ? decodeURIComponent(dogParam) : null;

  const dogInfo = dogName
    ? breedData.find((dog) => dog.name === dogName)
    : null;

  return (
    <div className="w-screen h-screen bg-[#F2EFE4] flex">
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
            <div className="rounded-2xl bg-yellow-700 px-4 py-2 text-white font-medium text-sm">
              {o}
            </div>
          ))}
        </div>
        <div className="mt-12 bg-yellow-300 h-30 w-30 mx-auto"></div>
      </div>
    </div>
  );
}
