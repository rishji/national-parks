import { render, screen } from "@testing-library/react";
import App from "./App";

test("renders the site title", () => {
  render(<App />);
  expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Rishi's National Parks");
});
