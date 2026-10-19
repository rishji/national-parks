import { render, screen } from "@testing-library/react";
import { Header } from "./Header";

test("shows count, total and stats; Date TBD when no dated visit", () => {
  render(<Header stats={{ visitedCount: 14, total: 63, statesCovered: 13, statesTotal: 32, acresVisited: 8865803 }} />);
  expect(screen.getByText("14")).toBeInTheDocument();
  expect(screen.getByText("/ 63 parks")).toBeInTheDocument();
  expect(screen.getByRole("img", { name: /14 of 63 parks/ })).toBeInTheDocument();
  expect(screen.getByText("8.9M")).toBeInTheDocument();
  expect(screen.getByText("Date TBD")).toBeInTheDocument();
});
