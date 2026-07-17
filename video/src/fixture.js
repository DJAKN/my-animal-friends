// Static fixture mirroring the real app's data shapes, so the video renders
// deterministically (no network) while showing the genuine components.

export const HERO_ANIMAL = {
  kind: 'wild',
  id: 'w-hero',
  lat: 35.6595,
  lng: 139.7005,
  commonName: 'Japanese Raccoon Dog',
  sciName: 'Nyctereutes viverrinus',
  taxonId: 1,
  iconicTaxon: 'Mammalia',
  photo: null,
  photoLarge: null,
  observedOn: '2026-07-12',
  placeGuess: 'Shibuya, Tokyo',
  conservation: null,
  count: 6,
  spreadM: 900,
  wikipediaUrl: 'https://en.wikipedia.org/wiki/Japanese_raccoon_dog',
  inatUrl: 'https://www.inaturalist.org/observations/1',
}

export const HERO_WIKI = {
  extract:
    'The Japanese raccoon dog, or tanuki, is a canid native to Japan. A gentle nocturnal forager, it features in folklore as a cheerful shapeshifter and lives quietly at the edges of towns, fields and forests.',
  url: 'https://en.wikipedia.org/wiki/Japanese_raccoon_dog',
}

export const NEARBY_STATUS = {
  text: '4 wild neighbors · 4 animal places near Shibuya',
  busy: false,
}
