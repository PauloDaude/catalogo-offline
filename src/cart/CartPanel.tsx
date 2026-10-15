import { useState } from "react";
import { ShoppingCart, Plus, Minus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DialogTrigger,
  Dialog,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { price } from "../catalog/price";
import type { Cart } from "./useCart";
import { CartThumbnail } from "./CartThumbnail";

export function CartPanel({
  cart,
  productImages,
}: {
  cart: Cart;
  productImages: Map<string, string>;
}) {
  const [open, setOpen] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);

  const pending = cart.changes.length > 0;
  const total =
    cart.totalCents === null ? "Total indisponível" : price(cart.totalCents);

  return (
    <DialogTrigger
      isOpen={open}
      onOpenChange={(value) => {
        setOpen(value);
        setConfirmClear(false);
      }}
    >
      <Button
        className="cart-trigger touch-button"
        aria-label={`Abrir carrinho, ${cart.count} ${cart.count === 1 ? "item" : "itens"}`}
        variant="default"
      >
        <ShoppingCart aria-hidden="true" />
        <span>
          Carrinho <span className="cart-count">{cart.count}</span>
        </span>
        <strong>{pending ? "Revisar valores" : total}</strong>
      </Button>

      <Dialog
        showCloseButton={false}
        className="cart-dialog"
      >
        <div className="cart-heading">
          <div>
            <DialogTitle>Seu carrinho</DialogTitle>
            <p>Seleção deste atendimento</p>
          </div>
          <DialogClose
            variant="outline"
            className="touch-button"
          >
            Fechar
          </DialogClose>
        </div>
        {!cart.persistent && (
          <p
            role="alert"
            className="cart-warning"
          >
            Não foi possível salvar neste aparelho. Sua seleção ficará apenas
            nesta aba enquanto ela estiver aberta.
          </p>
        )}
        {pending && (
          <section
            role="alert"
            className="cart-warning"
          >
            <strong>O catálogo mudou. Revise sua seleção.</strong>
            <ul>
              {cart.changes.map((message) => (
                <li key={message}>{message}</li>
              ))}
            </ul>
            <p>
              Os valores anteriores serão mantidos até você atualizar. Produtos
              indisponíveis ficarão fora do novo total.
            </p>
            <Button
              className="touch-button"
              onPress={cart.acceptChanges}
            >
              Atualizar seleção
            </Button>
          </section>
        )}
        {cart.items.length ? (
          <>
            <ul className="cart-items">
              {cart.items.map((item) => (
                <li
                  key={item.id}
                  className="cart-item"
                >
                  <CartThumbnail
                    src={productImages.get(item.id)}
                    name={item.name}
                  />
                  <div className="cart-item-heading">
                    <h3>{item.name}</h3>
                    <Button
                      variant="ghost"
                      className="cart-remove touch-button"
                      aria-label={`Remover ${item.name}`}
                      onPress={() => cart.remove(item.id)}
                    >
                      <Trash2 aria-hidden="true" />
                    </Button>
                  </div>
                  <div className="cart-item-info">
                    <span className="product-code">#{item.code ?? "—"}</span>
                    <p>
                      {item.unavailable
                        ? "Indisponível — fora do total"
                        : `${price(item.priceCents)} por unidade`}
                    </p>
                  </div>
                  <div className="cart-item-actions">
                    <div
                      className="quantity-controls"
                      role="group"
                      aria-label={`Quantidade de ${item.name}`}
                    >
                      <Button
                        variant="outline"
                        className="touch-button quantity-button"
                        aria-label={`Diminuir quantidade de ${item.name}`}
                        isDisabled={item.quantity <= 1 || item.unavailable}
                        onPress={() =>
                          cart.quantity(item.id, item.quantity - 1)
                        }
                      >
                        <Minus aria-hidden="true" />
                      </Button>
                      <span aria-live="polite">{item.quantity}</span>
                      <Button
                        variant="outline"
                        className="touch-button quantity-button"
                        aria-label={`Aumentar quantidade de ${item.name}`}
                        isDisabled={item.quantity >= 999 || item.unavailable}
                        onPress={() =>
                          cart.quantity(item.id, item.quantity + 1)
                        }
                      >
                        <Plus aria-hidden="true" />
                      </Button>
                    </div>
                    <strong>
                      {item.unavailable
                        ? "—"
                        : Number.isSafeInteger(item.priceCents * item.quantity)
                          ? price(item.priceCents * item.quantity)
                          : "Valor excessivo"}
                    </strong>
                  </div>
                </li>
              ))}
            </ul>
            <div className="cart-total">
              <span>
                {pending
                  ? "Total anterior"
                  : cart.items.some((item) => item.unavailable)
                    ? "Total dos disponíveis"
                    : "Total da seleção"}
              </span>
              <strong
                className="cart-grand-total"
                aria-live="polite"
              >
                {total}
              </strong>
            </div>
            <p className="cart-disclaimer">
              {pending
                ? "Atualize a seleção para conferir os valores atuais."
                : "Confira os valores com o vendedor. Este carrinho não envia um pedido."}
            </p>
            {confirmClear ? (
              <div
                className="cart-clear-confirm"
                role="alert"
              >
                <p>Limpar todos os produtos para começar outro atendimento?</p>
                <div>
                  <Button
                    variant="outline"
                    className="touch-button"
                    onPress={() => setConfirmClear(false)}
                  >
                    Cancelar
                  </Button>
                  <Button
                    className="touch-button"
                    onPress={() => {
                      cart.clear();
                      setConfirmClear(false);
                    }}
                  >
                    Sim, limpar
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                variant="outline"
                className="touch-button"
                onPress={() => setConfirmClear(true)}
              >
                <Trash2 aria-hidden="true" />
                Limpar carrinho
              </Button>
            )}
          </>
        ) : (
          <div className="cart-empty">
            <ShoppingCart aria-hidden="true" />
            <h3>Seu carrinho está vazio</h3>
            <p>Adicione os produtos para somar os valores.</p>
            <DialogClose className="touch-button">
              Escolher produtos
            </DialogClose>
          </div>
        )}
      </Dialog>
    </DialogTrigger>
  );
}
