"use client";
import * as React from "react";
import { Eye, EyeClosed } from "lucide-react";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils/component";

export type PasswordInputProps = React.ComponentProps<typeof Input>;

const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className, ...props }, ref) => {
    const [showPassword, setShowPassword] = React.useState(false);
    const togglePasswordVisibility = () => setShowPassword(!showPassword);

    return (
      <div className="relative w-full">
        <Input
          type={showPassword ? "text" : "password"}
          className={cn("pr-10", className)}
          ref={ref}
          {...props}
        />
        <div className="absolute inset-y-0 right-0 flex cursor-pointer items-center pr-3 text-muted-foreground hover:text-foreground transition-colors">
          {showPassword ? (
            <Eye className="h-4 w-4" onClick={togglePasswordVisibility} />
          ) : (
            <EyeClosed className="h-4 w-4" onClick={togglePasswordVisibility} />
          )}
        </div>
      </div>
    );
  }
);
PasswordInput.displayName = "PasswordInput";

export { PasswordInput };
