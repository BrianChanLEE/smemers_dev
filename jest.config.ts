import type {JestConfigWithTsJest} from 'ts-jest';

const jestConfig: JestConfigWithTsJest = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/*.spec.[jt]s?(x)', '**/*.test.[jt]s?(x)'],
};

export default jestConfig;
