/** @type {import('next').NextConfig} */
const nextConfig = {
	images: {
		remotePatterns: [
			{ 
				protocol: 'https',
				pathname: '/api/storage/**',
				hostname: "good-anteater-372.convex.cloud" 
			}
		],
	},
};

export default nextConfig;
