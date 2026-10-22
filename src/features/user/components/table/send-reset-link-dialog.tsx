"use client";

import * as React from "react";
import { toast } from "sonner";
import type { Row } from "@tanstack/react-table";
import { KeyRound } from "lucide-react";

import { Dialog } from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/confirm-dialog";

import { UserListItem } from "../../schema";
import { useSendPasswordResetLink } from "../../hooks";

interface SendResetLinkDialogProps extends React.ComponentPropsWithoutRef<typeof Dialog> {
  user: Row<UserListItem>["original"] | null;
  showTrigger?: boolean;
  onSuccess?: () => void;
}

export function SendResetLinkDialog({
  user,
  showTrigger = true,
  onSuccess,
  ...props
}: SendResetLinkDialogProps) {
  const sendResetLink = useSendPasswordResetLink(user?.id ?? "");

  const onSend = () => {
    if (!user) {
      toast.error("No User selected");
      return;
    }

    sendResetLink.mutate(undefined, {
      onSuccess: ({ message }) => {
        props.onOpenChange?.(false);
        toast.success(message);
        onSuccess?.();
      },
      onError: ({ message }) => {
        toast.error(message);
      },
    });
  };

  return (
    <ConfirmDialog
      {...props}
      title="Send password reset link?"
      description={`We'll email ${user?.email} a link to set their own new password. It expires in 60 minutes and their current password keeps working until they use it.`}
      onConfirm={onSend}
      isPending={sendResetLink.isPending}
      showTrigger={showTrigger}
      triggerLabel="Send reset link"
      triggerIcon={KeyRound}
      confirmLabel="Send link"
    />
  );
}
