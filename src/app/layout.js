export const metadata = {
  title: 'Spacebar Explorer',
  description: 'Explore Spacebar-compatible clients, instances, and guilds. Browse, review, and discover the best options for your needs.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
