import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import fs from 'fs'

// Read URLPATH from root .env file
function getRootEnvUrlPath(): string {
    const envFileName = '.env'

    const possiblePaths = [
        path.resolve(process.cwd(), envFileName),
        path.resolve(__dirname, '../../.env'),
        path.resolve(__dirname, '../.env'),
        path.resolve(__dirname, envFileName),
    ]

    for (const p of possiblePaths) {
        try {
            if (fs.existsSync(p)) {
                const envContent = fs.readFileSync(p, 'utf-8')

                const match = envContent.match(/^URLPATH\s*=\s*(.+)$/m)
                if (match) {
                    return match[1].trim().replace(/^["']|["']$/g, '')
                }
            }
        } catch (err) {
        }
    }

    return 'dashboard'
}

const urlPath = getRootEnvUrlPath()

export default defineConfig({
    plugins: [react()],
    base: `/${urlPath}/`,
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
    server: {
        port: 5173,
        open: true,
    },
    define: {
        'import.meta.env.VITE_URL_PREFIX': JSON.stringify(urlPath),
    },
})
