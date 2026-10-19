import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "./App";

vi.mock("./lib/assets", () => ({
  artUrl: () => ({ src: "x.svg", custom: false }),
  heroUrl: () => "hero.webp",
  photoUrls: () => undefined,
}));

beforeEach(() => history.replaceState(null, "", "/"));

test("renders title, 63 park buttons on the map, and the progress count", () => {
  render(<App />);
  expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Rishi's National Parks");
  expect(screen.getAllByRole("button", { name: /, (visited|not yet visited)$/ })).toHaveLength(63);
  expect(screen.getByRole("img", { name: /of 63 parks/ })).toBeInTheDocument();
});

test("clicking a park opens its panel and sets the hash; Escape closes", async () => {
  render(<App />);
  await userEvent.click(screen.getByRole("button", { name: "Zion, visited" }));
  expect(screen.getByRole("complementary", { name: "Zion details" })).toBeInTheDocument();
  expect(location.hash).toBe("#zion");
  await userEvent.keyboard("{Escape}");
  expect(screen.queryByRole("complementary", { name: /details/ })).not.toBeInTheDocument();
});

test("a deep link opens the panel; an unknown hash is ignored", () => {
  history.replaceState(null, "", "/#arches");
  const { unmount } = render(<App />);
  expect(screen.getByRole("complementary", { name: "Arches details" })).toBeInTheDocument();
  unmount();
  history.replaceState(null, "", "/#not-a-park");
  render(<App />);
  expect(screen.queryByRole("complementary")).not.toBeInTheDocument();
});

test("hashchange (browser back) closes the panel", async () => {
  history.replaceState(null, "", "/#zion");
  render(<App />);
  act(() => {
    history.replaceState(null, "", "/");
    window.dispatchEvent(new HashChangeEvent("hashchange"));
  });
  expect(screen.queryByRole("complementary")).not.toBeInTheDocument();
});

test("filter fades non-matching badges and grid toggle swaps the view", async () => {
  render(<App />);
  await userEvent.click(screen.getByRole("button", { name: /^Not yet/ }));
  expect(screen.getByRole("button", { name: "Zion, visited" })).toHaveClass("dim");
  await userEvent.click(screen.getByRole("button", { name: "Grid" }));
  expect(screen.getByLabelText("Sort")).toBeInTheDocument();
});

test("next/prev in the panel steps alphabetically", async () => {
  history.replaceState(null, "", "/#zion");
  render(<App />);
  await userEvent.click(screen.getByRole("button", { name: "Next park" }));
  expect(screen.getByRole("complementary", { name: "Acadia details" })).toBeInTheDocument();
});

test("a malformed hash (bad percent-encoding) is ignored instead of crashing", () => {
  history.replaceState(null, "", "/#50%");
  render(<App />);
  expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
  expect(screen.queryByRole("complementary")).not.toBeInTheDocument();
});

test("badges stop easing their position while the map is being zoomed or panned", () => {
  const { container } = render(<App />);
  const svg = container.querySelector(".map-svg")!;
  const badges = container.querySelector(".badges")!;
  expect(badges).not.toHaveClass("moving");
  act(() => {
    svg.dispatchEvent(new WheelEvent("wheel", { deltaY: -100, clientX: 300, clientY: 200, bubbles: true, cancelable: true }));
  });
  expect(badges).toHaveClass("moving");
});
