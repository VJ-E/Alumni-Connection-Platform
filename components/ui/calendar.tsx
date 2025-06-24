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
        caption_label: "text-xl font-semibold text-white",
        nav: "flex items-center gap-1",
        nav_button: cn(
          "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background h-10 w-10 p-0 hover:bg-accent hover:text-accent-foreground",
          "text-white hover:bg-gray-700"
        ),
        table: "w-full border-collapse",
        head_row: "flex w-full",
        head_cell: "w-full text-muted-foreground font-normal text-[0.9rem] h-10 flex items-center justify-center text-gray-400",
        row: "flex w-full h-24 border-t border-gray-800",
        cell: cn(
          "w-full relative p-0 text-center hover:bg-gray-800 transition-colors cursor-pointer",
          "first:border-l border-r border-gray-800"
        ),
        day: cn(
          "h-full w-full p-2 flex flex-col gap-1 hover:bg-gray-800 aria-selected:bg-gray-800",
          "[&:has([aria-selected])]:bg-gray-800"
        ),
        day_today: "bg-gray-800",
        day_outside: "opacity-50 pointer-events-none",
        day_disabled: "text-muted-foreground opacity-50",
        day_hidden: "invisible",
        ...classNames,
      }}
      modifiers={{
        event: (date) => events.some(event => 
          format(event.date, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
        )
      }}
      modifiersClassNames={{
        event: "relative after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:h-1 after:w-1 after:bg-blue-500 after:rounded-full"
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