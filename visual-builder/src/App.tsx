import React from 'react'
import { MemoryRouter } from 'react-router-dom'
import { ThemeProvider, TranslationProvider, DialogProvider, RouterContextProvider } from '@harnessio/ui/context'
import { TooltipProvider } from '@harnessio/ui/components'
import { useNavigate, useLocation, Outlet, Route, Routes } from 'react-router-dom'
import { ComponentLibrary } from './components/ComponentLibrary'
import { BuilderCanvas } from './components/BuilderCanvas'
import { PropertiesPanel } from './components/PropertiesPanel'
import { BuilderContext, createBuilderStore } from './store'
import { REGISTRY } from './registry'

function RouterBridge({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate()
  const location = useLocation()
  return (
    <RouterContextProvider
      Link={({ to, children: c, ...rest }: any) => <a href={typeof to === 'string' ? to : '#'} onClick={e => e.preventDefault()} {...rest}>{c}</a>}
      NavLink={({ to, children: c, ...rest }: any) => <a href={typeof to === 'string' ? to : '#'} onClick={e => e.preventDefault()} {...rest}>{c}</a>}
      navigate={navigate}
      location={location as any}
      useSearchParams={() => [new URLSearchParams(), () => {}] as any}
      useMatches={() => [] as any}
      useParams={() => ({}) as any}
      Outlet={Outlet}
      Switch={Routes}
      Route={Route}
    >
      {children}
    </RouterContextProvider>
  )
}

function Builder() {
  const [state, dispatch] = createBuilderStore()

  return (
    <BuilderContext.Provider value={{ state, dispatch }}>
      <div className="app-root">
        {/* Header */}
        <header className="app-header">
          <div className="header-brand">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="url(#grad)" strokeWidth="2">
              <defs>
                <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#6366f1" />
                  <stop offset="100%" stopColor="#8b5cf6" />
                </linearGradient>
              </defs>
              <rect x="3" y="3" width="18" height="18" rx="3" />
              <line x1="3" y1="9" x2="21" y2="9" />
              <line x1="9" y1="21" x2="9" y2="9" />
            </svg>
            <span className="brand-name">Visual Builder</span>
            <span className="brand-badge">Harness Canary</span>
          </div>

          <div className="header-center">
            <div className="component-count-pill">
              <span className="count-dot" />
              {REGISTRY.length} components available
            </div>
          </div>

          <div className="header-right">
            <a
              href="https://github.com/harness/canary"
              target="_blank"
              rel="noopener noreferrer"
              className="header-link"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
              </svg>
              harness/canary
            </a>
          </div>
        </header>

        {/* Body */}
        <div className="app-body">
          <ComponentLibrary />
          <BuilderCanvas />
          <PropertiesPanel />
        </div>
      </div>
    </BuilderContext.Provider>
  )
}

const t = (key: string) => key

export default function App() {
  return (
    <MemoryRouter>
      <ThemeProvider theme="dark-std-std" setTheme={() => {}} isLightTheme={false}>
        <TranslationProvider t={t}>
          <TooltipProvider>
            <DialogProvider>
              <RouterBridge>
                <Builder />
              </RouterBridge>
            </DialogProvider>
          </TooltipProvider>
        </TranslationProvider>
      </ThemeProvider>
    </MemoryRouter>
  )
}
