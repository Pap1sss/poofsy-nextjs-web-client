import { screen, waitFor } from "@testing-library/react";
import { delay, http, HttpResponse } from "msw";
import { beforeEach, describe, expect, it } from "vitest";

import "@/config/routes"; // see src/test/navigation.test.tsx: settles an import cycle
import { onboardedAuth, paginated, transaction } from "@/test/fixtures";
import { ok, pickerHandlers } from "@/test/handlers";
import { renderWithProviders } from "@/test/render";
import { server } from "@/test/server";

import { TransactionsPage } from "./transactions-page";

/** Every GET /transactions query string the page sends, in order. */
let requests: URLSearchParams[];

const listReturning = (respond: (params: URLSearchParams) => ReturnType<typeof paginated>) =>
  http.get("*/api/transactions", ({ request }) => {
    const params = new URL(request.url).searchParams;
    requests.push(params);
    return ok(respond(params));
  });

beforeEach(() => {
  requests = [];
  server.use(...pickerHandlers);
});

const renderPage = (searchParams = "") =>
  renderWithProviders(<TransactionsPage />, { auth: onboardedAuth(), searchParams });

describe("TransactionsPage filters and pagination", () => {
  it("sends the filters it reads from the URL", async () => {
    server.use(listReturning(() => paginated([transaction()])));

    renderPage("?type=expense&from=2026-10-01&to=2026-10-31&search=jeepney&category_id=cat-food");

    await waitFor(() => expect(requests).toHaveLength(1));
    expect(Object.fromEntries(requests[0])).toEqual({
      type: "expense",
      from: "2026-10-01",
      to: "2026-10-31",
      search: "jeepney",
      category_id: "cat-food",
      sort: "-transaction_date",
      page: "1",
      per_page: "25",
    });
  });

  it("asks for the next page", async () => {
    server.use(
      listReturning((params) =>
        paginated(
          [
            transaction({
              id: `txn-p${params.get("page")}`,
              description: `Row on page ${params.get("page")}`,
            }),
          ],
          Number(params.get("page")),
          25,
          60
        )
      )
    );
    const { user } = renderPage();

    expect(await screen.findByText("Showing 1–1 of 60")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Next" }));

    expect((await screen.findAllByText("Row on page 2")).length).toBeGreaterThan(0);
    expect(requests.at(-1)?.get("page")).toBe("2");
    expect(screen.getByText("2 / 3")).toBeInTheDocument();
  });

  it("clears every filter from an empty filtered view", async () => {
    server.use(listReturning((params) => paginated(params.get("type") ? [] : [transaction()])));
    const { user } = renderPage("?type=income&search=bonus");

    expect(await screen.findByText("Nothing matches these filters")).toBeInTheDocument();
    await user.click(screen.getAllByRole("button", { name: "Clear filters" })[0]);

    expect((await screen.findAllByText("Groceries")).length).toBeGreaterThan(0);
    const last = requests.at(-1)!;
    expect(last.get("type")).toBeNull();
    expect(last.get("search")).toBeNull();
    expect(last.get("page")).toBe("1");
  });
});

describe("TransactionsPage states", () => {
  it("shows a loading skeleton while the list loads", async () => {
    server.use(
      http.get("*/api/transactions", async () => {
        await delay("infinite");
        return HttpResponse.json({});
      })
    );
    renderPage();

    expect(await screen.findByLabelText("Loading transactions")).toHaveAttribute(
      "aria-busy",
      "true"
    );
  });

  it("explains a failed load", async () => {
    server.use(
      http.get("*/api/transactions", () =>
        HttpResponse.json(
          { success: false, message: "An unexpected error occurred." },
          { status: 500 }
        )
      )
    );
    renderPage();

    expect(
      await screen.findByText("Couldn't load transactions: An unexpected error occurred.")
    ).toBeInTheDocument();
  });

  it("invites a new user to add their first transaction", async () => {
    server.use(listReturning(() => paginated([])));
    renderPage();

    expect(await screen.findByText("No transactions yet")).toBeInTheDocument();
    expect(
      screen.getByText("Add your first expense to start tracking where your money goes.")
    ).toBeInTheDocument();
  });

  it("sends income-record rows to the Income page instead of editing them here", async () => {
    server.use(
      listReturning(() =>
        paginated([
          transaction({
            id: "txn-salary",
            type: "income",
            category: null,
            description: "Salary",
            from_income_record: true,
          }),
        ])
      )
    );
    renderPage();

    const links = await screen.findAllByRole("link", { name: "Edit on Income page" });
    expect(links[0]).toHaveAttribute("href", "/income");
    // No edit/delete menu for this row.
    expect(screen.queryByRole("button", { name: "Actions for Salary" })).not.toBeInTheDocument();
  });
});
