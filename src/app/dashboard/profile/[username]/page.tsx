// This file is being replaced by the logic in `profile-page-client.tsx`
// to consolidate data fetching and rendering into a single client component,
// resolving server/client conflicts. The page will now be rendered by the client component.
'use client';
import { ProfilePageClient } from '@/components/profile-page-client';

// The new structure uses a client component to fetch and render the data.
// The page itself just needs to render that client component.
export default function ProfilePage() {
  return <ProfilePageClient />;
}
