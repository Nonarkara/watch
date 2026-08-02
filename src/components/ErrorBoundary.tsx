import { Component, type ErrorInfo, type ReactNode } from 'react'
import { Link } from 'react-router-dom'

interface Props { children: ReactNode }
interface State { error: Error | null }

/**
 * Catches render-time throws anywhere in the route tree and shows an honest
 * fallback instead of a white screen. The lessons log documents silent blank
 * pages as a recurring pain (dead links, missing data) — a boundary turns a
 * cryptic blank shell into a readable message with a way back.
 *
 * This is a class component because React exposes error boundaries only via
 * the class lifecycle (getDerivedStateFromError / componentDidCatch).
 */
export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Surface in the console + keep the component stack for the report link.
    console.error('[Time Pop] render error:', error, info.componentStack)
  }

  render() {
    if (this.state.error) {
      return (
        <div className="err-boundary">
          <p className="eyebrow">SOMETHING BROKE ON THIS PAGE</p>
          <h1 className="pagetitle">That page hit an error.</h1>
          <p className="lede">
            The rest of the site is unaffected. This is a rendering bug, not bad
            data — the numbers behind every dossier are computed before this page
            runs, so the register itself is intact.
          </p>
          <p className="mono micro dim" style={{ marginTop: 'var(--space-md)' }}>
            {this.state.error.message}
          </p>
          <div className="hero-actions" style={{ marginTop: 'var(--space-md)' }}>
            <Link className="btn" to="/" onClick={() => this.setState({ error: null })}>
              BACK TO HOME →
            </Link>
            <Link className="btn secondary" to="/register">BROWSE THE REGISTER</Link>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}