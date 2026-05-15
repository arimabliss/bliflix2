// import type { FooterItem, MainNavItem } from "@/types"
//
// import { productCategories } from "@/config/products"
// import { slugify } from "@/lib/utils"

import { Icons } from '@/components/icons';
import { env } from '@/env.mjs';

export type SiteConfig = typeof siteConfig;

export const siteConfig = {
  name: 'KoWatch',
  author: 'Erox',
  slogan: 'Sharp streaming for movies, shows, and anime.',
  description:
    'KoWatch is a sleek streaming front-end for discovering movies, shows, anime, and watch-together sessions.',
  keywords: [
    'watch movies',
    'movies online',
    'watch TV',
    'TV online',
    'TV shows online',
    'watch TV shows',
    'stream movies',
    'stream tv',
    'instant streaming',
    'watch online',
    'movies',
    'watch TV online',
    'no download',
    'full length movies',
    'KoWatch',
  ],
  url: env.NEXT_PUBLIC_APP_URL,
  ogImage: `${env.NEXT_PUBLIC_APP_URL}/images/hero.jpg`,
  links: {
    twitter: `${env.NEXT_PUBLIC_TWITTER}`,
    github: env.NEXT_PUBLIC_APP_URL,
    githubAccount: '',
  },
  socialLinks: [
    {
      title: 'Facebook',
      href: `${env.NEXT_PUBLIC_FACEBOOK}`,
      icon: Icons.facebook,
    },
    {
      title: 'Instagram',
      href: `${env.NEXT_PUBLIC_INSTAGRAM}`,
      icon: Icons.instagram,
    },
    {
      title: 'Twitter',
      href: `${env.NEXT_PUBLIC_TWITTER}`,
      icon: Icons.twitter,
    },
    {
      title: 'Youtube',
      href: `${env.NEXT_PUBLIC_YOUTUBE}`,
      icon: Icons.youtube,
    },
  ],
  footerItems: [
    { title: 'Home', href: '/home' },
    { title: 'TV Shows', href: '/tv-shows' },
    { title: 'Movies', href: '/movies' },
    { title: 'Anime', href: '/anime' },
    { title: 'Watch Together', href: '/home' },
    { title: 'Made By Erox', href: env.NEXT_PUBLIC_APP_URL },
    { title: 'Terms of Use', href: '/terms-of-use' },
    { title: 'Privacy', href: '/' },
    { title: 'Legal Notices', href: '/' },
    { title: 'Cookie Preferences', href: '/' },
    { title: 'Contact Us', href: 'mailto:gfxethion@gmail.com' },
  ],
  mainNav: [
    {
      title: 'Home',
      href: '/home',
      // icon: Icons.play,
    },
    {
      title: 'TV Shows',
      href: '/tv-shows',
      // icon: Icons.tvShow,
    },
    {
      title: 'Movies',
      href: '/movies',
      // icon: Icons.movie,
    },
    {
      title: 'Anime',
      href: '/anime',
      // icon: Icons.list,
    },
    {
      title: 'New & Popular',
      href: '/new-and-popular',
      // icon: Icons.trendingUp,
    },
  ],
};
