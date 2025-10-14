import { redirect } from 'next/navigation';
import { getCurrentUser, destroySession } from '@/lib/auth';
import DashboardClient from '@/app/dashboard/DashboardClient';

async function handleLogout() {
  'use server';
  await destroySession();
  redirect('/login');
}

export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  return <DashboardClient user={user} handleLogout={handleLogout} />;
}
