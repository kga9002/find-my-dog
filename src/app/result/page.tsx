import { Suspense } from 'react';
import ResultPage from '../components/ResultPage';

export default function Result() {
  return (
    <div className="w-screen h-screen bg-[#F2EFE4] flex">
      <Suspense>
        <ResultPage />
      </Suspense>
    </div>
  );
}
