import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { NightCheckin } from "../../src/components/NightCheckin";

const entry = {
  date: "2026-07-20",
  commitment: "outline the report",
  completionStatus: "pending" as const,
};

describe("NightCheckin", () => {
  it("is unavailable when no commitment exists for today (FR-014)", () => {
    render(<NightCheckin entry={undefined} canStart={false} onSubmitOutcome={vi.fn()} />);
    expect(
      screen.getByText(/set today's commitment first/i),
    ).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Yes" })).not.toBeInTheDocument();
  });

  it("asks 'what did you learn' on yes and persists completionStatus=complete (FR-005)", async () => {
    const onSubmitOutcome = vi.fn();
    render(<NightCheckin entry={entry} canStart={true} onSubmitOutcome={onSubmitOutcome} />);

    expect(screen.getByText("outline the report")).toBeInTheDocument();

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Yes" }));
    expect(screen.getByText("What did you learn?")).toBeInTheDocument();

    await user.type(screen.getByLabelText("What did you learn?"), "it was easier than expected");
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(onSubmitOutcome).toHaveBeenCalledWith(true, "it was easier than expected");
  });

  it("asks 'what blocked you' on no and persists completionStatus=incomplete (FR-006)", async () => {
    const onSubmitOutcome = vi.fn();
    render(<NightCheckin entry={entry} canStart={true} onSubmitOutcome={onSubmitOutcome} />);

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "No" }));
    expect(screen.getByText("What blocked you?")).toBeInTheDocument();

    await user.type(screen.getByLabelText("What blocked you?"), "got pulled into meetings");
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(onSubmitOutcome).toHaveBeenCalledWith(false, "got pulled into meetings");
  });

  it("disables Save until the detail answer is non-empty", async () => {
    render(<NightCheckin entry={entry} canStart={true} onSubmitOutcome={vi.fn()} />);
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Yes" }));
    expect(screen.getByRole("button", { name: "Save" })).toBeDisabled();
  });
});
