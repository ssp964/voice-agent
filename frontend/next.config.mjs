/** @type {import('next').NextConfig} */
const nextConfig = {
    async rewrites() {
        return [
            { source: "/api/stt", destination: "http://localhost:8000/api/stt" },
            { source: "/api/tts", destination: "http://localhost:8000/api/tts" },
            { source: "/api/tts-text", destination: "http://localhost:8000/api/tts-text" },
            // Route frontend requests to n8n PRODUCTION webhook
            { source: "/api/n8n", destination: "http://localhost:5678/webhook/my-webhook" },
        ];
    },
};

export default nextConfig;


