"use client";

import { useState } from "react";

import { CurrencyInput } from "@/components/shared/currency-input";
import { MoneyDisplay } from "@/components/shared/money-display";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";

import { useReconcileAccount } from "../hooks";
import { signedAmount, type Account, type ReconcileResult } from "../schema";

type ReconcileDialogProps = {
  account: Account | null;
  onOpenChange: (open: boolean) => void;
};

/** Compare the bank's figure with the ledger; the API books any difference as one adjustment. */
export function ReconcileDialog({ account, onOpenChange }: ReconcileDialogProps) {
  return (
    <Dialog open={!!account} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        {account && (
          <ReconcileBody key={account.id} account={account} onClose={() => onOpenChange(false)} />
        )}
      </DialogContent>
    </Dialog>
  );
}

function ReconcileBody({ account, onClose }: { account: Account; onClose: () => void }) {
  const reconcile = useReconcileAccount();
  const [balance, setBalance] = useState("");
  const [belowZero, setBelowZero] = useState(false);
  const [notes, setNotes] = useState("");
  const [result, setResult] = useState<{ message: string; data: ReconcileResult } | null>(null);

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    reconcile.mutate(
      { id: account.id, balance: signedAmount(balance, belowZero), notes },
      { onSuccess: (res) => setResult({ message: res.message, data: res.data }) }
    );
  };

  if (result) {
    return (
      <>
        <DialogHeader>
          <DialogTitle>{account.name} reconciled</DialogTitle>
          <DialogDescription>{result.message}</DialogDescription>
        </DialogHeader>
        <dl className="pixel-box bg-card divide-y-2 divide-dashed text-sm">
          <div className="flex justify-between gap-4 px-4 py-2.5">
            <dt className="text-muted-foreground">Statement balance</dt>
            <dd>
              <MoneyDisplay value={result.data.statement_balance} />
            </dd>
          </div>
          <div className="flex justify-between gap-4 px-4 py-2.5">
            <dt className="text-muted-foreground">Balance before</dt>
            <dd>
              <MoneyDisplay value={result.data.ledger_balance} />
            </dd>
          </div>
          <div className="flex justify-between gap-4 px-4 py-2.5">
            <dt className="text-muted-foreground">Adjustment</dt>
            <dd>
              <MoneyDisplay value={result.data.difference} signed className="font-medium" />
            </dd>
          </div>
        </dl>
        <DialogFooter>
          <Button onClick={onClose}>Done</Button>
        </DialogFooter>
      </>
    );
  }

  return (
    <form onSubmit={submit} noValidate>
      <DialogHeader>
        <DialogTitle>Reconcile {account.name}</DialogTitle>
        <DialogDescription>
          Enter the balance your bank or app shows today. If it differs from{" "}
          <MoneyDisplay value={account.current_balance} tone="neutral" />, we&apos;ll add one
          adjustment so they match.
        </DialogDescription>
      </DialogHeader>

      <FieldGroup className="my-6">
        <Field>
          <FieldLabel htmlFor="reconcile-balance">Statement balance</FieldLabel>
          <CurrencyInput
            id="reconcile-balance"
            value={balance}
            onChange={setBalance}
            placeholder="0.00"
            autoFocus
          />
        </Field>
        <Field orientation="horizontal">
          <Checkbox
            id="reconcile-below-zero"
            checked={belowZero}
            onCheckedChange={(v) => setBelowZero(v === true)}
          />
          <FieldLabel htmlFor="reconcile-below-zero" className="font-normal">
            The statement shows a negative balance
          </FieldLabel>
        </Field>
        <Field>
          <FieldLabel htmlFor="reconcile-notes">Notes</FieldLabel>
          <Textarea
            id="reconcile-notes"
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
          <FieldDescription>Optional, e.g. which statement you checked against.</FieldDescription>
        </Field>
        {reconcile.isError && (
          <Alert variant="destructive">
            <AlertDescription>{reconcile.error.message}</AlertDescription>
          </Alert>
        )}
      </FieldGroup>

      <DialogFooter className="gap-2">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" disabled={reconcile.isPending || balance === ""}>
          {reconcile.isPending ? "Reconciling..." : "Reconcile"}
        </Button>
      </DialogFooter>
    </form>
  );
}
