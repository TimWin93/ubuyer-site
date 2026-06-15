export const SITE_NAME = 'UBuyer';
export const SITE_URL = import.meta.env.PUBLIC_SITE_URL ?? 'https://u-buyer.ru';
export const SITE_DESCRIPTION =
  'Управляем ростом карточки на Wildberries через контролируемый оборот и живую инфраструктуру.';

export const CONTACTS = {
  telegram: 'https://t.me/Manager_UBuyer?text=%D0%9F%D1%80%D0%B8%D0%B2%D0%B5%D1%82%2C%20%D0%BF%D0%B8%D1%88%D1%83%20%D1%81%20%D1%81%D0%B0%D0%B9%D1%82%D0%B0%20u-buyer.ru',
  channel: 'https://t.me/+zTWXRN30e6UzYWZi',
  email: 'info@ubuyer.ru',
  phone: '+7 (978) 567-27-45',
  phoneTel: '+79785672745',
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
  { href: '/#kak-rabotaem', label: 'Как работаем' },
  { href: '/tseny/', label: 'Цены' },
  { href: '/polki/', label: 'Полки' },
  { href: '/kejsy/', label: 'Кейсы' },
  { href: '/#faq', label: 'FAQ' },
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
