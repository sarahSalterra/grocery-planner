import { Ingredient, Meal, PantryCheckItem } from '@types';

export function aggregateIngredients(meals: Meal[]): Ingredient[] {
  const map = new Map<string, Ingredient>();
  for (const meal of meals) {
    for (const ing of meal.ingredients) {
      const key = `${ing.name}__${ing.unit}`.toLowerCase();
      const existing = map.get(key);
      if (existing) {
        map.set(key, { ...existing, amount: existing.amount + ing.amount });
      } else {
        map.set(key, { ...ing });
      }
    }
  }
  return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
}

export function toPantryCheckItems(ingredients: Ingredient[]): PantryCheckItem[] {
  // Default unchecked (haveEnough=false) for checklist UX
  return ingredients.map((ingredient) => ({ ingredient, haveEnough: false }));
}

export function aggregateIngredientArray(ingredients: Ingredient[]): Ingredient[] {
  const map = new Map<string, Ingredient>();
  for (const ing of ingredients) {
    const key = `${ing.name}__${ing.unit}`.toLowerCase();
    const existing = map.get(key);
    if (existing) {
      map.set(key, { ...existing, amount: existing.amount + ing.amount });
    } else {
      map.set(key, { ...ing });
    }
  }
  return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
}


