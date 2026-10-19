// Matchers de Jasmine para comprobaciones DOM y colecciones compartidas.
export const matchers = {
  toHaveLength: () => ({ compare: (actual, expected) => ({ pass: actual?.length === expected }) }),
  toHaveProperty: () => ({ compare: (actual, key) => ({ pass: actual != null && Object.hasOwn(actual, key) }) }),
  toMatchObject: util => ({ compare: (actual, expected) => ({ pass: util.equals(actual, jasmine.objectContaining(expected)) }) }),
  toBeInTheDocument: () => ({ compare: actual => ({ pass: actual instanceof Element && document.contains(actual) }) }),
  toHaveFocus: () => ({ compare: actual => ({ pass: actual === document.activeElement }) }),
  toBeDisabled: () => ({ compare: actual => ({ pass: actual instanceof Element && actual.matches(':disabled') }) }),
  toHaveAttribute: () => ({ compare: (actual, name, value) => ({ pass: actual instanceof Element && actual.hasAttribute(name) && (value === undefined || actual.getAttribute(name) === value) }) }),
  toHaveTextContent: () => ({ compare: (actual, expected) => {
    const text = actual?.textContent?.replace(/\s+/g, ' ').trim() || '';
    return { pass: expected instanceof RegExp ? expected.test(text) : text.includes(expected) };
  } }),
};
