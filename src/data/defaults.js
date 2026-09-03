export const STORAGE_KEY = 'art-data';

// Reference content (static — rendered, not stored in the gist DB).
export const CHANNELS = {
  feedback: {
    heading: 'Best for real feedback / community',
    items: [
      { name: 'Reddit', tag: 'critique', kind: 'art', track: 'reddit', note: 'Strongest for honest critique. Track the subreddits you want to post in below. Post WIP, not just finished pieces.' },
      { name: 'Discord servers', tag: 'community', kind: 'art', track: 'discord', note: "Fast, ongoing feedback. Track the servers you're active in below — be a regular, not a drive-by poster." },
      { name: 'itch.io + devlogs', tag: 'game', kind: 'game', note: 'Post builds and devlogs; get real playtesting feedback on the game side.' },
      { name: 'Feedback Friday / TIGSource', tag: 'game', kind: 'game', note: 'Structured game-feedback threads (r/gamedev weekly + TIGForums). Trade critique to get it.' },
    ],
  },
  reach: {
    heading: 'Best for reach / discovery',
    items: [
      { name: 'Instagram', tag: 'core', kind: 'art', note: 'Core visual channel. Reels for reach, carousels for process shots.' },
      { name: 'TikTok', tag: 'reach', kind: 'art', note: 'Highest organic reach. Making-of clips, order packing, timelapses.' },
    ],
  },
};

// Dynamic data — this is what lives in the gist.
export const DEFAULT_DATA = {
  // Art organizers: collectives / galleries with artist rosters. They may not
  // have events right now — tracked so we notice when they announce one.
  organizers: [
    { id: 'org-takumi',   name: 'Takumi Valley',  description: 'Organizer of artists that hosts occasional events in Little Tokyo.' },
    { id: 'org-1111',     name: '11:11',          description: 'SFV-based organizer of artists.' },
    { id: 'org-indietoy', name: 'IndieToy',       description: 'Organizer of artists with a focus on physical toys.' },
    { id: 'org-nucleus',  name: 'Gallery Nucleus', description: 'Art gallery that hosts events.' },
  ],
  fairs: [
    { id: 'fair-razfest',        name: 'Raz Fest 2026',    dates: 'Sep 19–20', location: 'Gallery Nucleus', type: '', booth: '', deadline: '', status: 'want to apply', notes: '11am–5pm' },
    { id: 'fair-indietoycon',    name: 'IndieToyCon',      dates: 'Sep 12–13', location: 'Gallery Nucleus', type: '', booth: '', deadline: '', status: 'want to apply', notes: '11am–6pm' },
    { id: 'fair-indiegamenight', name: 'Indie Game Night', dates: 'Oct 5',     location: '',               type: '', booth: '', deadline: '', status: 'want to apply', notes: '6pm–9pm' },
    { id: 'fair-lazinefest',     name: 'LA Zine Fest',     dates: 'Nov 7',     location: '',               type: '', booth: '', deadline: '', status: 'want to apply', notes: '' },
    { id: 'fair-animeexpo',      name: 'Anime Expo',       dates: 'Jul 2–5',   location: '',               type: '', booth: '', deadline: '', status: 'want to apply', notes: '' },
    { id: 'fair-lightbox',       name: 'Lightbox Expo',    dates: 'Oct 23–25', location: '',               type: '', booth: '', deadline: '', status: 'want to apply', notes: '' },
  ],
  // Subreddits / Discord servers to post in — tracked as name + description.
  social: { reddit: [], discord: [] },
  // Always-on weekly rituals (e.g. hashtags) — add your own.
  weekly: [],
  events: [
    { id: 'seed-mermay',    name: 'Mermay',    color: '#E23E6D', description: 'Daily mermaid art — big, popular hashtag. Good sticker fodder.',            start: '2026-05-01', end: '2026-05-31' },
    { id: 'seed-artfight',  name: 'Art Fight', color: '#8B5CF6', description: 'Character-art attack battle — very social, huge art-community engagement.',  start: '2026-07-01', end: '2026-07-31' },
    { id: 'seed-smaugust',  name: 'Smaugust',  color: '#F26D5B', description: 'Daily dragons.',                                                              start: '2026-08-01', end: '2026-08-31' },
    { id: 'seed-peachtober', name: 'Peachtober', color: '#F26D5B', description: 'Daily ink prompts (Peachtober list) — same span as Inktober, friendlier prompts.', start: '2026-10-01', end: '2026-10-31' },
    { id: 'seed-huevember', name: 'Huevember', color: '#2C6ED6', description: 'Daily color-wheel challenge.',                                               start: '2026-11-01', end: '2026-11-30' },
  ],
};

export function getInitialData() {
  return JSON.parse(JSON.stringify(DEFAULT_DATA));
}
