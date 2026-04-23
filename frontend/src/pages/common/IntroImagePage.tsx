// [2026-04-21] 소개 - 안전보건 경영방침 / 안전보건 인증 공용 이미지 페이지
import { useState } from 'react';

interface Props {
  title: string;
  imageSrc: string;
}

export default function IntroImagePage({ title, imageSrc }: Props) {
  const [lightbox, setLightbox] = useState(false);

  return (
    <div className="p-8 flex flex-col items-center">
      <h1 className="text-xl font-bold text-gray-800 mb-6">{title}</h1>

      {/* 이미지 (클릭 시 라이트박스) */}
      <div
        className="cursor-zoom-in shadow-xl rounded-lg overflow-hidden border border-gray-200 max-w-xl w-full"
        onClick={() => setLightbox(true)}
        title="클릭하면 크게 볼 수 있습니다"
      >
        <img src={imageSrc} alt={title} className="w-full h-auto" />
      </div>

      <p className="mt-3 text-xs text-gray-400">클릭하면 크게 볼 수 있습니다</p>

      {/* 라이트박스 */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setLightbox(false)}
        >
          <div className="relative max-w-4xl w-full" onClick={(e) => e.stopPropagation()}>
            <button
              className="absolute -top-10 right-0 text-white text-2xl hover:text-gray-300 leading-none"
              onClick={() => setLightbox(false)}
            >
              ✕
            </button>
            <img
              src={imageSrc}
              alt={title}
              className="w-full h-auto rounded-lg shadow-2xl"
            />
          </div>
        </div>
      )}
    </div>
  );
}
