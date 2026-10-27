import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { GUIDE_TOPICS } from "../content";
import { resetGuideProgress } from "../progress";
import GuidePage from "./guide-page";

// Rendering all 15 chapters is heavy for jsdom; under the parallel full suite it can pass 5s.
vi.setConfig({ testTimeout: 30_000 });

// jsdom has no IntersectionObserver; the chapter cursor just stays on the first topic.
vi.stubGlobal(
  "IntersectionObserver",
  class {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
);

// Pasted rather than typed: each keystroke re-renders the whole guide, which jsdom does slowly.
async function search(user: ReturnType<typeof userEvent.setup>, text: string) {
  await user.click(screen.getByLabelText("Search the guide"));
  await user.paste(text);
}

const progress = () => screen.getByRole("progressbar", { name: "Topics marked as understood" });

describe("GuidePage", () => {
  beforeEach(() => {
    window.localStorage.clear();
    resetGuideProgress();
  });

  it("shows every chapter with its heading", () => {
    render(<GuidePage />);
    for (const topic of GUIDE_TOPICS) {
      expect(screen.getByRole("heading", { level: 2, name: topic.title })).toBeInTheDocument();
    }
  });

  it("filters to matching answers and opens them", async () => {
    const user = userEvent.setup();
    render(<GuidePage />);

    await search(user, "back in my account");

    expect(screen.getByRole("heading", { level: 2, name: "Debt Management" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { level: 2, name: "Welcome to Poofsy" })).toBeNull();
    // The matching entry is expanded, so the answer itself is on screen.
    expect(screen.getAllByText(/Not counted as income/).length).toBeGreaterThan(0);
  });

  it("shows suggestions when nothing matches, and they find something", async () => {
    const user = userEvent.setup();
    render(<GuidePage />);

    await search(user, "bitcoin");
    expect(screen.getByText('Nothing in the guide matches "bitcoin"')).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "rollover" }));
    expect(screen.getByLabelText("Search the guide")).toHaveValue("rollover");
    expect(screen.getByRole("heading", { level: 2, name: "Budget Planning" })).toBeInTheDocument();
  });

  it("marks a topic as understood, counts it, remembers it, and can undo it", async () => {
    const user = userEvent.setup();
    render(<GuidePage />);
    const section = document.getElementById("paylater")!;

    expect(progress()).toHaveAttribute("aria-valuenow", "0");

    await user.click(within(section).getByRole("button", { name: "Mark as understood" }));

    expect(progress()).toHaveAttribute("aria-valuenow", "1");
    expect(within(section).getByRole("button", { name: "Marked as understood" })).toHaveAttribute(
      "aria-pressed",
      "true"
    );
    expect(JSON.parse(window.localStorage.getItem("poofsy:guide-understood")!)).toEqual([
      "paylater",
    ]);

    await user.click(within(section).getByRole("button", { name: "Marked as understood" }));
    expect(progress()).toHaveAttribute("aria-valuenow", "0");
    expect(window.localStorage.getItem("poofsy:guide-understood")).toBeNull();
  });

  it("starts over", async () => {
    const user = userEvent.setup();
    render(<GuidePage />);

    await user.click(
      within(document.getElementById("welcome")!).getByRole("button", {
        name: "Mark as understood",
      })
    );
    await user.click(screen.getByRole("button", { name: "Start over" }));

    expect(progress()).toHaveAttribute("aria-valuenow", "0");
  });
});
