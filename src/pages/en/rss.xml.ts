import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import { site } from '../../config';
import { ROUTES } from '../../i18n/routes';
import { getUi } from '../../i18n/content';

export async function GET() {
  const lang = 'en' as const;
  const ui = getUi(lang);
  const posts = (await getCollection('blog', ({ id, data }) => id.startsWith('en/') && !data.draft)).sort(
    (a, b) => b.data.date.valueOf() - a.data.date.valueOf()
  );

  return rss({
    title: site.name,
    description: ui.meta.postsDescription,
    site: site.url,
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.date,
      link: `${ROUTES.posts.en}/${post.id.slice(3)}`,
      categories: post.data.tags,
    })),
    customData: `<language>en</language>`,
  });
}
