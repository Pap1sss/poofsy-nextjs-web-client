import { useState } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

import { Autocomplete, type AutocompleteOption } from "./autocomplete";

const ACCOUNTS: AutocompleteOption[] = [
  { value: "a1", label: "BPI Savings" },
  { value: "a2", label: "GCash" },
  { value: "a3", label: "Cash wallet" },
];

function Harness(props: Partial<React.ComponentProps<typeof Autocomplete>> & { initial?: string }) {
  const { initial = "", ...rest } = props;
  const [value, setValue] = useState(initial);

  return (
    <>
      <label htmlFor="account">Account</label>
      <Autocomplete id="account" value={value} onChange={setValue} options={ACCOUNTS} {...rest} />
      <output data-testid="value">{value}</output>
    </>
  );
}

const input = () => screen.getByRole("combobox", { name: "Account" });
const value = () => screen.getByTestId("value").textContent;

describe("Autocomplete", () => {
  it("filters case-insensitively and submits the option's id, not its label", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.type(input(), "CASH");
    const options = await screen.findAllByRole("option");
    expect(options.map((o) => o.textContent)).toEqual(["GCash", "Cash wallet"]);

    await user.click(screen.getByRole("option", { name: "Cash wallet" }));
    expect(value()).toBe("a3");
    expect(input()).toHaveValue("Cash wallet");
  });

  it("supports arrow keys, Enter and Escape", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.click(input());
    await user.keyboard("{ArrowDown}{ArrowDown}{Enter}");
    expect(value()).toBe("a2");

    await user.click(input());
    expect(await screen.findByRole("listbox")).toBeInTheDocument();
    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("listbox")).not.toBeInTheDocument());
    expect(value()).toBe("a2");
  });

  it("says when nothing matches", async () => {
    const user = userEvent.setup();
    render(<Harness emptyMessage="No accounts match." />);

    await user.type(input(), "zzz");
    expect(await screen.findByText("No accounts match.")).toBeInTheDocument();
  });

  it("clears an optional field", async () => {
    const user = userEvent.setup();
    render(<Harness initial="a1" clearable placeholder="No account" />);

    expect(input()).toHaveValue("BPI Savings");
    await user.click(screen.getByRole("button", { name: "Clear selection" }));
    expect(value()).toBe("");
  });

  it("marks invalid and required fields for assistive tech", () => {
    render(<Harness invalid required />);

    expect(input()).toHaveAttribute("aria-invalid", "true");
    expect(input()).toHaveAttribute("aria-required", "true");
  });

  it("searches the server, keeping only the newest query's results", async () => {
    const user = userEvent.setup();
    const calls: {
      query: string;
      signal: AbortSignal;
      resolve: (o: AutocompleteOption[]) => void;
    }[] = [];
    const loadOptions = vi.fn(
      (query: string, signal: AbortSignal) =>
        new Promise<AutocompleteOption[]>((resolve) => calls.push({ query, signal, resolve }))
    );
    render(<Harness options={[]} loadOptions={loadOptions} />);
    // Looked up once: while the popup is open, the label outside it is aria-hidden.
    const field = input();

    await user.click(field);
    await waitFor(() => expect(calls).toHaveLength(1));
    expect(calls[0].query).toBe("");
    expect(screen.getByText("Loading...")).toBeInTheDocument();

    await user.type(field, "gc");
    await waitFor(() => expect(calls.at(-1)?.query).toBe("gc"));
    // Typing debounces: one request for "gc", not one per key.
    expect(calls.map((c) => c.query)).toEqual(["", "gc"]);
    expect(calls[0].signal.aborted).toBe(true);

    calls[0].resolve([{ value: "stale", label: "Stale result" }]);
    calls[1].resolve([{ value: "a2", label: "GCash" }]);
    await user.click(await screen.findByRole("option", { name: "GCash" }));
    expect(screen.queryByText("Stale result")).not.toBeInTheDocument();
    expect(value()).toBe("a2");
    expect(field).toHaveValue("GCash");
  });

  it("can be picked from inside a modal dialog", async () => {
    // Tests run without Tailwind; this is the one utility the popup needs to work in a modal.
    const css = document.head.appendChild(document.createElement("style"));
    css.textContent = ".pointer-events-auto { pointer-events: auto; }";
    const user = userEvent.setup();
    render(
      <Dialog open>
        <DialogContent>
          <DialogTitle>Pay bill</DialogTitle>
          <Harness />
        </DialogContent>
      </Dialog>
    );

    await user.click(input());
    // user-event refuses to click through pointer-events: none, which Radix puts on <body>.
    await user.click(await screen.findByRole("option", { name: "GCash" }));
    expect(value()).toBe("a2");
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    css.remove();
  });
});
