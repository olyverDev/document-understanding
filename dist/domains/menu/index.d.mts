import { D as DocumentUnderstandingService } from '../../service-B8KzHMnR.mjs';
export { V as ProcessPrescriptionInput } from '../../service-B8KzHMnR.mjs';

type MenuItemCategory = 'appetizer' | 'main_course' | 'side_dish' | 'dessert' | 'beverage' | 'alcohol' | 'soup' | 'salad' | 'bread' | 'combo' | 'other';
interface MenuItem {
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
type MenuItemsList = MenuItem[];

var $schema = "http://json-schema.org/draft-07/schema#";
var title = "MenuItemsList";
var description = "Structured list of categorized text-only restaurant menu items.";
var type = "array";
var items = {
	title: "MenuItem",
	type: "object",
	properties: {
		name: {
			type: "string",
			description: "Name of the dish or item, exactly as found in the text menu (capitalization preserved)."
		},
		category: {
			type: "string",
			description: "High-level category this item belongs to.",
			"enum": [
				"appetizer",
				"main_course",
				"side_dish",
				"dessert",
				"beverage",
				"alcohol",
				"soup",
				"salad",
				"bread",
				"combo",
				"other"
			]
		},
		description: {
			type: "string",
			description: "Optional description or list of ingredients if present near the item. Otherwise, leave as empty string.",
			"default": ""
		},
		price: {
			type: "string",
			description: "Optional price, as text (e.g. '12$', '₽350', 'от 15 руб.', '€9.50'). Leave as empty string if not found.",
			"default": ""
		},
		language: {
			type: "string",
			description: "Detected language of the item name (e.g. 'en', 'ru', 'fr')."
		}
	},
	required: [
		"name",
		"category",
		"language"
	],
	additionalProperties: false
};
var schema = {
	$schema: $schema,
	title: title,
	description: description,
	type: type,
	items: items
};

type MenuUnderstandingContext = {
    prompt: string;
    outputSchema: typeof schema;
};
interface MistralOptions {
    apiKey: string;
    timeoutMs?: number;
    models?: {
        ocr?: string;
        llm?: string;
    };
}
type MistralResult = {
    isInitialized: true;
    service: DocumentUnderstandingService<MenuItemsList, MenuUnderstandingContext>;
} | {
    isInitialized: false | undefined;
    error?: Error;
};
/**
 * @docs Menu Understanding – Mistral Visual Understanding
 *
 * This implementation uses the Mistral OCR and Completion APIs to perform
 * two-step **Image-To-Text** + **Text-To-Structured JSON** transformation,
 * extracting structured menu items from scanned or photographed menus.
 *
 * It uses a domain-specific `prompt` and corresponding JSON `schema`.
 *
 * Adapters are wired into a `DocumentUnderstandingService` instance.
 */
declare function MistralMenuUnderstandingFactory(options: MistralOptions): MistralResult;

export { type MenuItem, type MenuItemsList, MistralMenuUnderstandingFactory, type MistralOptions as MistralMenuUnderstandingOptions, type MistralResult as MistralMenuUnderstandingResult };
