import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import Admin from './Admin';
import { AURAS, ZONES, RECIPES, BOSSES } from './game/data';
import { liveConfig, setLiveConfig } from './game/liveConfig';
import './styles.css';
import './motion.css';
import './catalogue.css';

async function boot() {
  if (!location.pathname.startsWith('/admin')) {
    try {
      const response = await fetch('/api/config', { signal: AbortSignal.timeout(3000) });
      if (response.ok) {
        setLiveConfig(await response.json());
        const groups = { auras: AURAS, worlds: ZONES, recipes: RECIPES, bosses: BOSSES };
        for (const o of liveConfig.overrides) {
          const item = groups[o.category as keyof typeof groups]?.find(x => x.id === o.id);
          if (item) { item.name = o.name; item.description = o.description; }
        }
      }
    } catch { /* Static hosting and offline play use the bundled catalogue. */ }
  }
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>{location.pathname === '/admin' || location.pathname.startsWith('/admin/') ? <Admin /> : <App />}</React.StrictMode>,
  );
}
void boot();
