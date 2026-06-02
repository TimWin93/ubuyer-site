import { SITE_NAME, SITE_URL, SITE_DESCRIPTION } from '@/consts';

interface SeoProps {
  title?: string;
  description?: string;
  ogImage?: string;
  noindex?: boolean;
  path?: string;
}

function normalizePath(path: string): string {
  if (!path) return '/';
  if (path.includes('#') || path.includes('?')) return path;
  return path.endsWith('/') ? path : `${path}/`;
}

export function buildSeo(props: SeoProps = {}) {
  const { title, description, ogImage, noindex = false, path = '' } = props;

  const fullTitle = title ? `${title} | ${SITE_NAME}` : SITE_NAME;
  const fullDescription = description ?? SITE_DESCRIPTION;
  const canonical = `${SITE_URL}${normalizePath(path)}`;
  const image = ogImage ?? `${SITE_URL}/images/og/default.jpg`;

  return { title: fullTitle, description: fullDescription, canonical, image, noindex };
}
