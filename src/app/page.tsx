import Image from 'next/image';
import Link from 'next/link';

export default function Home() {
  return (
    <div className="bg-[#F2EFE4] w-screen h-screen flex">
      <div className="mx-auto my-auto flex flex-col">
        <Image
          src={'/logo/main.png'}
          alt={'dog logo'}
          width={300}
          height={300}
        ></Image>
        <p className="text-center text-5xl font-bold text-yellow-900">
          Find My Dog
        </p>
        <Link href="/chat" className="mx-auto mt-12">
          <button
            type="button"
            className="border-3 border-solid border-yellow-800 px-8 py-2 rounded-2xl text-xl text-yellow-950 cursor-pointer"
          >
            입장하기
          </button>
        </Link>
      </div>
    </div>
  );
}
