export type PriceLevel = '$' | '$$' | '$$$';
export type Difficulty = 'easy' | 'medium' | 'hard';
export type TimeIntensity = 'quick' | 'medium' | 'long';
export type DishType = 'main' | 'side' | 'dessert';
export type MeatType = 'beef' | 'chicken' | 'pork' | 'seafood' | 'vegetarian' | 'none';
export type Genre = 'international' | 'produce' | 'deli' | 'bakery' | 'pantry' | 'baking' | 'spices' | 'butchery' | 'frozen' | 'dairy' | 'snacks' | 'beverages';
export type ExtraType = 'dessert' | 'snack' | 'breakfast' | 'beverages';

export interface Ingredient {
  name: string;
  unit: 'g' | 'kg' | 'oz' | 'lb' | 'ml' | 'l' | 'cup' | 'tbsp' | 'tsp' | 'unit' | 'clove';
  amount: number;
  genre: Genre;
}

export interface Meal {
  id: string;
  name: string;
  description: string;
  ingredients: Ingredient[];
  timeMinutes: number;
  multitaskable: boolean;
  cuisine: string;
  meatType: MeatType;
  priceLevel: PriceLevel;
  difficulty: Difficulty;
  timeIntensity: TimeIntensity;
  dishType: DishType;
  recommendedSideMealIds?: string[];
  recommendedSideExtraIngredients?: Ingredient[]; // ingredient-only sides
  extraType?: ExtraType; // for Extras & Baking page categorization
}

export interface PantryItem {
  name: string;
  unit: Ingredient['unit'];
}

export interface HouseholdItem {
  id: string;
  name: string;
  category: 'snacks' | 'beverages' | 'pantry' | 'butchery' | 'dairy' | 'frozen' | 'spices' | 'baking' | 'household' | 'hygiene' | 'pet' | 'baby' | 'other';
}

export interface DayPlan {
  mainMealId?: string;
  sideMealIds: string[];
  sideExtraIngredients: Ingredient[]; // ingredient-only sides for the day
}

export interface SelectionState {
  numDays: number;
  days: DayPlan[];
  dessertMealIds: string[];
}

export type Mode = 'meal' | 'restock' | 'useup-meal';

export interface PantryCheckItem {
  ingredient: Ingredient;
  haveEnough: boolean | null;
}

export interface AppStateShape {
  mode: Mode;
  step: number; // 0..5
  selection: SelectionState;
  pantryCheck: PantryCheckItem[]; // combined meals + desserts
  restockSelectedIds: string[]; // household items
}


