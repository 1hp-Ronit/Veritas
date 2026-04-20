import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { user, loading, isGuest, signIn, signUp, continueAsGuest } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // If already logged in or guest, redirect to home
  if (!loading && (user || isGuest)) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);

    try {
      if (isSignUp) {
        const { error } = await signUp(email, password);
        if (error) throw error;
        setSuccess('Account created! Check your email for a confirmation link.');
        setEmail('');
        setPassword('');
      } else {
        const { error } = await signIn(email, password);
        if (error) throw error;
        // Redirect happens automatically via auth state change
      }
    } catch (err) {
      setError(err.message || 'Authentication failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };



  return (
    <div className="min-h-screen bg-page flex items-center justify-center px-4 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-brandBlue/5 blur-3xl" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-brandGreen/5 blur-3xl" />
        <div className="absolute top-1/3 right-1/4 w-64 h-64 rounded-full bg-brandAmber/5 blur-3xl" />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo and branding */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-3">
            <div className="w-14 h-14 flex items-center justify-center pointer-events-none">
              <img src="/logo.png" alt="Veritas Logo" className="w-full h-full object-contain scale-[2.5]" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-textPrimary tracking-tight">Veritas</h1>
          <p className="text-textSecondary text-sm mt-1">Case Intelligence System</p>
        </div>

        {/* Auth card */}
        <div className="bg-surface rounded-2xl shadow-lg border border-border/60 p-8">
          {/* Top color accent */}
          <div className="h-1 w-full flex rounded-full overflow-hidden -mt-8 mb-6 mx-0 -mx-8" style={{ width: 'calc(100% + 4rem)', marginLeft: '-2rem' , marginTop: '-2rem', borderRadius: '1rem 1rem 0 0' }}>
            <div className="h-full flex-1 bg-brandBlue" />
            <div className="h-full flex-1 bg-brandRed" />
            <div className="h-full flex-1 bg-brandAmber" />
            <div className="h-full flex-1 bg-brandGreen" />
          </div>

          <h2 className="text-xl font-semibold text-textPrimary mb-1">
            {isSignUp ? 'Create your account' : 'Welcome back'}
          </h2>
          <p className="text-textSecondary text-sm mb-6">
            {isSignUp
              ? 'Sign up to access the intelligence platform'
              : 'Sign in to continue to Veritas'}
          </p>

          {/* Email/password form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="login-email" className="veritas-label">Email</label>
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="investigator@agency.gov"
                required
                className="veritas-input"
              />
            </div>

            <div>
              <label htmlFor="login-password" className="veritas-label">Password</label>
              <input
                id="login-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
                className="veritas-input"
              />
            </div>

            {/* Error message */}
            {error && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                <svg className="w-4 h-4 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{error}</span>
              </div>
            )}

            {/* Success message */}
            {success && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm">
                <svg className="w-4 h-4 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>{success}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full veritas-btn-primary py-3 rounded-full text-base font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  {isSignUp ? 'Creating account…' : 'Signing in…'}
                </>
              ) : (
                isSignUp ? 'Create Account' : 'Sign In'
              )}
            </button>
          </form>

          {/* Toggle sign-in / sign-up */}
          <p className="text-center text-sm text-textSecondary mt-6">
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError('');
                setSuccess('');
              }}
              className="text-accent font-medium hover:underline"
            >
              {isSignUp ? 'Sign in' : 'Sign up'}
            </button>
          </p>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-surface px-3 text-textMuted uppercase tracking-wider">or</span>
            </div>
          </div>

          {/* Continue as Guest */}
          <button
            onClick={continueAsGuest}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-full border border-border bg-white hover:bg-gray-50 text-textSecondary text-sm font-medium transition-all hover:shadow-sm hover:text-textPrimary focus:outline-none focus:ring-2 focus:ring-accent/30 active:scale-[0.98]"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            Continue as Guest
          </button>
        </div>

      </div>
    </div>
  );
}
