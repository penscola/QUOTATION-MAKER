import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { registerServiceWorker } from './swRegister';

// Register service worker for offline functionality and asset caching
registerServiceWorker();

createRoot(document.getElementById('root')!).render(<App />);

