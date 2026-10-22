"use client";

import { useState } from "react";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useLogoutMutation } from "../api/useLogoutMutation";

const LogoutButton = () => {
  const { mutate: logout } = useLogoutMutation();
  const [open, setOpen] = useState(false);

  const handleLogout = () => {
    logout();
    setOpen(false);
  };

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="text-destructive"
        onClick={() => setOpen(true)}
        aria-label="log out"
      >
        <LogOut className="h-4 w-4" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="w-[calc(100%-2rem)] max-w-100">
          <DialogHeader>
            <DialogTitle className="text-center">Confirm Logout</DialogTitle>
            <DialogDescription className="text-center">
              Are you sure you want to log out? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:space-x-0">
            <Button variant="outline" onClick={() => setOpen(false)} className="flex-1">
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleLogout} className="flex-1">
              Log Out
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default LogoutButton;
