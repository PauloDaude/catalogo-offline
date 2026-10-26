import { act, render, screen } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import { SyncStatus } from "./SyncStatus";
const props = {
  saved: true,
  state: "saved",
  message: "Catálogo salvo para usar sem internet",
  progress: null,
  onPrepare: async () => {},
};
afterEach(() => vi.useRealTimers());
test("confirmação some em cinco segundos sem remover Atualizar e reaparece após salvar novamente", () => {
  vi.useFakeTimers();
  const view = render(<SyncStatus {...props} />);
  act(() => vi.advanceTimersByTime(4999));
  expect(screen.getByRole("status")).toHaveTextContent(props.message);
  act(() => vi.advanceTimersByTime(1));
  expect(screen.queryByRole("status")).toBeNull();
  expect(screen.getByRole("button", { name: "Atualizar" })).toBeEnabled();
  view.rerender(
    <SyncStatus
      {...props}
      state="syncing"
      message="Preparando catálogo"
    />,
  );
  view.rerender(<SyncStatus {...props} />);
  expect(screen.getByRole("status")).toHaveTextContent(props.message);
});
test.each(["error", "syncing", "saved"])(
  "não esconde erro, progresso ou alerta offline (%s)",
  (state) => {
    vi.useFakeTimers();
    render(
      <SyncStatus
        {...props}
        state={state}
        message="Sem internet, os preços podem ter mudado"
      />,
    );
    act(() => vi.advanceTimersByTime(6000));
    expect(screen.getByRole("status")).toBeVisible();
  },
);
