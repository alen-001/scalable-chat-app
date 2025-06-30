import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { SocketContextProvider } from './context/SocketProvider.tsx'

createRoot(document.getElementById('root')!).render(
    <SocketContextProvider>
    <App />
    </SocketContextProvider>
)
