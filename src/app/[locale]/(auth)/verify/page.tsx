<<<<<<< HEAD
import { redirect } from 'next/navigation';

export default function VerifyPage({ params }: Readonly<{ params: { locale: string } }>) {
  redirect(`/${params.locale}/login`);

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
>>>>>>> e1b5db2fb33698e892e2744760d5ba859d9e37dd
}