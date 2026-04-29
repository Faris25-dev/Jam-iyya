import { redirect } from 'next/navigation';

export default function VerifyPage({ params }: Readonly<{ params: { locale: string } }>) {
  redirect(`/${params.locale}/login`);
}