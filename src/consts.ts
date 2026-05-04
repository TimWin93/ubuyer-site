export const SITE_NAME = 'UBuyer';
export const SITE_URL = import.meta.env.PUBLIC_SITE_URL ?? 'https://ubuyer.ru';
export const SITE_DESCRIPTION =
  'Управляем ростом карточки на Wildberries через контролируемый оборот и живую инфраструктуру.';

export const CONTACTS = {
  telegram: 'https://t.me/ubuyer',
  email: 'info@ubuyer.ru',
  phone: '+7 (999) 000-00-00',
  phoneTel: '+79990000000',
} as const;

export const STATS = {
  accounts: '3 000+',
  pvz: '3 000+',
  team: '100',
  years: '3+',
} as const;

export const MIN_ORDER = {
  perArticle: 50,
  total: 100,
} as const;

export const NAV_LINKS = [
  { href: '/kak-rabotaem', label: 'Как работаем' },
  { href: '/scenarii', label: 'Сценарии' },
  { href: '/tseny', label: 'Цены' },
  { href: '/faq', label: 'FAQ' },
  { href: '/blog', label: 'Блог' },
] as const;

export const SCENARIO_SLUGS = [
  'zapusk-novoy-kartochki',
  'rost-po-klyucham',
  'masshtabirovanie',
  'vosstanovlenie-posle-prosadki',
  'snizhenie-drr',
  'dobor-iu',
  'podgotovka-k-sezonu',
  'oborachivaemost',
  'vosstanovlenie-doveriya',
  'perehvat-trafika',
  'stabilizatsiya',
  'uderzhanie-pozitsii',
  'test-gipotez',
] as const;
