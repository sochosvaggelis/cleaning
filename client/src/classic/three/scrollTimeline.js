/*
 * Maps page scroll to a story "timeline" value t.
 * Every section with a data-chapter attribute is an anchor: t === n when the centre of
 * chapter n sits in the middle of the viewport, and t moves linearly between anchors.
 */
let centers = [];

export function measureChapters() {
  const sections = Array.from(document.querySelectorAll('[data-chapter]')).sort(
    (a, b) => Number(a.dataset.chapter) - Number(b.dataset.chapter),
  );
  const scrollY = window.scrollY;
  centers = sections.map((el) => {
    const rect = el.getBoundingClientRect();
    return rect.top + scrollY + rect.height / 2;
  });
}

export function readTimeline() {
  if (centers.length < 2) return 0;
  const playhead = window.scrollY + window.innerHeight / 2;
  if (playhead <= centers[0]) return 0;
  for (let i = 0; i < centers.length - 1; i += 1) {
    if (playhead < centers[i + 1]) return i + (playhead - centers[i]) / (centers[i + 1] - centers[i]);
  }
  return centers.length - 1;
}
