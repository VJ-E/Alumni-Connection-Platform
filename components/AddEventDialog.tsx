"use client";

import { useState } from "react"
import { useUser } from "@clerk/nextjs"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { format } from "date-fns"
import { toast } from "react-toastify"

interface Event {
  title: string
  description: string
  date: string
  startTime: string
  endTime: string
  link?: string
  createdBy: {
    name: string
    email: string
    userId: string
  }
}

interface AddEventDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedDate?: Date
  onEventAdded: (event: Event) => void
}

export default function AddEventDialog({
  open,
  onOpenChange,
  selectedDate,
  onEventAdded
}: AddEventDialogProps) {
  const { user } = useUser()
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [startTime, setStartTime] = useState("")
  const [endTime, setEndTime] = useState("")
  const [link, setLink] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [date, setDate] = useState(() => selectedDate ? format(selectedDate, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user?.firstName || !user?.emailAddresses?.[0]?.emailAddress) {
      toast.error("Missing required user information")
      return
    }

    const newEvent: Event = {
      title,
      description,
      date: date,
      startTime,
      endTime,
      link: link || undefined,
      createdBy: {
        name: `${user.firstName} ${user.lastName || ''}`.trim(),
        email: user.emailAddresses[0].emailAddress,
        userId: user.id
      }
    }

    try {
      setIsSubmitting(true)
      const response = await fetch('/api/opportunities', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newEvent),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to create event')
      }

      onEventAdded(newEvent)
      setTitle("")
      setDescription("")
      setStartTime("")
      setEndTime("")
      setLink("")
      toast.success("Event created successfully!")
      onOpenChange(false)
    } catch (error) {
      console.error('Error creating event:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to create event')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] bg-card text-card-foreground">
        <DialogHeader>
          <DialogTitle>Add New Event</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="title" className="text-sm font-medium text-foreground">
              Title
            </label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Event title"
              required
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="date" className="text-sm font-medium text-foreground">
              Date
            </label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="description" className="text-sm font-medium text-foreground">
              Description
            </label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Event description"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="startTime" className="text-sm font-medium text-foreground">
                Start Time
              </label>
              <Input
                id="startTime"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="endTime" className="text-sm font-medium text-foreground">
                End Time
              </label>
              <Input
                id="endTime"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <label htmlFor="link" className="text-sm font-medium text-foreground">
              Application Link
            </label>
            <Input
              id="link"
              type="url"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              placeholder="https://..."
            />
          </div>
          <div className="flex justify-end">
            <Button 
              type="submit" 
              disabled={isSubmitting}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {isSubmitting ? "Creating..." : "Add Event"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
} 