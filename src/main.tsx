import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import App from './App';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import './index.css';

// Set default font size immediately
// Full initialization will be done in ThemeProvider
try {
  const savedFontSize = localStorage.getItem('app_font_size') || 'md';
  document.documentElement.setAttribute('data-font-size', savedFontSize);
} catch (e) {
  document.documentElement.setAttribute('data-font-size', 'md');
}

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
    <React.StrictMode>
        <ThemeProvider>
            <HashRouter>
                <AuthProvider>
                    <App />
                </AuthProvider>
            </HashRouter>
        </ThemeProvider>
    </React.StrictMode>
);
