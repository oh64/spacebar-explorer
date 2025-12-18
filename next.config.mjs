/** @type {import('next').NextConfig} */
import { execSync } from 'child_process';

let shortHash = '';
try {
	const out = execSync('git rev-parse HEAD', { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
	if (out) shortHash = out.slice(0, 7);
} catch (e) {
	shortHash = '';
}

const nextConfig = {
	env: {
		NEXT_PUBLIC_GIT_HASH: shortHash
	}
};

export default nextConfig;
