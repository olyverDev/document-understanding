/**
 * Integration test for Gemini Visual Structuring
 * 
 * This test requires GEMINI_API_KEY environment variable to be set.
 * Run with: GEMINI_API_KEY=your_key yarn test tests/integration/gemini-visual-structuring.test.ts
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';

import * as dotenv from 'dotenv';

import menuPrompt from '../../src/domains/menu/prompt';
import { GeminiVisualStructuringFactory } from '../../src/infrastructure/adapters/visual-structuring/gemini';
import { getGeminiSingletonClient } from '../../src/infrastructure/api/gemini-client';
import type { VisualDocument } from '../../src/typings/visual-document';

// Load .env.test for integration tests
const envPath = resolve(__dirname, '../../.env.test');
dotenv.config({ path: envPath });

// Load menu schema
const menuSchema = JSON.parse(
  readFileSync(resolve(__dirname, '../../src/domains/menu/schema.json'), 'utf-8')
);

describe('Gemini Visual Structuring Integration', () => {
  const apiKey = process.env.GEMINI_API_KEY;

  // Debug: Log if API key is loaded
  if (!apiKey) {
    console.warn('⚠️  GEMINI_API_KEY not found in environment. Tests will be skipped.');
    console.warn(`   Looking for .env.test at: ${envPath}`);
  } else {
    console.log(`✅ API Key loaded: ${apiKey.substring(0, 10)}...`);
  }

  // Skip tests if no API key is provided
  const testIf = apiKey ? it : it.skip;

  testIf('should successfully parse a simple text image', async () => {
    const client = getGeminiSingletonClient({ apiKey: apiKey! });
    const visualStructuring = GeminiVisualStructuringFactory<{ text: string }>({ client });

    // Simple base64 encoded 1x1 red pixel PNG (placeholder for real image)
    const testImage: VisualDocument = {
      source: 'base64',
      documentType: 'image',
      file: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==',
    };

    const schema = {
      type: 'object',
      properties: {
        text: {
          type: 'string',
          description: 'Any text found in the image',
        },
      },
      required: ['text'],
    };

    const result = await visualStructuring.parse(testImage, {
      prompt: 'Describe what you see in this image. Extract any text if present.',
      outputSchema: schema,
    });

    console.log('✅ Test result:', result);
    expect(result).toHaveProperty('text');
    expect(typeof result.text).toBe('string');
  }, 30000); // 30 second timeout for API call

  testIf('should handle structured output with multiple fields', async () => {
    const client = getGeminiSingletonClient({ apiKey: apiKey! });
    const visualStructuring = GeminiVisualStructuringFactory<{
      color: string;
      description: string;
    }>({ client });

    const testImage: VisualDocument = {
      source: 'base64',
      documentType: 'image',
      file: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==',
    };

    const schema = {
      type: 'object',
      properties: {
        color: {
          type: 'string',
          description: 'The dominant color in the image',
        },
        description: {
          type: 'string',
          description: 'A brief description of the image',
        },
      },
      required: ['color', 'description'],
    };

    const result = await visualStructuring.parse(testImage, {
      prompt: 'Analyze this image and provide the dominant color and a description.',
      outputSchema: schema,
    });

    console.log('✅ Test result:', result);
    expect(result).toHaveProperty('color');
    expect(result).toHaveProperty('description');
    expect(typeof result.color).toBe('string');
    expect(typeof result.description).toBe('string');
  }, 30000);

  it('should throw error when API key is missing', () => {
    expect(() => {
      getGeminiSingletonClient({ apiKey: '' });
    }).toThrow('Gemini requires an API key');
  });

  testIf('should parse restaurant menu image using menu prompt and schema', async () => {
    const client = getGeminiSingletonClient({ apiKey: apiKey! });
    const visualStructuring = GeminiVisualStructuringFactory<Array<{
      name: string;
      category: string;
      description: string;
      price: string;
      language: string;
    }>>({ client });

    // Fetch image and convert to base64 (Gemini doesn't support proxy URLs)
    const imageUrl = 'https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Fimenupro.com%2Fimg%2Fmenu-template-steakhouse.png&f=1&nofb=1&ipt=e041bc88e33ebff9b7a7f0c093f53867de729057248a4eb2e13c77d54b1f9d8b';
    const response = await fetch(imageUrl);
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64 = buffer.toString('base64');
    const contentType = response.headers.get('content-type') || 'image/png';
    
    const menuImage: VisualDocument = {
      source: 'base64',
      documentType: 'image',
      file: `data:${contentType};base64,${base64}`,
    };

    const result = await visualStructuring.parse(menuImage, {
      prompt: menuPrompt,
      outputSchema: menuSchema,
    });

    console.log('\n📋 ========== MENU PARSING RESULT ==========');
    console.log(JSON.stringify(result, null, 2));
    console.log('📋 =========================================\n');
    
    // Validate structure
    expect(Array.isArray(result)).toBe(true);
    if (result.length > 0) {
      const firstItem = result[0];
      expect(firstItem).toHaveProperty('name');
      expect(firstItem).toHaveProperty('category');
      expect(firstItem).toHaveProperty('language');
      expect(typeof firstItem.name).toBe('string');
      expect(typeof firstItem.category).toBe('string');
      expect(typeof firstItem.language).toBe('string');
      
      // Validate category enum
      const validCategories = [
        'appetizer', 'main_course', 'side_dish', 'dessert',
        'beverage', 'alcohol', 'soup', 'salad', 'bread', 'combo', 'other'
      ];
      expect(validCategories).toContain(firstItem.category);
    }
  }, 60000); // 60 second timeout for menu parsing
});

