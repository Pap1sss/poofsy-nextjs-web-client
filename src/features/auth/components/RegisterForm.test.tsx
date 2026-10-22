import { screen, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";

import "@/config/routes"; // see src/test/navigation.test.tsx: load before auth to settle an import cycle
import { server } from "@/test/server";
import { renderWithProviders } from "@/test/render";

import RegisterForm from "./RegisterForm";

const fill = async (
  user: ReturnType<typeof renderWithProviders>["user"],
  password = "Secret123!!",
  confirm = password
) => {
  await user.type(screen.getByLabelText("First name"), "Maria");
  await user.type(screen.getByLabelText("Last name"), "Clara");
  await user.type(screen.getByLabelText("Email"), "maria@example.com");
  await user.type(screen.getByLabelText("Password"), password);
  await user.type(screen.getByLabelText("Confirm password"), confirm);
  await user.click(screen.getByRole("button", { name: "Create account" }));
};

describe("RegisterForm", () => {
  it("explains a weak password before sending anything", async () => {
    const { user } = renderWithProviders(<RegisterForm />);

    await fill(user, "password");

    expect(
      await screen.findByText("Password must contain at least one number.")
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toHaveAttribute("aria-invalid", "true");
  });

  it("catches passwords that don't match", async () => {
    const { user } = renderWithProviders(<RegisterForm />);

    await fill(user, "Secret123!!", "Secret123!?");

    expect(await screen.findByText("Passwords don't match.")).toBeInTheDocument();
  });

  it("puts the API's 422 on the email field", async () => {
    server.use(
      http.get("*/api/csrf-cookie", () => new HttpResponse(null, { status: 204 })),
      http.post("*/api/auth/spa/register", () =>
        HttpResponse.json(
          {
            success: false,
            message: "The email has already been taken.",
            errors: { email: ["The email has already been taken."] },
          },
          { status: 422 }
        )
      )
    );
    const { user } = renderWithProviders(<RegisterForm />);

    await fill(user);

    expect(await screen.findByText("The email has already been taken.")).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toHaveAttribute("aria-invalid", "true");
    // On the field only, not repeated in a generic banner.
    expect(screen.getAllByText("The email has already been taken.")).toHaveLength(1);
  });

  it("sends the form and refreshes the signed-in user on success", async () => {
    let body: unknown;
    server.use(
      http.get("*/api/csrf-cookie", () => new HttpResponse(null, { status: 204 })),
      http.post("*/api/auth/spa/register", async ({ request }) => {
        body = await request.json();
        return HttpResponse.json(
          { success: true, message: "Account created successfully!" },
          { status: 201 }
        );
      })
    );
    const { user, queryClient } = renderWithProviders(<RegisterForm />);
    queryClient.setQueryData(["auth"], { success: false, message: "Unauthenticated.", data: null });

    await fill(user);

    await waitFor(() => expect(queryClient.getQueryState(["auth"])?.isInvalidated).toBe(true));
    expect(body).toEqual({
      first_name: "Maria",
      last_name: "Clara",
      email: "maria@example.com",
      password: "Secret123!!",
      password_confirmation: "Secret123!!",
    });
  });
});
