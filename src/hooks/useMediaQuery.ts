import { useEffect, useState } from "react";

export function useMediaQuery(query: unknown) {
  const [matches, setMatches] = useState(false);
  useEffect(() => {
    const mediaQuery = window.matchMedia(query as string);
    setMatches(mediaQuery.matches);

    const handler = (event: { matches: boolean }) => {
      setMatches(event.matches);
    };

    mediaQuery.addEventListener("change", handler);

    return () => {
      mediaQuery.removeEventListener("change", handler);
    };
  }, [query]);

  return matches;
}
