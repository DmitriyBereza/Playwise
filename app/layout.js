import './globals.css';

export const metadata = {
  title: 'Playwise',
  description: 'Calm online kids games for ages 3+ focused on development and computer skills.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
