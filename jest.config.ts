import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: [
    '**/?(*.)test.ts',
    '**/?(*.)integration.test.ts',
  ],
  setupFiles: ['<rootDir>/tests/jest.setup.ts'],
};

export default config;
