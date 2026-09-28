/**
 * The scroll story. Each chapter is one page section; the 3D camera flies to the matching
 * part of the property (see ../three/stage.js) and cleans it while the section scrolls by.
 * `side` is where the text card sits on desktop; the 3D subject is framed on the other side.
 */
export const stories = [
  {
    chapter: 1,
    anchor: 'services',
    side: 'left',
    eyebrow: 'Driveways & walkways',
    title: 'Years of grime, gone in one pass.',
    text: "Oil drips, tire marks and slippery moss don't stand a chance. A rotary surface cleaner leaves an even, streak-free finish, and the path to your front door gets the same treatment.",
    serviceIds: ['driveway', 'patio'],
  },
  {
    chapter: 2,
    anchor: 'house-washing',
    side: 'right',
    eyebrow: 'House soft wash',
    title: 'Green siding? Soft-washed back to bright.',
    text: 'High pressure can strip paint and force water behind siding, so we soft-wash instead: low pressure plus a biodegradable cleaner that kills algae and mildew at the root, so it stays clean for longer.',
    serviceIds: ['house'],
  },
  {
    chapter: 3,
    anchor: 'decks',
    side: 'left',
    eyebrow: 'Decks & outdoor furniture',
    title: 'Gray, slippery boards back to warm wood.',
    text: 'A wood-safe fan tip and a brightener rinse lift years of weathering without gouging the grain. Want the patio set done too? Add it to the same visit.',
    serviceIds: ['deck', 'furniture'],
  },
  {
    chapter: 4,
    anchor: 'fences',
    side: 'right',
    eyebrow: 'Fences',
    title: 'Every picket. Both sides. No streaks.',
    text: 'Wood, vinyl or metal: we strip the green algae and gray film off your fence so the whole yard looks new again.',
    serviceIds: ['fence'],
  },
  {
    chapter: 5,
    anchor: 'bins',
    side: 'left',
    eyebrow: 'Bin cleaning',
    title: 'Smelly bins, sanitized and fresh.',
    text: 'The job nobody wants. We scrub, sanitize and deodorize trash and recycling bins right at the curb. Add them to any visit for a few dollars a bin.',
    serviceIds: ['bins'],
  },
];
