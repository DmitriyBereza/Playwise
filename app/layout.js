import './globals.css';
import Providers from './providers';

export const metadata = {
  title: 'Playwise',
  description: 'Calm online kids games for ages 3+ focused on development and computer skills.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
