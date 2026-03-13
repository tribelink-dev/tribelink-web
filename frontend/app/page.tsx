import { redirect } from 'next/navigation';

// Root route now forwards to the Explore page
export default function RootRedirect() {
  redirect('/explore');
}
