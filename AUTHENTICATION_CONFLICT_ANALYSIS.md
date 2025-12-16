# Authentication Conflict Analysis: OAuth vs Email/Password Login Issue

## Executive Summary

This document explains a common authentication conflict where users successfully sign in with Google OAuth but encounter "no account found" errors when attempting to login with email/password credentials, while simultaneously receiving "email already registered" messages during sign-up attempts.

## Problem Description

### User Experience Flow

1. **Google Sign-In**: ✅ User successfully authenticates via Google OAuth
2. **Email/Password Login**: ❌ System returns "No account found" error
3. **Email/Password Sign-Up**: ❌ System returns "This email is already registered"

### Visual Evidence

From the provided screenshots (isapm2026.org):
- Login page shows: "No account found - We couldn't find an account with rofiudin.kupenk@gmail.com"
- Sign-up page shows: "This email is already registered. Please sign in instead."

---

## Root Cause Analysis

### 1. **Authentication Provider Segregation**

Modern authentication systems (like Supabase, Auth0, Firebase) treat different authentication methods as **separate identity providers**, even when using the same email address.

#### Database Structure

In Supabase's `auth.users` table:
```sql
CREATE TABLE auth.users (
  id uuid PRIMARY KEY,
  email text,
  encrypted_password text,  -- NULL for OAuth users
  ...
)
```

#### Identity Linking Table

Supabase uses `auth.identities` to track authentication methods:
```sql
CREATE TABLE auth.identities (
  id uuid PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id),
  provider text,  -- 'email' or 'google'
  ...
)
```

**Key Insight**: A user who signs up via Google has:
- `provider = 'google'` in auth.identities
- `encrypted_password = NULL` in auth.users
- ✅ Google OAuth credentials stored
- ❌ NO email/password credentials

### 2. **Why "No Account Found" on Email Login**

When attempting email/password login, the system:

```typescript
// From app/auth/login/page.tsx
const { data, error } = await supabase.auth.signInWithPassword({
  email,
  password,
})
```

This checks for:
1. User exists with matching email
2. **AND** has a valid `encrypted_password` (email provider)
3. **AND** password matches the hash

For Google OAuth users:
- ✅ Email exists in system
- ❌ No encrypted_password (it's NULL)
- **Result**: "Invalid login credentials" / "No account found"

### 3. **Why "Email Already Registered" on Sign-Up**

When attempting to create a new account:

```typescript
// From app/auth/sign-up/page.tsx
const { data, error } = await supabase.auth.signUp({
  email,
  password,
})

if (data?.user?.identities?.length === 0) {
  setError("This email is already registered. Please sign in instead.")
}
```

Supabase prevents duplicate emails across all providers:
- The email `rofiudin.kupenk@gmail.com` already exists (Google OAuth)
- Sign-up with email/password is blocked
- `identities.length === 0` indicates email collision
- **Result**: "This email is already registered"

---

## Technical Implementation Details

### Current ISAPM 2026 Auth Flow

#### Login Logic (app/auth/login/page.tsx)

```typescript
// Attempts password authentication
const { data, error: signInError } = await supabase.auth.signInWithPassword({
  email,
  password,
})

if (signInError) {
  // Check if user exists in profiles table
  const { data: existingUser } = await supabase
    .from("profiles")
    .select("id")
    .eq("email", email.toLowerCase())
    .maybeSingle()

  if (!existingUser) {
    // User doesn't exist at all
    setErrorType("user_not_found")
  } else {
    // User exists but wrong password
    setErrorType("invalid_credentials")
  }
}
```

**Issue**: This logic checks the `profiles` table, but doesn't distinguish between:
- OAuth-only accounts (no password)
- Email/password accounts (has password)

#### Sign-Up Logic (app/auth/sign-up/page.tsx)

```typescript
const { data, error } = await supabase.auth.signUp({
  email,
  password,
})

if (data?.user?.identities?.length === 0) {
  // Email already exists with ANY provider
  setError("This email is already registered. Please sign in instead.")
}
```

**Issue**: Generic error doesn't explain that the account exists via Google OAuth.

---

## Why This Happens: The OAuth vs Password Paradox

### Scenario Breakdown

#### Step 1: Google Sign-In (First Time)
```
User clicks "Sign in with Google"
  ↓
Redirected to Google OAuth
  ↓
Google confirms identity
  ↓
Supabase creates:
  - auth.users record (email, id)
  - auth.identities record (provider='google')
  - profiles record
  - encrypted_password = NULL
```

**State**: Account exists with Google provider only.

#### Step 2: Email/Password Login Attempt
```
User enters email + password
  ↓
System checks: Does this email have password credentials?
  ↓
encrypted_password is NULL
  ↓
ERROR: "No account found" or "Invalid credentials"
```

**Why**: The system can't authenticate with a password that was never set.

#### Step 3: Email/Password Sign-Up Attempt
```
User tries to create account with same email
  ↓
System checks: Does this email already exist?
  ↓
YES - exists with Google OAuth
  ↓
ERROR: "This email is already registered"
```

**Why**: Email uniqueness constraint prevents duplicate accounts.

---

## Backend Architecture Considerations

### Database State Analysis

For user `rofiudin.kupenk@gmail.com`:

**auth.users table**:
```sql
id: 12345-uuid
email: rofiudin.kupenk@gmail.com
encrypted_password: NULL  -- ❌ No password set
email_confirmed_at: 2024-12-12
created_at: 2024-12-12
```

**auth.identities table**:
```sql
id: 67890-uuid
user_id: 12345-uuid
provider: google  -- ✅ Google OAuth only
provider_id: 102847563...  -- Google user ID
```

**profiles table**:
```sql
id: 12345-uuid
email: rofiudin.kupenk@gmail.com
full_name: Rofiul Din
-- Other profile data
```

### Authentication Method Matrix

| Email Exists? | Provider | Has Password? | Email Login | OAuth Login | Sign Up |
|---------------|----------|---------------|-------------|-------------|---------|
| No | - | No | ❌ Not found | N/A | ✅ Can create |
| Yes | email | Yes | ✅ Works | N/A | ❌ Already exists |
| Yes | google | No | ❌ **Not found** | ✅ Works | ❌ **Already exists** |
| Yes | both | Yes | ✅ Works | ✅ Works | ❌ Already exists |

**The Conflict**: Row 3 - OAuth-only accounts create this paradox.

---

## Common Causes in Web Applications

### 1. **Lack of Account Linking**

Most modern auth systems support multiple providers per account, but many implementations don't enable automatic linking:

```typescript
// Ideal implementation (not currently in ISAPM)
await supabase.auth.linkIdentity({
  provider: 'email',
  email: user.email,
  password: password
})
```

### 2. **Insufficient Provider Detection**

Login pages should detect which providers are associated with an email:

```typescript
// What should happen (not currently implemented)
const providers = await supabase.auth.getProvidersByEmail(email)
// Returns: ['google']
// Then show: "This email uses Google Sign-In. Please use the Google button."
```

### 3. **Silent OAuth Account Creation**

OAuth flows create accounts automatically without user awareness:
- User clicks "Sign in with Google"
- Account is created instantly
- User assumes they need to "sign up" separately
- Confusion ensues

### 4. **Missing Password Reset Flow**

OAuth users can't use "Forgot Password" because no password exists:

```typescript
// Current forgot-password logic fails for OAuth users
await supabase.auth.resetPasswordForEmail(email)
// Returns error: "Email not found" (technically has no password)
```

---

## Solutions & Recommendations

### Short-Term Fixes (Immediate)

#### 1. **Enhanced Error Messaging**

Update login page to detect OAuth accounts:

```typescript
// Improved login logic
if (signInError) {
  // Check which auth providers this email uses
  const { data: authUser } = await supabase.auth.admin.getUserByEmail(email)
  
  if (authUser?.identities) {
    const providers = authUser.identities.map(i => i.provider)
    
    if (providers.includes('google') && !providers.includes('email')) {
      setError("This email is registered with Google. Please use 'Sign in with Google' button below.")
      setShowGoogleButton(true)
      return
    }
  }
}
```

#### 2. **Email Provider Detection on Sign-Up**

```typescript
// Improved sign-up logic
if (data?.user?.identities?.length === 0) {
  // Check which provider owns this email
  const { data: existingAuth } = await supabase.auth.admin.getUserByEmail(email)
  const provider = existingAuth?.identities?.[0]?.provider
  
  if (provider === 'google') {
    setError(
      `This email is already registered with Google Sign-In. 
       Please use the "Sign in with Google" button instead.`
    )
  } else {
    setError("This email is already registered. Please sign in instead.")
  }
}
```

### Medium-Term Solutions

#### 3. **Account Linking Interface**

Allow users to add password to OAuth accounts:

```typescript
// New page: /auth/add-password
const handleAddPassword = async (password: string) => {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (user) {
    // Update user to add password authentication
    await supabase.auth.updateUser({ password })
    
    // Now user can login with both Google AND email/password
  }
}
```

#### 4. **Provider Detection Widget**

Add a "Check your login method" feature:

```typescript
// Component: <LoginMethodChecker email={email} />
const LoginMethodChecker = ({ email }) => {
  const checkProviders = async () => {
    const response = await fetch('/api/auth/check-providers', {
      method: 'POST',
      body: JSON.stringify({ email })
    })
    const { providers } = await response.json()
    // Show: "This email uses: Google, Email/Password"
  }
}
```

### Long-Term Architecture

#### 5. **Universal Account System**

Implement true multi-provider support:

```sql
-- Migration: Allow multiple identities per user
-- User can have both 'email' AND 'google' providers
-- Supabase already supports this natively
```

#### 6. **Smart Login Page**

Auto-detect and suggest correct login method:

```
[Email Input: rofiudin.kupenk@gmail.com]
↓
System detects: Google OAuth
↓
UI shows: 
  "We found your account! Please sign in with:"
  [🔵 Continue with Google]
  
  Or add a password to enable email login:
  [Add Password to Account]
```

---

## Security Considerations

### Why Separate Providers Matter

1. **OAuth Trust Model**: Google verifies the email, app trusts Google
2. **Password Security**: User sets password, app must hash and verify
3. **Different Attack Vectors**:
   - OAuth: Account hijacking via Google account compromise
   - Email/Password: Brute force, credential stuffing, phishing

### Linking Risks

Automatically linking OAuth to existing email accounts can be dangerous:

```
Attacker scenario:
1. Victim uses email/password (email@example.com)
2. Attacker creates Google account with same email
3. If automatic linking is enabled:
   → Attacker gains access to victim's account via Google OAuth
```

**Solution**: Require email verification or additional authentication before linking.

---

## Implementation Checklist for ISAPM 2026

### Phase 1: Quick Wins (Week 1)
- [ ] Update login error messages to detect OAuth accounts
- [ ] Add visual indicator for which providers an email uses
- [ ] Update sign-up error to mention Google sign-in
- [ ] Add help text: "Already have a Google account? Use the button below"

### Phase 2: Account Management (Week 2-3)
- [ ] Create `/profile/security` page
- [ ] Add "Link Google Account" button for email users
- [ ] Add "Add Password" button for OAuth-only users
- [ ] Implement provider detection API endpoint

### Phase 3: UX Polish (Week 4)
- [ ] Add "Forgot how you signed up?" helper
- [ ] Implement magic link as fallback
- [ ] Create account recovery flow
- [ ] Add session management for multiple providers

---

## Conclusion

The "no account found" vs "email already registered" paradox occurs because:

1. **OAuth and email/password are separate authentication providers**
2. **Accounts created via Google OAuth have no password set**
3. **Email uniqueness prevents duplicate accounts across providers**
4. **Current implementation doesn't detect or communicate provider differences**

This is not a bug but a **design limitation** in how separate authentication providers are handled. The solution requires better provider detection, clearer messaging, and optional account linking features.

---

## Testing Scenarios

### Reproduce the Issue

1. Sign up via Google OAuth with test@example.com
2. Attempt login with test@example.com + password
3. Observe "No account found" error
4. Attempt sign-up with test@example.com + password
5. Observe "Email already registered" error

### Verify Fix

After implementing provider detection:
1. Attempt login with OAuth email + password
2. Should see: "This email uses Google Sign-In" message
3. Should see highlighted "Sign in with Google" button
4. Click "Sign in with Google" → successful login

---

## References

- Supabase Auth Documentation: https://supabase.com/docs/guides/auth
- OAuth 2.0 Specification: https://oauth.net/2/
- OIDC (OpenID Connect): https://openid.net/connect/
- Account Linking Best Practices: https://auth0.com/docs/users/user-account-linking

---

**Document Version**: 1.0  
**Last Updated**: December 12, 2024  
**Author**: v0 AI Assistant  
**Application**: ISAPM 2026 Conference Portal
