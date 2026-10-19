import { createId } from '../src/lib/id';
it('genera UUID también en el alojamiento HTTP de S3', () => {
  expect(createId({randomUUID:()=> 'native-id'})).toBe('native-id');
  const fallback = { getRandomValues: bytes => { bytes.fill(1); return bytes; } };
  expect(createId(fallback)).toBe('01010101-0101-4101-8101-010101010101');
});
