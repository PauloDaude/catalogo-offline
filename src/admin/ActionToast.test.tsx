import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import { ActionToast } from "./ActionToast";

afterEach(() => vi.useRealTimers());

test("confirmação some após cinco segundos e cancela o timer ao desmontar", () => {
  vi.useFakeTimers();
  const onClose = vi.fn();
  const view = render(
    <ActionToast
      message="Produtos excluídos"
      onClose={onClose}
    />,
  );
  expect(screen.getByRole("status")).toHaveTextContent("Produtos excluídos");
  act(() => vi.advanceTimersByTime(4999));
  expect(onClose).not.toHaveBeenCalled();
  act(() => vi.advanceTimersByTime(1));
  expect(onClose).toHaveBeenCalledTimes(1);
  view.unmount();
  act(() => vi.advanceTimersByTime(5000));
  expect(onClose).toHaveBeenCalledTimes(1);
});

test("foco mantém a confirmação disponível e permite fechar manualmente", () => {
  vi.useFakeTimers();
  const onClose = vi.fn();
  render(
    <ActionToast
      message="Produto salvo"
      onClose={onClose}
    />,
  );
  const close = screen.getByRole("button", { name: "Fechar notificação" });
  fireEvent.focus(close);
  act(() => vi.advanceTimersByTime(10000));
  expect(onClose).not.toHaveBeenCalled();
  fireEvent.click(close);
  expect(onClose).toHaveBeenCalledTimes(1);
});
