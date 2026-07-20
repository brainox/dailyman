import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { AcknowledgmentStep } from "../../src/components/AcknowledgmentStep";

describe("AcknowledgmentStep (FR-010)", () => {
  it("shows the missed commitment and a thinking state while the prompt generates", () => {
    render(
      <AcknowledgmentStep
        missedCommitment="outline the report"
        prompt={undefined}
        generating={true}
        error={undefined}
        onRetry={vi.fn()}
        onSubmit={vi.fn()}
      />,
    );
    expect(screen.getByText("outline the report")).toBeInTheDocument();
    expect(screen.getByText("Thinking…")).toBeInTheDocument();
  });

  it("shows an inline retry option on generation failure", async () => {
    const onRetry = vi.fn();
    render(
      <AcknowledgmentStep
        missedCommitment="outline the report"
        prompt={undefined}
        generating={false}
        error="Failed to generate a response. Check your connection and try again."
        onRetry={onRetry}
        onSubmit={vi.fn()}
      />,
    );
    expect(screen.getByRole("alert")).toHaveTextContent(/failed to generate/i);
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Retry" }));
    expect(onRetry).toHaveBeenCalled();
  });

  it("submits the user's response to the generated prompt", async () => {
    const onSubmit = vi.fn();
    render(
      <AcknowledgmentStep
        missedCommitment="outline the report"
        prompt="What happened last night?"
        generating={false}
        error={undefined}
        onRetry={vi.fn()}
        onSubmit={onSubmit}
      />,
    );
    expect(screen.getByText("What happened last night?")).toBeInTheDocument();

    const user = userEvent.setup();
    await user.type(
      screen.getByLabelText("What happened last night?"),
      "I fell asleep before checking in",
    );
    await user.click(screen.getByRole("button", { name: "Continue" }));
    expect(onSubmit).toHaveBeenCalledWith("I fell asleep before checking in");
  });

  it("disables Continue until a response is entered", () => {
    render(
      <AcknowledgmentStep
        missedCommitment="outline the report"
        prompt="What happened last night?"
        generating={false}
        error={undefined}
        onRetry={vi.fn()}
        onSubmit={vi.fn()}
      />,
    );
    expect(screen.getByRole("button", { name: "Continue" })).toBeDisabled();
  });
});
