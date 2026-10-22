import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
// Interface: Geist / Geist Mono. Wordmark: Space Grotesk 600 (regra do brand design, A1).
import '@fontsource/geist-sans/latin-400.css';
import '@fontsource/geist-sans/latin-500.css';
import '@fontsource/geist-sans/latin-600.css';
import '@fontsource/geist-mono/latin-400.css';
import '@fontsource/geist-mono/latin-500.css';
import '@fontsource/space-grotesk/latin-600.css';
import './styles/index.css';
import App from './App';
import { I18nProvider } from './i18n';
import { AuthProvider } from './services/authService';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <I18nProvider>
      <AuthProvider>
        <App />
      </AuthProvider>
    </I18nProvider>
  </StrictMode>,
);
