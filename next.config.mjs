/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable React strict mode for better development experience
  reactStrictMode: true,
  
  // Configure MDX processing
  pageExtensions: ['js', 'jsx', 'mdx', 'ts', 'tsx'],
  
  // Configure webpack for MDX processing
  webpack: (config, { isServer }) => {
    // Add MDX handling
    config.module.rules.push({
      test: /\.mdx?$/,
      use: [
        {
          loader: '@mdx-js/loader',
          options: {
            remarkPlugins: [],
            rehypePlugins: [],
          },
        },
      ],
    })

    return config
  },
}

export default nextConfig
