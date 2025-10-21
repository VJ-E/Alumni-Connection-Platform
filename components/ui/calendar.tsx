"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker } from "react-day-picker"
import { format } from "date-fns"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

export type CalendarProps = React.ComponentProps<typeof DayPicker> & {
  events?: {
    date: Date;
    title: string;
  }[];
  onDayClick?: (day: Date) => void;
}

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  events = [],
  onDayClick,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-0", className)}
      classNames={{
        months: "w-full",
        month: "space-y-4 w-full",
        caption: "relative flex items-center justify-between px-8 py-4",
        caption_label: "text-xl font-semibold text-foreground",
        nav: "flex items-center gap-1",
        nav_button: cn(
          "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background h-10 w-10 p-0 hover:bg-accent hover:text-accent-foreground text-foreground"
        ),
        table: "w-full border-collapse",
        head_row: "flex w-full",
        head_cell: "w-full text-muted-foreground font-normal text-[0.9rem] h-10 flex items-center justify-center",
        row: "flex w-full h-24 border-t border-border",
        cell: cn(
          "w-full relative p-0 text-center hover:bg-accent/30 transition-colors cursor-pointer",
          "first:border-l border-r border-border"
        ),
        day: cn(
          "h-full w-full p-2 flex flex-col gap-1 hover:bg-accent/30 aria-selected:bg-accent/50",
          "[&:has([aria-selected])]:bg-accent/20"
        ),
        day_today: "bg-accent/20",
        day_outside: "opacity-50 pointer-events-none",
        day_disabled: "text-muted-foreground opacity-50",
        day_hidden: "invisible",
        ...classNames,
      }}
      modifiers={{
        event: (date) => events.some(event => 
          event.date && format(event.date, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
        )
      }}
      modifiersClassNames={{
        event: "relative after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:h-1.5 after:w-1.5 after:bg-primary after:rounded-full"
      }}
      onDayClick={(day) => {
        if (onDayClick && day) {
          onDayClick(day);
        }
      }}
      {...props}
    />
  )
}
Calendar.displayName = "Calendar"

export { Calendar } 