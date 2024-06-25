/** @type {import('next').NextConfig} */
const nextConfig = {
	images: {
		remotePatterns: [
			{ 
				protocol: 'https',
				hostname: 'good-anteater-372.convex.cloud',
				port: '',
				pathname: '/api/storage/**',
			}
		],
	},
};

export default nextConfig;
