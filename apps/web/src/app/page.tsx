import { formatBRL, type Money } from "@feudo/core";
import { Button } from "@/components/ui/button";

const sample: Money = { amountCentavos: 123456, currency: "BRL" };

export default function Home() {
  return (
    <main className="bg-background text-foreground flex flex-1 flex-col items-center justify-center gap-6 px-6 text-center">
      <h1 className="text-4xl font-semibold tracking-tight">Feudo</h1>
      <p className="text-muted-foreground max-w-md">
        Visibilidade financeira e reserva de emergência para o seu lar.
      </p>
      <Button>{formatBRL(sample)}</Button>
    </main>
  );
}
