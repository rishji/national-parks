import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { Park } from "../data/types";
import { GridView } from "./GridView";

vi.mock("../lib/assets", () => ({ artUrl: () => ({ src: "x.svg", custom: false }) }));

const mk = (id: string, name: string, acres: number, region: Park["region"]) =>
  ({ id, name, acres, region, kind: "mountain" }) as Park;
const parks = [mk("zion", "Zion", 147000, "Southwest"), mk("haleakala", "Haleakalā", 33000, "Hawaiʻi & Pacific"), mk("acadia", "Acadia", 49000, "East")];
const visits = [{ park: "zion", start: "2021-05" }, { park: "acadia" }];

const names = () =>
  within(screen.getByRole("list")).getAllByRole("button").map((b) => b.getAttribute("aria-label")!.split(",")[0]);

test("sorts by name (diacritics-aware) by default and by size", async () => {
  render(<GridView parks={parks} visits={visits} visited={new Set(["zion", "acadia"])} filter="all" onSelect={() => {}} />);
  expect(names()).toEqual(["Acadia", "Haleakalā", "Zion"]);
  await userEvent.selectOptions(screen.getByLabelText("Sort"), "size");
  expect(names()).toEqual(["Zion", "Acadia", "Haleakalā"]);
});

test("visited sort: dated newest first, undated visited next, unvisited last", async () => {
  render(<GridView parks={parks} visits={visits} visited={new Set(["zion", "acadia"])} filter="all" onSelect={() => {}} />);
  await userEvent.selectOptions(screen.getByLabelText("Sort"), "visited");
  expect(names()).toEqual(["Zion", "Acadia", "Haleakalā"]);
});

test("filter hides non-matching cards and clicking selects", async () => {
  const onSelect = vi.fn();
  render(<GridView parks={parks} visits={visits} visited={new Set(["zion", "acadia"])} filter="not" onSelect={onSelect} />);
  expect(names()).toEqual(["Haleakalā"]);
  await userEvent.click(screen.getByRole("button", { name: /Haleakalā/ }));
  expect(onSelect).toHaveBeenCalledWith("haleakala");
});
