import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Modal from "../src/components/Modal";

it("contiene el foco, cierra con Escape y devuelve el foco original", async () => {
  const user = userEvent.setup();
  const close = jasmine.createSpy('onClose');
  const trigger = document.createElement("button");
  document.body.appendChild(trigger);
  trigger.focus();
  const { unmount } = render(
    <Modal onClose={close}>
      <section role="dialog">
        <button>Primero</button>
        <input aria-label="Dato" />
        <button>Último</button>
      </section>
    </Modal>,
  );
  expect(screen.getByRole("button", { name: "Primero" })).toHaveFocus();
  await user.tab({ shift: true });
  expect(screen.getByRole("button", { name: "Último" })).toHaveFocus();
  await user.tab();
  expect(screen.getByRole("button", { name: "Primero" })).toHaveFocus();
  await user.keyboard("{Escape}");
  expect(close).toHaveBeenCalledTimes(1);
  fireEvent.click(screen.getByRole("dialog"));
  expect(close).toHaveBeenCalledTimes(1);
  fireEvent.click(screen.getByRole("dialog").parentElement);
  expect(close).toHaveBeenCalledTimes(2);
  unmount();
  expect(trigger).toHaveFocus();
  trigger.remove();
});
