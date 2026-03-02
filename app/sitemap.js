import { gamesCatalog } from '../games/catalog';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://playwise.vercel.app';

export default function sitemap() {
  const gamePages = gamesCatalog.map((game) => ({
    url: `${siteUrl}${game.path}`,
    lastModified: new Date(),
    changeFrequency: 'monthly',
    priority: 0.8,
  }));

  return [
    {
      url: siteUrl,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
    },
    ...gamePages,
  ];
}
