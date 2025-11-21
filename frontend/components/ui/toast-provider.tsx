"use client";

import { Toaster } from 'react-hot-toast';

export function ToastProvider() {
    return (
        <Toaster
            position="top-right"
            toastOptions={{
                duration: 4000,
                style: {
                    background: 'hsl(var(--card))',
                    color: 'hsl(var(--foreground))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '0.5rem',
                    padding: '1rem',
                },
                success: {
                    iconTheme: {
                        primary: '#10b981',
                        secondary: '#fff',
                    },
                    style: {
                        background: 'hsl(var(--card))',
                        border: '1px solid rgb(16, 185, 129, 0.3)',
                    },
                },
                error: {
                    iconTheme: {
                        primary: '#ef4444',
                        secondary: '#fff',
                    },
                    style: {
                        background: 'hsl(var(--card))',
                        border: '1px solid rgb(239, 68, 68, 0.3)',
                    },
                },
            }}
        />
    );
}
