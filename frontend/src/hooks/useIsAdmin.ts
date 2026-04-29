import { useAuth } from './useAuth';

// Whitelist of email addresses that should also be treated as admins
// (in addition to anyone whose role is 'ADMIN').
const ADMIN_EMAILS: string[] = [
  // 'owner@indtrans.com',
];

export function useIsAdmin(): boolean {
  const { user } = useAuth();
  if (!user) return false;
  if (user.role === 'ADMIN') return true;
  if (user.email && ADMIN_EMAILS.includes(user.email.toLowerCase())) return true;
  return false;
}