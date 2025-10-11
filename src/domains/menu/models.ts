export type MenuItemCategory =
  | 'appetizer'
  | 'main_course'
  | 'side_dish'
  | 'dessert'
  | 'beverage'
  | 'alcohol'
  | 'soup'
  | 'salad'
  | 'bread'
  | 'combo'
  | 'other';

export interface MenuItem {
  /**
   * Name of the dish or item, exactly as found in the text menu (capitalization preserved).
   */
  name: string;

  /**
   * High-level category this item belongs to.
   */
  category: MenuItemCategory;

  /**
   * Optional description or list of ingredients if present near the item. Otherwise, leave as empty string.
   */
  description?: string;

  /**
   * Optional price, as text (e.g. '12$', '₽350', 'от 15 руб.', '€9.50'). Leave as empty string if not found.
   */
  price?: string;

  /**
   * Detected language of the item name (e.g. 'en', 'ru', 'fr').
   */
  language: string;
}

/**
 * Structured list of categorized text-only restaurant menu items.
 */
export type MenuItemsList = MenuItem[];
