import { GuestRoute } from "@/features/auth";

/**
 * Sign-in and sign-up only. Password recovery deliberately sits outside this
 * group: GuestRoute sends anyone already authenticated to the dashboard, which
 * for an emailed reset link means the link silently does nothing on a browser
 * where the account happens to be signed in. Recovery is not authentication —
 * holding a session on one device says nothing about whether you still know
 * your password, and PasswordResetService::reset() already drops every session
 * afterwards precisely because that is the usual reason to reset.
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <GuestRoute>{children}</GuestRoute>;
}
