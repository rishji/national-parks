import "@testing-library/jest-dom/vitest";

class RO {
  observe() {}
  unobserve() {}
  disconnect() {}
}
// jsdom lacks ResizeObserver
(globalThis as unknown as { ResizeObserver: typeof RO }).ResizeObserver ??= RO;
