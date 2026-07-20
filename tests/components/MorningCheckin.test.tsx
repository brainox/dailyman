import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { MorningCheckin } from "../../src/components/MorningCheckin";

describe("MorningCheckin", () => {
  it("submits the avoidance answer (FR-001)", async () => {
    const onSubmitAvoidance = vi.fn();
    render(
      <MorningCheckin
        entry={undefined}
        generating={false}
        error={undefined}
        isApiKeyMissing={false}
        pendingAvoidance={undefined}
        onSubmitAvoidance={onSubmitAvoidance}
        onRetry={vi.fn()}
        onSubmitCommitment={vi.fn()}
      />,
    );
    const user = userEvent.setup();
    await user.type(
      screen.getByLabelText("What are you avoiding today?"),
      "the tax filing",
    );
    await user.click(screen.getByRole("button", { name: "Continue" }));
    expect(onSubmitAvoidance).toHaveBeenCalledWith("the tax filing");
  });

  it("shows exactly one follow-up question and lets the user set a commitment (FR-002, FR-003)", async () => {
    const onSubmitCommitment = vi.fn();
    render(
      <MorningCheckin
        entry={{
          date: "2026-07-20",
          avoidance: "the tax filing",
          morningFollowup: "What's a 30-minute version of this?",
          completionStatus: "pending",
        }}
        generating={false}
        error={undefined}
        isApiKeyMissing={false}
        pendingAvoidance={undefined}
        onSubmitAvoidance={vi.fn()}
        onRetry={vi.fn()}
        onSubmitCommitment={onSubmitCommitment}
      />,
    );
    expect(
      screen.getByText("What's a 30-minute version of this?"),
    ).toBeInTheDocument();

    const user = userEvent.setup();
    await user.type(
      screen.getByLabelText("Answer to the follow-up question"),
      "outline the sections",
    );
    await user.click(screen.getByRole("button", { name: "Set today's commitment" }));
    expect(onSubmitCommitment).toHaveBeenCalledWith("outline the sections");
  });

  it("disables input and preserves the typed answer while generating", () => {
    render(
      <MorningCheckin
        entry={undefined}
        generating={true}
        error={undefined}
        isApiKeyMissing={false}
        pendingAvoidance="the tax filing"
        onSubmitAvoidance={vi.fn()}
        onRetry={vi.fn()}
        onSubmitCommitment={vi.fn()}
      />,
    );
    const textarea = screen.getByLabelText("What are you avoiding today?");
    expect(textarea).toBeDisabled();
    expect(textarea).toHaveValue("the tax filing");
  });

  it("shows an inline retry option on generation failure without losing the draft", async () => {
    const onRetry = vi.fn();
    render(
      <MorningCheckin
        entry={undefined}
        generating={false}
        error="Failed to generate a response. Check your connection and try again."
        isApiKeyMissing={false}
        pendingAvoidance="the tax filing"
        onSubmitAvoidance={vi.fn()}
        onRetry={onRetry}
        onSubmitCommitment={vi.fn()}
      />,
    );
    expect(screen.getByRole("alert")).toHaveTextContent(/failed to generate/i);
    expect(screen.getByLabelText("What are you avoiding today?")).toHaveValue(
      "the tax filing",
    );

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Retry" }));
    expect(onRetry).toHaveBeenCalled();
  });

  it("shows a message when the API key is missing, without a submit button", () => {
    render(
      <MorningCheckin
        entry={undefined}
        generating={false}
        error={undefined}
        isApiKeyMissing={true}
        pendingAvoidance={undefined}
        onSubmitAvoidance={vi.fn()}
        onRetry={vi.fn()}
        onSubmitCommitment={vi.fn()}
      />,
    );
    expect(screen.getByText(/add an anthropic api key/i)).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Continue" }),
    ).not.toBeInTheDocument();
  });
});
