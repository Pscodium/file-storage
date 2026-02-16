/* eslint-disable @typescript-eslint/no-unused-vars */
import { useAuth } from '@renderer/contexts/auth';
import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export const initSocket = (_userId: string) => {
    if (!socket) {
        socket = io(import.meta.env.VITE_BACKEND_ENDPOINT, {
            withCredentials: true,
        });

        socket.on('connect', () => {
            console.log('Socket connected:', socket?.id);
        });

        socket.on('disconnect', () => {
            console.log('Socket disconnected');
        });

        socket.on('connect_error', (error) => {
            console.error('Socket connection error:', error);
        });
    }

    return socket;
};

export const getSocket = () => {
    return socket;
};

export const closeSocket = () => {
    if (socket) {
        socket.disconnect();
        socket = null;
    }
};

export const useSocket = () => {
    const { user } = useAuth();

    const getOrInitSocket = () => {
        if (!user?.userId) return null;
        return socket || initSocket(user.userId.toString());
    };

    return {
        socket: getOrInitSocket(),
        initSocket: () => user?.userId && initSocket(user.userId.toString()),
        closeSocket,
    };
};
