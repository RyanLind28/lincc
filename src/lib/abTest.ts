const AB_KEY = 'lincc-ab-variants';

interface ABVariants {
  [experiment: string]: string;
}

function getVariants(): ABVariants {
  try {
    return JSON.parse(localStorage.getItem(AB_KEY) || '{}');
  } catch {
    return {};
  }
}

export function getVariant(experiment: string, options: string[]): string {
  const variants = getVariants();
  if (variants[experiment]) return variants[experiment];

  // Assign a random variant and persist
  const variant = options[Math.floor(Math.random() * options.length)];
  variants[experiment] = variant;
  localStorage.setItem(AB_KEY, JSON.stringify(variants));
  return variant;
}

export function getAllVariants(): ABVariants {
  return getVariants();
}
