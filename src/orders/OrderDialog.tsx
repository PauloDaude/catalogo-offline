import { DocumentSkeleton } from "../components/LoadingSkeleton";
import { useEffect, useRef, useState } from "react";
import {
  Form,
  TextField,
  Label,
  Input,
  TextArea,
  FieldError,
} from "react-aria-components";
import { Share2, ArrowLeft, MessageCircle } from "lucide-react";
import { Button } from "../components/ui/button";
import { DialogTitle } from "../components/ui/dialog";
import type { Cart } from "../cart/useCart";
import { price } from "../catalog/price";
import { createOrderSnapshot } from "./model";
import { canShareOrder, downloadOrder, shareOrder } from "./share";

import type { OrderSession } from "./useOrderSession";
import { PdfIcon } from "./PdfIcon";
import { OrderPreview } from "./OrderPreview";
import { orderWhatsAppUrl } from "./whatsapp";
export function OrderDialog({
  cart,
  catalogReady,
  productImages,
  onBack,
  session,
}: {
  cart: Cart;
  catalogReady: boolean;
  productImages: Map<string, string>;
  onBack: () => void;
  session: OrderSession;
}) {
  const { customerName, setCustomerName, notes, setNotes, ready, setReady } =
    session;
  const [generating, setGenerating] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const currentKey = session.key;
  const latestKey = useRef(currentKey);
  latestKey.current = currentKey;
  const generation = useRef(0);
  const initialKey = useRef(currentKey);
  const customerInput = useRef<HTMLInputElement>(null);
  const readyAction = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (ready) readyAction.current?.focus();
  }, [ready]);
  useEffect(() => {
    customerInput.current?.focus();
    return () => {
      generation.current += 1;
    };
  }, []);
  useEffect(() => {
    if (initialKey.current !== currentKey) {
      initialKey.current = currentKey;
      generation.current += 1;
      setReady(null);
      setGenerating(false);
      setError("A seleção mudou, confira o carrinho e gere o PDF novamente");
    }
  }, [currentKey]);
  const validReady = ready?.key === currentKey ? ready : null;
  const blocked = !catalogReady
    ? "Aguarde o carregamento do catálogo"
    : cart.changes.length
      ? "Revise e atualize a seleção no carrinho antes de gerar o pedido"
      : cart.items.some((i) => i.unavailable)
        ? "Remova os produtos indisponíveis do carrinho"
        : cart.totalCents === null
          ? "Confira os valores do carrinho"
          : !cart.items.length
            ? "Adicione produtos ao carrinho"
            : "";
  return (
    <section
      className="order-flow"
      aria-busy={generating}
    >
      <div className="cart-heading">
        <div>
          <DialogTitle>
            {validReady ? "Pedido pronto" : "Pedido em PDF"}
          </DialogTitle>
          <p>
            {validReady
              ? "Escolha como deseja compartilhar"
              : "Informe o cliente para preparar o pedido"}
          </p>
        </div>
      </div>
      {validReady ? (
        <>
          <div className="order-document">
            <OrderPreview preview={validReady.preview} />
            <div className="order-document-meta">
              <div>
                <strong title={validReady.file.name}>
                  {validReady.file.name}
                </strong>
                <span>{validReady.order.customerName}</span>
              </div>
              <strong className="order-total">
                {price(validReady.order.totalCents)}
              </strong>
            </div>
          </div>
          <p>O PDF está pronto, o carrinho continua salvo neste aparelho</p>
          <div className="order-actions">
            <Button
              className="touch-button"
              ref={readyAction}
              isDisabled={sharing || !canShareOrder(validReady.file)}
              onPress={() => {
                setSharing(true);
                setError("");
                setNotice("");
                void shareOrder(validReady.file)
                  .then((result) => {
                    if (result === "shared")
                      setNotice("PDF encaminhado ao aplicativo escolhido");
                  })
                  .catch(() =>
                    setError(
                      "Não foi possível compartilhar, tente novamente ou baixe o PDF",
                    ),
                  )
                  .finally(() => setSharing(false));
              }}
            >
              <Share2 aria-hidden="true" />
              {sharing ? "Aguarde…" : "Compartilhar PDF"}
            </Button>

            <Button
              ref={canShareOrder(validReady.file) ? undefined : readyAction}
              className="touch-button order-pdf-button"
              isDisabled={sharing}
              onPress={() => {
                try {
                  downloadOrder(validReady.file);
                  setError("");
                } catch {
                  setError("Não foi possível baixar o PDF, tente novamente");
                }
              }}
            >
              <PdfIcon />
              Baixar PDF
            </Button>
          </div>
          {!canShareOrder(validReady.file) && (
            <p className="order-share-help">
              Compartilhamento de PDF indisponível neste navegador, baixe o
              arquivo ou envie o pedido em texto pelo WhatsApp
            </p>
          )}
          <a
            className="order-whatsapp touch-button"
            href={orderWhatsAppUrl(validReady.order)}
            target="_blank"
            rel="noopener noreferrer"
          >
            <MessageCircle aria-hidden="true" />
            Enviar pedido pelo WhatsApp
          </a>
          <Button
            variant="ghost"
            className="touch-button"
            onPress={() => {
              setReady(null);
              setError("");
              setNotice("");
            }}
          >
            Editar dados do pedido
          </Button>
        </>
      ) : (
        <Form
          className="order-form"
          onSubmit={async (event) => {
            event.preventDefault();
            if (generating || blocked) return;
            setError("");
            setNotice("");
            const key = currentKey;
            const request = ++generation.current;
            try {
              const order = createOrderSnapshot({
                customerName,
                notes,
                items: cart.items,
                pendingChanges: cart.changes.length > 0,
                catalogReady,
                now: new Date(),
              });
              if (order.totalCents !== cart.totalCents)
                throw new Error(
                  "Confira os valores do carrinho antes de gerar o pedido",
                );
              setGenerating(true);
              const images = new Map(productImages);
              const { generateOrderPdf } = await import("./pdf");
              const file = await generateOrderPdf(order, images);
              let preview: Blob | null = null;
              if (request !== generation.current || key !== latestKey.current)
                return;
              try {
                const { renderOrderPreview } = await import("./preview");
                preview = await renderOrderPreview(file);
              } catch {
                /* Sharing remains available even if preview rendering fails. */
              }
              if (request === generation.current && key === latestKey.current)
                setReady({ file, preview, order, key });
            } catch (cause) {
              if (request === generation.current)
                setError(
                  cause instanceof Error
                    ? cause.message
                    : "Não foi possível gerar o PDF, tente novamente",
                );
            } finally {
              if (request === generation.current) setGenerating(false);
            }
          }}
        >
          <TextField
            isRequired
            maxLength={120}
            value={customerName}
            onChange={setCustomerName}
            isDisabled={generating}
            validate={(value) =>
              !value.trim() ? "Informe o nome do cliente" : null
            }
          >
            <Label>Nome do cliente</Label>
            <Input
              ref={customerInput}
              autoComplete="off"
            />
            <FieldError />
          </TextField>
          <TextField
            maxLength={1000}
            value={notes}
            onChange={setNotes}
            isDisabled={generating}
          >
            <Label>Observações (opcional)</Label>
            <TextArea rows={3} />
            <FieldError />
          </TextField>
          <div className="order-seller">Vendedor: Antônio Marcos Daúde</div>
          {blocked && <p className="cart-warning">{blocked}</p>}
          <Button
            type="submit"
            className="touch-button order-pdf-button"
            isDisabled={generating || !!blocked}
          >
            <PdfIcon />
            {generating ? "Gerando…" : "Gerar PDF"}
          </Button>
          {generating && (
            <DocumentSkeleton label="Gerando seu PDF, aguarde nesta tela" />
          )}
        </Form>
      )}
      {error && (
        <p
          role="alert"
          className="order-error"
        >
          {error}
        </p>
      )}
      {notice && <p role="status">{notice}</p>}
      <Button
        variant="outline"
        className="touch-button order-back"
        isDisabled={sharing}
        onPress={onBack}
      >
        <ArrowLeft aria-hidden="true" />
        Voltar ao carrinho
      </Button>
    </section>
  );
}
