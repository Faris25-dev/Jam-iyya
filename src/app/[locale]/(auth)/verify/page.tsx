'use client';

import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

// Redirect /verify to /login since OTP is now inline on login/signup pages
function VerifyRedirect() {
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) || 'en';
  router.replace(`/${locale}/login`);
  return null;
}

export default function VerifyPage() {
  return (
    <Suspense>
      <VerifyRedirect />
    </Suspense>
  );
}