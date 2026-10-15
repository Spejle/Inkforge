import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// The page loads nothing but its own files, Google Fonts and embedded images. Built pages only: the dev server needs
// inline scripts for hot reload.
const CSP = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com", // React style attributes
  "font-src https://fonts.gstatic.com",
  "img-src 'self' data: blob:",
  "connect-src 'self' data: blob:",
  "worker-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'none'",
  "form-action 'none'"
].join('; ')

const csp = () => ({
  name: 'inkforge-csp',
  apply: 'build',
  transformIndexHtml: () => [{ tag: 'meta', attrs: { 'http-equiv': 'Content-Security-Policy', content: CSP }, injectTo: 'head-prepend' }]
})

// https://vite.dev/config/
export default defineConfig({
  base: './',
  plugins: [react(), csp()],
})
