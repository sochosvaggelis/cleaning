/**
 * Services & prices: edit freely.
 *
 * Prices are in whole currency units (e.g. dollars); durations are on-site minutes.
 * Each service is priced in one of three ways:
 *   tiers: the customer picks one size (small / medium / large …)
 *   unit:  the customer picks a quantity (bins, oil stains …)
 *   flat:  one fixed price
 * `core` services count towards bundle discounts; `addon`s need at least one core service.
 */
export const services = [
  {
    id: 'driveway',
    category: 'core',
    name: 'Driveway Cleaning',
    icon: 'driveway',
    blurb:
      'Oil drips, tire marks, moss and years of grime lifted with a rotary surface cleaner for an even, streak-free finish.',
    includes: [
      'Stain & moss pre-treatment',
      'Surface-cleaner pass, no zebra stripes',
      'Edges, curbs & borders detailed',
      'Full rinse-down',
    ],
    tiers: [
      { id: 'small', label: 'Small', detail: 'Fits 1–2 cars', price: 99, minutes: 60 },
      { id: 'medium', label: 'Medium', detail: 'Fits 3–4 cars', price: 149, minutes: 90, popular: true },
      { id: 'large', label: 'Large', detail: '5+ cars or a long drive', price: 199, minutes: 150 },
    ],
  },
  {
    id: 'patio',
    category: 'core',
    name: 'Patio & Walkways',
    icon: 'patio',
    blurb:
      'Pavers, stone and concrete paths brought back to their original color, including the steps up to your door.',
    includes: [
      'Moss & weeds blasted from joints',
      'Low-angle clean that keeps sand joints intact',
      'Steps & edges',
      'Rinse-down',
    ],
    tiers: [
      { id: 'small', label: 'Small', detail: 'Front path & steps, or a bistro patio', price: 79, minutes: 45 },
      { id: 'medium', label: 'Medium', detail: 'A standard patio', price: 119, minutes: 75, popular: true },
      { id: 'large', label: 'Large', detail: 'Large patio or several areas', price: 169, minutes: 120 },
    ],
  },
  {
    id: 'house',
    category: 'core',
    name: 'House Soft Wash',
    icon: 'home',
    blurb:
      'A low-pressure wash with biodegradable soap that kills algae & mildew without harming siding, paint or plants.',
    includes: [
      'Plants pre-wetted & protected',
      'Eco-friendly soft-wash solution',
      'Siding, trim & soffits',
      'Windows rinsed spot-free',
    ],
    tiers: [
      { id: 'small', label: 'Single-story', detail: 'Up to 3 bedrooms', price: 249, minutes: 150 },
      { id: 'medium', label: 'Two-story', detail: 'Or a large single-story', price: 349, minutes: 210, popular: true },
      { id: 'large', label: 'Large home', detail: '4+ bedrooms, two stories', price: 449, minutes: 270 },
    ],
  },
  {
    id: 'deck',
    category: 'core',
    name: 'Deck Cleaning',
    icon: 'deck',
    blurb: 'Wood-safe pressure and a brightener rinse restore gray, slippery boards and composite decks.',
    includes: ['Wood-safe fan tip, never gouges', 'Algae & mildew treatment', 'Railings & steps', 'Brightener rinse'],
    tiers: [
      { id: 'small', label: 'Small', detail: 'Fits a table & 4 chairs', price: 129, minutes: 75 },
      { id: 'medium', label: 'Medium', detail: 'Dining + lounge area', price: 179, minutes: 120, popular: true },
      { id: 'large', label: 'Large', detail: 'Big or multi-level deck', price: 249, minutes: 180 },
    ],
  },
  {
    id: 'fence',
    category: 'core',
    name: 'Fence Cleaning',
    icon: 'fence',
    blurb: 'Green algae and gray weathering stripped from wood, vinyl and metal fences, on both sides if you like.',
    includes: ['Both faces of the fence', 'Posts & caps', 'Gentle on older wood', 'Rinse-down'],
    tiers: [
      { id: 'one', label: 'One side', detail: 'One side of the yard', price: 89, minutes: 60 },
      { id: 'two', label: 'Two sides', detail: 'Two sides of the yard', price: 149, minutes: 105, popular: true },
      { id: 'full', label: 'Full yard', detail: 'All the way around', price: 219, minutes: 150 },
    ],
  },
  {
    id: 'bins',
    category: 'core',
    name: 'Bin Cleaning',
    icon: 'bin',
    blurb: 'Trash and recycling bins scrubbed, sanitized and deodorized. The job nobody wants, and we enjoy it.',
    includes: ['Inside & outside wash', 'Sanitizing rinse', 'Deodorizer', 'Wheels & lid hinges'],
    unit: { label: 'bin', plural: 'bins', price: 15, minutes: 10, min: 1, max: 8, default: 2 },
  },
  {
    id: 'furniture',
    category: 'core',
    name: 'Outdoor Furniture',
    icon: 'chair',
    blurb: 'Patio sets, loungers and play sets, hand-scrubbed and rinsed with a gentle, safe pressure.',
    includes: ['Hand scrub where needed', 'Gentle low-pressure rinse', 'Cushion frames & legs', 'Air-dried in the sun'],
    tiers: [
      { id: 'small', label: 'Small set', detail: 'Table + up to 4 chairs', price: 49, minutes: 30 },
      { id: 'large', label: 'Large set', detail: '5+ pieces or a lounge set', price: 79, minutes: 50, popular: true },
    ],
  },
  {
    id: 'garage',
    category: 'core',
    name: 'Garage Floor',
    icon: 'garage',
    blurb: 'Degreased and pressure-washed concrete. Goodbye oil drips, tire marks and winter salt.',
    includes: ['Degreaser pre-soak', 'Surface-cleaner pass', 'Corners & edges', 'Squeegee dry'],
    tiers: [
      { id: 'one', label: '1-car', detail: 'Single garage', price: 79, minutes: 45 },
      { id: 'two', label: '2-car', detail: 'Double garage', price: 109, minutes: 60, popular: true },
      { id: 'three', label: '3-car', detail: 'Triple garage', price: 139, minutes: 80 },
    ],
  },

  // ---- Add-ons ----
  {
    id: 'oil-stains',
    category: 'addon',
    name: 'Oil stain treatment',
    icon: 'droplet',
    blurb: 'Degreaser soak and hot scrub on stubborn oil spots.',
    unit: { label: 'stain', plural: 'stains', price: 25, minutes: 15, min: 1, max: 6, default: 1 },
  },
  {
    id: 'paver-joints',
    category: 'addon',
    name: 'Paver joint weeding',
    icon: 'leaf',
    blurb: 'Weeds and moss blasted out of the gaps between pavers.',
    flat: { price: 39, minutes: 30 },
  },
  {
    id: 'gutter-faces',
    category: 'addon',
    name: 'Gutter face brightening',
    icon: 'home',
    blurb: 'Removes the black "tiger stripes" on the outside of gutters.',
    flat: { price: 59, minutes: 45 },
  },
];

export const serviceById = Object.fromEntries(services.map((s) => [s.id, s]));
export const coreServices = services.filter((s) => s.category === 'core');
export const addonServices = services.filter((s) => s.category === 'addon');

/** Automatic multi-service discounts (the best matching rule wins). */
export const bundleDiscounts = [
  { minServices: 3, percent: 15 },
  { minServices: 2, percent: 10 },
];

/** Pre-built packages shown on the price list. Their prices are calculated, never typed in. */
export const combos = [
  {
    id: 'curb-appeal',
    name: 'Curb Appeal',
    blurb: 'Everything guests see from the street.',
    items: [
      { serviceId: 'driveway', tierId: 'medium' },
      { serviceId: 'patio', tierId: 'small' },
      { serviceId: 'bins', qty: 2 },
    ],
  },
  {
    id: 'backyard',
    name: 'Backyard Refresh',
    blurb: 'Summer-ready in a single visit.',
    items: [
      { serviceId: 'deck', tierId: 'medium' },
      { serviceId: 'patio', tierId: 'medium' },
      { serviceId: 'furniture', tierId: 'small' },
    ],
  },
  {
    id: 'whole-home',
    name: 'Whole-Home Glow',
    blurb: 'The full makeover, top to bottom.',
    items: [
      { serviceId: 'house', tierId: 'medium' },
      { serviceId: 'driveway', tierId: 'medium' },
      { serviceId: 'patio', tierId: 'medium' },
    ],
  },
];
