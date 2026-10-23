import { screen, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { beforeEach, describe, expect, it } from "vitest";

import "@/config/routes"; // see src/test/navigation.test.tsx: settles an import cycle
import { onboardedAuth } from "@/test/fixtures";
import { ok } from "@/test/handlers";
import { renderWithProviders } from "@/test/render";
import { server } from "@/test/server";

import { DebtForm } from "./DebtForm";

const money = (amount: string) => ({ amount, currency: "PHP" });
const totals = {
  original: money("0.00"),
  settled: money("0.00"),
  remaining: money("0.00"),
  open_count: 0,
};

/** The body of every POST /debts the form sends. */
let posted: Record<string, unknown>[];

const createdDebt = {
  id: "debt-1",
  person: { id: "person-1", name: "Pines" },
  direction: "payable",
  description: "Lunch",
  notes: null,
  reference_number: null,
  original_amount: money("500.00"),
  settled: money("0.00"),
  remaining: money("500.00"),
  progress_percent: 0,
  debt_date: "2026-10-23",
  due_date: null,
  status: "active",
  settlements_count: 0,
  last_settlement_date: null,
  opening_account: null,
  cancelled_at: null,
  cancellation_reason: null,
  created_at: null,
  settlements: [],
  events: [],
};

const peopleReturning = (people: { id: string; name: string }[]) =>
  http.get("*/api/people", () =>
    ok(
      people.map((p) => ({
        ...p,
        notes: null,
        debts_count: 1,
        totals: { receivable: totals, payable: totals },
      }))
    )
  );

beforeEach(() => {
  posted = [];
  server.use(
    http.get("*/api/accounts", () => ok([])),
    http.post("*/api/debts", async ({ request }) => {
      posted.push((await request.json()) as Record<string, unknown>);
      return HttpResponse.json(
        { success: true, message: "Debt recorded.", data: createdDebt },
        { status: 201 }
      );
    })
  );
});

const fillAndSubmit = async (user: ReturnType<typeof renderWithProviders>["user"]) => {
  await user.click(screen.getByRole("radio", { name: /Money I owe/ }));
  await user.type(screen.getByLabelText("Who do you owe?"), "Pines");
  await user.type(screen.getByLabelText("Amount"), "500");
  await user.type(screen.getByLabelText("What's it for?"), "Lunch");
  await user.click(screen.getByRole("button", { name: "Add debt" }));
  // A client-side validation error would stop the request; name it if one shows.
  expect(screen.queryByText(/Invalid input/)?.textContent ?? null).toBeNull();
};

describe("DebtForm: a new person typed by name", () => {
  it("sends the name when nobody is saved yet", async () => {
    server.use(peopleReturning([]));
    const { user } = renderWithProviders(<DebtForm open onOpenChange={() => {}} debt={null} />, {
      auth: onboardedAuth(),
    });

    await screen.findByLabelText("Who owes you?");
    await fillAndSubmit(user);

    await waitFor(() => expect(posted).toHaveLength(1));
    expect(posted[0]).toMatchObject({ person_name: "Pines", direction: "payable" });
    expect(posted[0]).not.toHaveProperty("person_id");
  });

  it("sends the name after switching to someone new", async () => {
    server.use(peopleReturning([{ id: "person-9", name: "Juan" }]));
    const { user } = renderWithProviders(<DebtForm open onOpenChange={() => {}} debt={null} />, {
      auth: onboardedAuth(),
    });

    await user.click(await screen.findByRole("button", { name: "+ Someone new" }));
    await fillAndSubmit(user);

    await waitFor(() => expect(posted).toHaveLength(1));
    expect(posted[0]).toMatchObject({ person_name: "Pines" });
  });

  it("still saves after the account picker is shown and hidden again", async () => {
    server.use(peopleReturning([]));
    const { user } = renderWithProviders(<DebtForm open onOpenChange={() => {}} debt={null} />, {
      auth: onboardedAuth(),
    });

    await screen.findByLabelText("Who owes you?");
    const recordInAccount = screen.getByRole("checkbox");
    await user.click(recordInAccount);
    await user.click(recordInAccount);
    await fillAndSubmit(user);

    await waitFor(() => expect(posted).toHaveLength(1));
    expect(posted[0]).toMatchObject({ record_in_account: false, account_id: null });
  });
});
