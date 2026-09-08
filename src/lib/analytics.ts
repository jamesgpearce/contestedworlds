export const analyticsEnabled = (
  id: string,
  site: string,
  location: Pick<Location, 'hostname'>,
  privacy: { doNotTrack?: string | null; globalPrivacyControl?: boolean },
) =>
  /^G-[A-Z0-9]+$/.test(id) &&
  location.hostname === new URL(site).hostname &&
  !['localhost', '127.0.0.1', '[::1]'].includes(location.hostname) &&
  privacy.doNotTrack !== '1' &&
  !privacy.globalPrivacyControl;

/** One visit per page load. Filter and tooltip URL changes are not new pages. */
export const analyticsCommands = (
  id: string,
  canonical: string,
  title: string,
) => [
  ['js', new Date()],
  [
    'config',
    id,
    {
      send_page_view: false,
      allow_google_signals: false,
      allow_ad_personalization_signals: false,
      page_location: canonical,
    },
  ],
  ['event', 'page_view', { page_title: title, page_location: canonical }],
];
