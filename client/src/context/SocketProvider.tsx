import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

interface SocketContextType {
    socket: WebSocket | undefined;
    sendMessage: (message: string | object) => void;
    isConnected: boolean;
}

interface SocketContextProviderProps {
    children?: ReactNode;
}

const SocketContext = createContext<SocketContextType | null>(null);

export const SocketContextProvider: React.FC<SocketContextProviderProps> = ({ children }) => {
    const [socket, setSocket] = useState<WebSocket | undefined>();
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        const ws = new WebSocket('ws://localhost:8080');
        
        ws.onopen = () => {
            setIsConnected(true);
            console.log('Connected to WebSocket server');
        };
        
        ws.onclose = () => {
            setIsConnected(false);
            console.log('Disconnected from WebSocket server');
        };
        
        ws.onerror = (error) => {
            setIsConnected(false);
            console.error('WebSocket error:', error);
        };
        
        setSocket(ws);

        return () => {
            ws.close();
        };
    }, []);

    const sendMessage = (message: string | object) => {
        if (!socket || !isConnected) return;
        
        const messageToSend = typeof message === 'string' ? message : JSON.stringify(message);
        socket.send(messageToSend);
    };

    const value: SocketContextType = {
        socket,
        sendMessage,
        isConnected
    };

    return (
        <SocketContext.Provider value={value}>
            {children}
        </SocketContext.Provider>
    );
};

export const useSocket = () => {
    const context = useContext(SocketContext);
    if (!context) {
        throw new Error('useSocket must be used inside a SocketContextProvider');
    }
    return context;
};