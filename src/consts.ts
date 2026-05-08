export const SITE_NAME = 'UBuyer';
export const SITE_URL = import.meta.env.PUBLIC_SITE_URL ?? 'https://u-buyer.ru';
export const SITE_DESCRIPTION =
  'Управляем ростом карточки на Wildberries через контролируемый оборот и живую инфраструктуру.';

export const CONTACTS = {
  telegram: 'https://t.me/Manager_UBuyer',
  channel: 'https://t.me/YourBuyer_WB',
  email: 'info@ubuyer.ru',
  phone: '+7 (978) 567-27-45',
  phoneTel: '+79785672745',
} as const;

export const STATS = {
  accounts: '3 000+',
  pvz: '2 600+',
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
