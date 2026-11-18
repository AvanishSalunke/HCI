import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Writes dist/version.json with the commit that was built (Render sets RENDER_GIT_COMMIT).
// The deploy check on GitHub reads it to know the new website is live.
const versionFile = () => ({
  name: 'version-file',
  generateBundle() {
    this.emitFile({
      type: 'asset',
      fileName: 'version.json',
      source: JSON.stringify({ commit: process.env.RENDER_GIT_COMMIT || 'unknown' }),
    })
  },
})

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), versionFile()],
})
