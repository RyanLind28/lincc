# Lincc Auth Email Templates

All Lincc-branded HTML templates for Supabase Auth emails. They share the same
design language: gradient bar, Lincc logo, coral → purple palette, contact line
pointing at `hello@lincc.live`.

These files are **reference copies**. Supabase does not sync them automatically —
you must paste them into **Dashboard → Auth → Email Templates** for each slot.

## Template → Dashboard slot mapping

### Auth (action) templates — Dashboard → Auth → **Email Templates**

| File | Dashboard slot | When it's sent |
|---|---|---|
| `confirm-signup.html` | **Confirm signup** | User signs up with email/password, needs to verify the email address. |
| `magic-link.html` | **Magic Link** | User requests a passwordless sign-in via `signInWithOtp`. |
| `invite.html` | **Invite user** | Admin invites a user via Dashboard (or via `auth.admin.inviteUserByEmail`). |
| `change-email.html` | **Change Email Address** | User updates their email — this is sent to the _new_ address to confirm. |
| `reset-password.html` | **Reset Password** | User clicks "Forgot password" — contains a secure reset link. |
| `reauthentication.html` | **Reauthentication** | Sensitive operation (e.g. email change) requires a 6-digit code to reconfirm identity. Uses `{{ .Token }}`. |

### Security (notification) templates — Dashboard → Auth → **Email Templates → Security**

Sent _after_ a security-relevant change to alert the user. Gives them a chance
to act if it wasn't them. All use an amber "Security notice" pill (green "Account
secured" pill for `mfa-added.html`) and a red warning block with `hello@lincc.live`
contact.

| File | Dashboard slot | When it's sent |
|---|---|---|
| `password-changed.html` | **Password changed** | User's password was updated. |
| `email-changed.html` | **Email address changed** | User's email address was changed. Uses `{{ .OldEmail }}` + `{{ .Email }}`. |
| `phone-changed.html` | **Phone number changed** | User's phone number was updated. |
| `identity-linked.html` | **Identity linked** | A new sign-in method (OAuth provider, email, etc.) was linked. |
| `identity-unlinked.html` | **Identity unlinked** | A sign-in method was removed. |
| `mfa-added.html` | **MFA method added** | Two-factor authentication was enabled. |
| `mfa-removed.html` | **MFA method removed** | Two-factor authentication was disabled. |

## Template variables used

- `{{ .ConfirmationURL }}` — the action link (verify / reset / log in / accept invite)
- `{{ .Email }}` — the recipient's email
- `{{ .Token }}` — one-time code (reauthentication only)
- `{{ .SiteURL }}` — the project's Site URL (unused currently, but available)

## Also required for emails to look Lincc

The HTML body is only half the picture — the **sender identity** also needs to
look right. By default Supabase sends from `noreply@mail.app.supabase.io` as
"Supabase Auth", which will show "Supabase" in the user's inbox even when the
HTML body is branded. Fix:

1. Configure **custom SMTP** in Dashboard → Auth → SMTP Settings (Resend,
   SendGrid, Postmark, or similar) with `hello@lincc.live` as the sender.
2. Also bumps your rate limits well above the default shared SMTP's ~2-4/hour,
   which is essential once more testers sign up in a burst.

See TODO.md → "Confirmation email sometimes not delivered" for context.

## Extras

These are not in the Supabase Email Templates UI — they're sent by custom Edge Functions:

| File | Edge Function | When it's sent |
|---|---|---|
| `waitlist-confirmation.html` | `send-waitlist-email` | Someone submits the waitlist form on the landing page. |
| `welcome.html` | `send-welcome-email` | User completes email verification and first loads the app (fires once, dedupe via `profiles.welcomed_at`). |

Both functions need `RESEND_API_KEY` and `EMAIL_FROM` secrets set in Dashboard → Edge Functions → Manage Secrets.
