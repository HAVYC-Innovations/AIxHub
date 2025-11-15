import { useEffect, useState } from 'react'

import type { Role } from '../../types/roles'

const workspaceOptions: { key: Role; label: string }[] = [
  { key: 'user', label: 'User workspace' },
  { key: 'user_pro', label: 'Pro workspace' },
  { key: 'admin', label: 'Admin cockpit' },
]

const socialProviders = [
  {
    id: 'microsoft',
    label: 'Sign in with Microsoft',
    icon: '🪟',
    authUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
  },
  {
    id: 'google',
    label: 'Sign in with Google',
    icon: '🅖',
    authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
  },
  {
    id: 'apple',
    label: 'Sign in with Apple',
    icon: '',
    authUrl: 'https://appleid.apple.com/auth/authorize',
  },
]

export type AuthModalProps = {
  open: boolean
  defaultTab?: 'signin' | 'signup'
  onClose: () => void
  onComplete: (role: Role) => void
}

const AuthModal = ({ open, defaultTab = 'signin', onClose, onComplete }: AuthModalProps) => {
  const [activeTab, setActiveTab] = useState<'signin' | 'signup'>(defaultTab)

  useEffect(() => {
    if (open) {
      setActiveTab(defaultTab)
    }
  }, [defaultTab, open])

  if (!open) return null

  const handleProviderClick = (authUrl: string) => {
    if (typeof window !== 'undefined') {
      window.open(authUrl, '_blank', 'noopener,noreferrer')
    }
  }

  const handleSubmit = () => {
    onComplete('user')
  }

  return (
    <div className="auth-overlay" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="auth-card" onClick={(event) => event.stopPropagation()}>
        <button type="button" className="auth-close" onClick={onClose} aria-label="Close authentication dialog">
          ×
        </button>
        <div className="auth-logo">🜂</div>
        <h3>Welcome to AIxHub</h3>
        <p>Sign in to sync your workspace or create a brand-new account.</p>

        <div className="auth-tabs">
          {(['signin', 'signup'] as const).map((tab) => (
            <button key={tab} type="button" className={activeTab === tab ? 'active' : ''} onClick={() => setActiveTab(tab)}>
              {tab === 'signin' ? 'Sign in' : 'Sign up'}
            </button>
          ))}
        </div>

        <form className="auth-form">
          <label>
            <span>Email address</span>
            <input type="email" placeholder="name@company.com" autoFocus />
          </label>
          <label>
            <span>Password</span>
            <input type="password" placeholder="••••••••" />
          </label>
          {activeTab === 'signup' && (
            <label>
              <span>Confirm password</span>
              <input type="password" placeholder="Repeat password" />
            </label>
          )}

          <button type="button" className="auth-submit" onClick={handleSubmit}>
            {activeTab === 'signin' ? 'Continue to workspace' : 'Create account'}
          </button>
        </form>

        <div className="auth-roles">
          <p>Choose where to go after signing in:</p>
          <div className="role-buttons">
            {workspaceOptions.map((option) => (
              <button key={option.key} type="button" onClick={() => onComplete(option.key)}>
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div className="auth-divider">
          <span />
          <p>or continue with</p>
          <span />
        </div>

        <div className="auth-social">
          {socialProviders.map((provider) => (
            <button key={provider.id} type="button" onClick={() => handleProviderClick(provider.authUrl)}>
              <span className="auth-icon">{provider.icon}</span>
              {provider.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export default AuthModal
