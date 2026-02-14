import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';
import { BrowserRouter } from 'react-router-dom';
import { BLEProvider } from './context/BLEContext.tsx';

createRoot(document.getElementById('root')!).render(
  <BLEProvider>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </BLEProvider>
);
