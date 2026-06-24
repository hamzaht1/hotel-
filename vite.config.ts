import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import laravel from 'laravel-vite-plugin';
import { resolve } from 'node:path';
import { defineConfig } from 'vite';

export default defineConfig(({ command, mode }) => {
    const isSSR = command === 'build' && process.argv.includes('--ssr');
    
    return {
    server: {
        watch: {
            ignored: ['**/vuexy-admin-v10.11.1/**'],
        },
    },
    plugins: [
        laravel({
            // app.css is imported by app.tsx, so it must NOT also be a standalone
            // entry — that made Vite build it as a separate chunk whose CSS got
            // <link rel="preload">'d but never used as a stylesheet (browser
            // "preloaded but not used" warning). Let app.tsx pull it in.
            input: ['resources/js/app.tsx'],
                ssr: isSSR ? 'resources/js/ssr.tsx' : undefined,
            refresh: true,
        }),
        react(),
        tailwindcss(),
    ],
    esbuild: {
        jsx: 'automatic',
    },
    resolve: {
        alias: {
            'ziggy-js': resolve(__dirname, 'vendor/tightenco/ziggy'),
        },
    },
    };
});
