const TEMPLATES_KEY = 'lincc-event-templates';

export interface EventTemplate {
  id: string;
  name: string;
  category_id: string;
  title: string;
  description: string;
  venue_name: string;
  venue_address: string;
  venue_lat: number;
  venue_lng: number;
  capacity: number;
  join_mode: string;
  audience: string;
  created_at: string;
}

export function getTemplates(): EventTemplate[] {
  try {
    return JSON.parse(localStorage.getItem(TEMPLATES_KEY) || '[]');
  } catch {
    return [];
  }
}

export function saveTemplate(template: Omit<EventTemplate, 'id' | 'created_at'>): EventTemplate {
  const templates = getTemplates();
  const newTemplate: EventTemplate = {
    ...template,
    id: crypto.randomUUID(),
    created_at: new Date().toISOString(),
  };
  templates.unshift(newTemplate);
  // Keep max 10 templates
  localStorage.setItem(TEMPLATES_KEY, JSON.stringify(templates.slice(0, 10)));
  return newTemplate;
}

export function deleteTemplate(id: string) {
  const templates = getTemplates().filter((t) => t.id !== id);
  localStorage.setItem(TEMPLATES_KEY, JSON.stringify(templates));
}
