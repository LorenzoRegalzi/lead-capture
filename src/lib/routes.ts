export const ROUTES = {
  store: "/",
  scan: "/scan",
  manual: "/manual",
  photos: "/photos",
  history: "/history",
} as const;

export const historyEntryRoute = (id: string) => `${ROUTES.history}/${encodeURIComponent(id)}`;

// "Inventory sent" screen for one submission (the draft is already cleared, so it reads the history entry)
export const doneRoute = (id: string) => `/done/${encodeURIComponent(id)}`;
