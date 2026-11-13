import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
// Isolated QA server: no Worker routing or production entry-point changes.
export default defineConfig({ plugins: [react(), tailwindcss()], server: { host: '127.0.0.1' } });
