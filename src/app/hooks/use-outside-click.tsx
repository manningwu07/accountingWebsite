import { useEffect, useRef } from "react";

function useOutsideClick<T extends HTMLElement>(
  onOutside: () => void
) {
  const ref = useRef<T | null>(null);

  useEffect(() => {
    function handle(e: MouseEvent) {
      const node = ref.current;
      if (!node) return;
      if (!node.contains(e.target as Node)) onOutside();
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [onOutside]);

  return ref;
}

export default useOutsideClick;