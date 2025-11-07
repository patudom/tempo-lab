
/**
 * Get the size of the nearest containing Golden Layout container.
 */
export function getGoldenLayoutContainerSize(element: HTMLElement): { width: number; height: number } | null {
    
  const container = element.closest('.lm_content');
  if (container) {
    const rect = container.getBoundingClientRect();
    return {
      width: rect.width,
      height: rect.height
    };
  }
  return null;
}
  
export function watchGoldenLayoutContainerSize(
  element: HTMLElement,
  callback: (size: { width: number; height: number }) => void
): ResizeObserver | null {
  const container = element.closest('.lm_content');
  
  if (container) {
    const resizeObserver = new ResizeObserver((entries) => {
      const rect = entries[0].contentRect; // there should be only one entry when we observe a single element
      callback({ width: rect.width, height: rect.height });

    });
    resizeObserver.observe(container);
    return resizeObserver;
  }
  return null;
}