/*
 * @file Theme configuration
 */
import { defineConfig } from './src/helpers/config-helper';

export default defineConfig({
  lang: 'en-US',
  site: 'https://caodchuong312.github.io',
  avatar: '/avatar.jpg',
  title: 'chuongcd\'s blog',
  description: 'Learning Security, writing about life.',
  lastModified: true,
  readTime: true,
  footer: {
    copyright: '© 2025 chuongcd',
  },
  socialLinks: [
    {
      icon: 'github',
      link: 'https://github.com/caodchuong312/caodchuong312.github.io'
    },
]
});