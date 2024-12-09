import React from "react";
import { TooltipTriggerContext } from "./tooltip-trigger-context";
import * as Tooltip from '@radix-ui/react-tooltip'
import { useHasHover } from "@/utils/hooks";


export const TooltipRoot: React.FC<Tooltip.TooltipProps> = ({ children, ...props }) => {
  const [open, setOpen] = React.useState<boolean>(props.defaultOpen ?? false);

  // we only want to enable the "click to open" functionality on mobile
  const hasHover = useHasHover();

  return (
    <Tooltip.Root
      delayDuration={hasHover ? props.delayDuration : 0}
      onOpenChange={(e) => {
        setOpen(e);
      }}
      open={open}
    >
      <TooltipTriggerContext.Provider value={{ open, setOpen }}>
        {children}
      </TooltipTriggerContext.Provider>
    </Tooltip.Root>
  );
};

export const TooltipTrigger = React.forwardRef<
  React.ElementRef<typeof Tooltip.Trigger>,
  React.ComponentPropsWithoutRef<typeof Tooltip.Trigger>
>(({ children, ...props }, ref) => {
  const hasHover = useHasHover();
  const { setOpen } = React.useContext(TooltipTriggerContext);

  return (
    <Tooltip.Trigger
      ref={ref}
      {...props}
      onClick={(e) => {
        !hasHover && e.preventDefault();
        setOpen(true);
      }}
    >
      {children}
    </Tooltip.Trigger>
  );
});

TooltipTrigger.displayName = 'TooltipTrigger';