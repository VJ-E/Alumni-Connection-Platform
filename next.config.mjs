/** @type {import('next').NextConfig} */
const nextConfig = {
    images:{
        remotePatterns:[
            {
                protocol:'https',
                hostname:'res.cloudinary.com'
            },
            {
                protocol: 'https',
                hostname: 'img.clerk.com'
            },
            {
                protocol: 'https',
                hostname: 'images.clerk.dev'
            }
        ]
    },
    experimental:{
        serverActions: {
            bodySizeLimit: '20mb' // Set desired value here
        }
    }
};

export default nextConfig;
