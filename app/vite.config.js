import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Base path: when building in GitHub Actions we set VITE_BASE to
// "/<repo>/" so asset URLs resolve under the project Pages subpath.
// Locally (npm run dev / preview) the default "/" is used.
const base = process.env.VITE_BASE || '/'

export default defineConfig({
  base,
  plugins: [react()],
})
