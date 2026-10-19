import './setup';

// Incluye todo el código evaluable, incluso módulos sin importar en un spec.
const source = require.context('../src', true, /\.(js|jsx)$/);
source.keys().filter(file => file !== './main.jsx').forEach(source);
const specs = require.context('.', false, /\.spec\.(js|jsx)$/);
specs.keys().forEach(specs);
