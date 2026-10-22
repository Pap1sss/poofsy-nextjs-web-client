/**
 * Segmented-control look shared by link navs (TabLinks) and toggle groups (ListStatusTabs).
 * Selection is read from aria-current="page" or aria-pressed="true", so styling follows the ARIA state.
 * Pixel tab bar: an outlined strip; the selected tab gets the cursor-yellow highlight and its own outline.
 */
export const segmentListClass =
  "pixel-box bg-muted text-muted-foreground inline-flex h-12 w-fit items-center gap-1 p-1 sm:h-11";

export const segmentClass =
  "font-pixel text-foreground/80 hover:bg-accent hover:text-foreground focus-visible:outline-highlight inline-flex h-full items-center justify-center border-2 border-transparent px-3 text-sm whitespace-nowrap outline-none focus-visible:outline-3 focus-visible:outline-offset-1 aria-[current=page]:border-outline aria-[current=page]:bg-highlight aria-[current=page]:text-highlight-foreground aria-pressed:border-outline aria-pressed:bg-highlight aria-pressed:text-highlight-foreground";
