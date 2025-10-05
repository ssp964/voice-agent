/** @type {import('next').NextConfig} */
const BACKEND_ORIGIN = process.env.BACKEND_ORIGIN || "http://localhost:8000";
const N8N_ORIGIN = process.env.N8N_ORIGIN || "http://localhost:5678";

const nextConfig = {
    async rewrites() {
        return [
            { source: "/api/stt", destination: `${BACKEND_ORIGIN}/api/stt` },
            { source: "/api/tts", destination: `${BACKEND_ORIGIN}/api/tts` },
            { source: "/api/tts-text", destination: `${BACKEND_ORIGIN}/api/tts-text` },
            { source: "/api/n8n", destination: `${N8N_ORIGIN}/webhook/my-webhook` },
        ];
    },
};

export default nextConfig;


