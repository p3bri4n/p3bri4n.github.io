export interface ParsedTag {
  category: string;
  value: string;
  featured: boolean;
}

// Un tag "Catégorie:Valeur" (ex: "Langages:Python") permet de dériver la liste
// des compétences depuis le parcours et les projets, sans devoir la maintenir à part.
// Un "!" en fin de valeur (ex: "Langages:Python!") la marque comme mise en avant.
export function parseTag(tag: string): ParsedTag {
  const separatorIndex = tag.indexOf(':');
  const category = separatorIndex === -1 ? '' : tag.slice(0, separatorIndex).trim();
  const rawValue = separatorIndex === -1 ? tag : tag.slice(separatorIndex + 1).trim();
  const featured = rawValue.endsWith('!');
  const value = featured ? rawValue.slice(0, -1).trim() : rawValue;
  return { category, value, featured };
}

export function tagValue(tag: string): string {
  return parseTag(tag).value;
}

export interface SkillItem {
  value: string;
  featured: boolean;
}

export interface SkillGroupData {
  categorie: string;
  items: SkillItem[];
}

interface HasCompetences {
  competences?: string[];
}

interface HasTags {
  tags: string[];
}

export function computeSkills(
  parcours: HasCompetences[],
  projects: HasTags[],
  categoryOrder: string[]
): SkillGroupData[] {
  const grouped = new Map<string, Map<string, boolean>>();

  const addAll = (tags: string[] | undefined) => {
    for (const tag of tags ?? []) {
      const { category, value, featured } = parseTag(tag);
      const key = category || categoryOrder[categoryOrder.length - 1];
      if (!grouped.has(key)) grouped.set(key, new Map());
      const values = grouped.get(key)!;
      values.set(value, (values.get(value) ?? false) || featured);
    }
  };

  for (const entry of parcours) addAll(entry.competences);
  for (const project of projects) addAll(project.tags);

  const orderIndex = (category: string) => {
    const index = categoryOrder.indexOf(category);
    return index === -1 ? categoryOrder.length : index;
  };

  return [...grouped.entries()]
    .sort((a, b) => orderIndex(a[0]) - orderIndex(b[0]) || a[0].localeCompare(b[0]))
    .map(([categorie, values]) => ({
      categorie,
      items: [...values.entries()]
        .sort((a, b) => Number(b[1]) - Number(a[1]) || a[0].localeCompare(b[0]))
        .map(([value, featured]) => ({ value, featured })),
    }));
}

// Retire certaines valeurs de la grille de compétences pour un contexte donné (ex: le CV,
// plus sélectif que la grille complète du site) sans toucher aux données sources ni au
// site. Les groupes qui deviennent vides sont retirés.
export function excludeSkills(groups: SkillGroupData[], excludedValues: string[]): SkillGroupData[] {
  const excluded = new Set(excludedValues);
  return groups
    .map((group) => ({
      categorie: group.categorie,
      items: group.items.filter((item) => !excluded.has(item.value)),
    }))
    .filter((group) => group.items.length > 0);
}

// Même convention "!" pour marquer un projet comme mis en avant, ex: nom: "Chocolatine!".
export function parseFeaturedName(name: string): { value: string; featured: boolean } {
  const featured = name.endsWith('!');
  return { value: featured ? name.slice(0, -1).trim() : name, featured };
}

// Compte les entrées du parcours portant un tag dont la valeur (catégorie et "!"
// ignorés) correspond à skillValue, ex: countEntriesWithSkill(parcours, "Freelancing").
export function countEntriesWithSkill(parcours: HasCompetences[], skillValue: string): number {
  const target = skillValue.toLowerCase();
  return parcours.filter((entry) =>
    (entry.competences ?? []).some((tag) => parseTag(tag).value.toLowerCase() === target)
  ).length;
}

export interface StatDef {
  kind?: string;
  valeur?: string;
  label: string;
}

interface HasStatsProfile {
  parcours: HasCompetences[];
  stats: StatDef[];
  experienceDepuis: number;
}

// Calcule les stats KPI (années d'expérience, missions freelance) à partir du
// parcours ; les stats sans "kind" gardent leur valeur statique telle quelle.
export function computeStats(
  profile: HasStatsProfile,
  yearsSuffix: string
): { valeur: string; label: string }[] {
  const currentYear = new Date().getFullYear();
  const freelanceMissions = countEntriesWithSkill(profile.parcours, 'Freelancing');
  return profile.stats.map((stat) => {
    if (stat.kind === 'experience') {
      return { valeur: `${currentYear - profile.experienceDepuis} ${yearsSuffix}`, label: stat.label };
    }
    if (stat.kind === 'freelance') {
      return { valeur: String(freelanceMissions), label: stat.label };
    }
    return { valeur: stat.valeur!, label: stat.label };
  });
}

// Liste plate et dédupliquée des valeurs de tags marquées "!" (parcours + projets),
// pour un aperçu rapide sur l'accueil, sans regroupement par catégorie.
export function getFeaturedTags(parcours: HasCompetences[], projects: HasTags[]): string[] {
  const featured = new Set<string>();
  const addAll = (tags: string[] | undefined) => {
    for (const tag of tags ?? []) {
      const { value, featured: isFeatured } = parseTag(tag);
      if (isFeatured) featured.add(value);
    }
  };
  for (const entry of parcours) addAll(entry.competences);
  for (const project of projects) addAll(project.tags);
  return [...featured].sort((a, b) => a.localeCompare(b));
}
