import { LogIn, UserPlus } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export function LoginPage() {
  const auth = useAuth()
  return <div className="page auth-page"><div className="auth-panel"><div className="eyebrow">FABLE ACCESS</div><h1>Welcome back</h1><p>Sign in through Keycloak. Java validates your token and synchronizes your application profile.</p><button className="primary-button" onClick={auth.login}><LogIn size={16} />Continue with Keycloak</button><Link className="quiet-button auth-login" to="/register"><UserPlus size={16} />Create an account</Link></div><div className="auth-aside"><strong>One identity, shared everywhere.</strong><span>Your Keycloak roles decide which Java resources and pages you can access.</span></div></div>
}
