'use client';

import Image from 'next/image';
import logoBlack from '@/images/2025.02.03 - Logo_Black.svg';
import logoWhite from '@/images/2025.02.03 - Logo_White.svg';

export function BrandLogo() {
  return (
    <span className="flex h-10 w-10 sm:h-11 sm:w-11 flex-shrink-0 items-center justify-center">
      <Image src={logoBlack} alt="" className="block h-full w-full dark:hidden" aria-hidden="true" />
      <Image src={logoWhite} alt="" className="hidden h-full w-full dark:block" aria-hidden="true" />
    </span>
  );
}
