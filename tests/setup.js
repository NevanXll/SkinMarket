import { cleanup } from '@testing-library/react';
import { matchers } from './matchers';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
jasmine.DEFAULT_TIMEOUT_INTERVAL = 20000;

beforeEach(() => {
  jasmine.addMatchers(matchers);
  localStorage.clear();
  spyOn(window, 'scrollTo').and.stub();
});

afterEach(() => cleanup());
