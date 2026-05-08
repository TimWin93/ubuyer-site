declare global {
  interface Window {
    ym?: (id: number, action: string, ...args: unknown[]) => void;
    __ymId?: number;
  }
}

const METRICA_ID = Number(import.meta.env.YANDEX_METRICA_ID);

export function reachGoal(goal: string, params?: Record<string, unknown>) {
  if (typeof window !== 'undefined' && window.ym && METRICA_ID) {
    window.ym(METRICA_ID, 'reachGoal', goal, params);
  }
}

export const GOALS = {
  LEAD_FORM_SUBMIT:   'lead_form_submit',
  TELEGRAM_CLICK:     'telegram_click',
  SCENARIO_VIEW:      'scenario_view',
  CALC_OPEN:          'calc_open',
  QUIZ_STEP2:         'quiz_step2',
  QUIZ_COMPLETE:      'quiz_complete',
  CASES_CTA:          'cases_cta_click',
  PRICING_CTA:        'pricing_cta_click',
  STICKY_TELEGRAM:    'sticky_telegram',
} as const;
