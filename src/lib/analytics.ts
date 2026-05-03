declare global {
  interface Window {
    ym?: (id: number, action: string, ...args: unknown[]) => void;
  }
}

const METRICA_ID = Number(import.meta.env.YANDEX_METRICA_ID);

export function reachGoal(goal: string, params?: Record<string, unknown>) {
  if (typeof window !== 'undefined' && window.ym && METRICA_ID) {
    window.ym(METRICA_ID, 'reachGoal', goal, params);
  }
}

export const GOALS = {
  LEAD_FORM_SUBMIT: 'lead_form_submit',
  TELEGRAM_CLICK: 'telegram_click',
  SCENARIO_VIEW: 'scenario_view',
  CALC_OPEN: 'calc_open',
} as const;
