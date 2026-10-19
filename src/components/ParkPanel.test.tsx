import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { Park } from "../data/types";
import { ParkPanel } from "./ParkPanel";

vi.mock("../lib/assets", () => ({
  artUrl: () => ({ src: "x.svg", custom: false }),
  heroUrl: () => "hero.webp",
  photoUrls: (_p: string, f: string) => ({ thumb: `t-${f}`, full: `f-${f}` }),
}));

const zion = {
  id: "zion", name: "Zion", npsCode: "ZION", kind: "canyon", established: "1919-11-19", acres: 147242.66,
  visitors: 4692417, visitorsYear: 2024, sizeRank: 36, visitorRank: 3, description: "Sandstone canyons and the Virgin River.",
  highlights: ["Angels Landing", "The Narrows", "Emerald Pools"], bestSeason: "Apr–May, Sep–Oct",
  nearestAirport: "Las Vegas (LAS) · ~2.5 hr drive", npsUrl: "https://www.nps.gov/zion/", states: ["Utah"],
  heroPhoto: { credit: "NPS / Someone", sourceUrl: "https://commons.wikimedia.org/wiki/File:x.jpg" },
} as unknown as Park;

const noop = () => {};

test("visited park: visits section comes before the description, newest first, TBD last", () => {
  const visits = [
    { park: "zion" },
    { park: "zion", start: "2019-04", with: ["Sam"], note: "Narrows", photos: ["a.jpg"] },
    { park: "zion", start: "2023-10-02", end: "2023-10-04" },
    { park: "acadia", start: "2020" },
  ];
  render(<ParkPanel park={zion} visits={visits} onClose={noop} onPrev={noop} onNext={noop} />);
  const yours = screen.getByRole("heading", { name: /Your visits/ });
  const desc = screen.getByText(/Sandstone canyons/);
  expect(yours.compareDocumentPosition(desc) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  const dates = screen.getAllByTestId("visit-date").map((n) => n.textContent);
  expect(dates).toEqual(["Oct 2–4, 2023", "Apr 2019", "Date TBD"]);
  expect(screen.getByText("Sam")).toBeInTheDocument();
  expect(screen.getByText("3 trips")).toBeInTheDocument();
  expect(screen.queryByText(/Utah/)).not.toBeInTheDocument();
});

test("unvisited park: no visits section, Not yet stamp", () => {
  render(<ParkPanel park={zion} visits={[]} onClose={noop} onPrev={noop} onNext={noop} />);
  expect(screen.queryByRole("heading", { name: /Your visits/ })).not.toBeInTheDocument();
  expect(screen.getByText("Not yet")).toBeInTheDocument();
});

test("photo opens viewer; Escape closes viewer first, then the panel", async () => {
  const onClose = vi.fn();
  render(<ParkPanel park={zion} visits={[{ park: "zion", photos: ["a.jpg", "b.jpg"] }]} onClose={onClose} onPrev={noop} onNext={noop} />);
  await userEvent.click(screen.getByRole("button", { name: "Open photo 1 of 2" }));
  expect(screen.getByRole("dialog", { name: /Photo 1 of 2/ })).toBeInTheDocument();
  await userEvent.keyboard("{ArrowRight}");
  expect(screen.getByRole("dialog", { name: /Photo 2 of 2/ })).toBeInTheDocument();
  await userEvent.keyboard("{Escape}");
  expect(screen.queryByRole("dialog", { name: /Photo/ })).not.toBeInTheDocument();
  expect(onClose).not.toHaveBeenCalled();
  await userEvent.keyboard("{Escape}");
  expect(onClose).toHaveBeenCalledOnce();
});

test("a visit with no companions or photos renders without empty sections", () => {
  render(<ParkPanel park={zion} visits={[{ park: "zion" }]} onClose={noop} onPrev={noop} onNext={noop} />);
  expect(screen.queryByText("With")).not.toBeInTheDocument();
  expect(screen.queryByRole("button", { name: /Open photo/ })).not.toBeInTheDocument();
});
