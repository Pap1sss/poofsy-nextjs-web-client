import { PoofsyLogo } from "./PoofsyLogo";
import styles from "./PoofsyLoadingScreen.module.css";

interface PoofsyLoadingScreenProps {
  /** Announced to screen readers. */
  label?: string;
  /** Cover the whole viewport (route transitions) or just fill the parent. */
  fullScreen?: boolean;
}

/** Branded loading state, e.g. for `app/loading.tsx` or Suspense fallbacks. */
export function PoofsyLoadingScreen({
  label = "Loading…",
  fullScreen = true,
}: PoofsyLoadingScreenProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={fullScreen ? styles.fullScreen : styles.inline}
    >
      <div className={styles.bob}>
        <PoofsyLogo variant="icon" size={96} alt="" priority />
      </div>
      <span className={styles.srOnly}>{label}</span>
    </div>
  );
}

export default PoofsyLoadingScreen;
