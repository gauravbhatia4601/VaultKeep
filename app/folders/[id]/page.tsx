import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import FolderViewClient from './FolderViewClient';

export default async function FolderViewPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  // Check authentication
  const user = await getCurrentUser();
  if (!user) {
    redirect('/login');
  }

  const { id } = await params;

  return <FolderViewClient folderId={id} user={user} />;
}
