export const metadata = {
  title: 'Naka Beauty Group — Dashboard',
  description: 'Management Dashboard',
}

export default function RootLayout({ children }) {
  return (
    <html lang="th">
      <body style={{ margin: 0, padding: 0, fontFamily: "'Sarabun', 'Noto Sans Thai', sans-serif" }}>
        <link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@400;600;700;800&display=swap" rel="stylesheet" />
        {children}
      </body>
    </html>
  )
}
