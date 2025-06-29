"use client";

import { useEffect, useState } from "react"
import { useUser } from "@clerk/nextjs"
import Calendar from "react-calendar"
import AddEventDialog from "@/components/AddEventDialog"
import { Card } from "@/components/ui/card"
import { format } from "date-fns"
import { ScrollArea } from "@/components/ui/scroll-area"
import 'react-calendar/dist/Calendar.css'

interface Event {
  _id: string
  title: string
  description: string
  date: Date
  startTime: string
  endTime: string
  createdBy: {
    name: string
    email: string
  }
}

interface NewEvent {
  title: string
  description: string
  date: string
  startTime: string
  endTime: string
  createdBy: {
    name: string
    email: string
  }
}

export default function OpportunitiesPage() {
  const { user } = useUser()
  const [events, setEvents] = useState<Event[]>([])
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [isAddEventOpen, setIsAddEventOpen] = useState(false)
  const [isAlumni, setIsAlumni] = useState(false)

  useEffect(() => {
    // Fetch user role
    const checkUserRole = async () => {
      if (user?.emailAddresses?.[0]?.emailAddress) {
        const response = await fetch(`/api/users?email=${user.emailAddresses[0].emailAddress}`)
        const data = await response.json()
        setIsAlumni(data.role === 'alumni')
      }
    }
    checkUserRole()
  }, [user])

  useEffect(() => {
    // Fetch events
    const fetchEvents = async () => {
      const response = await fetch('/api/opportunities')
      const data = await response.json()
      setEvents(data.map((event: any) => ({
        ...event,
        date: new Date(event.date)
      })))
    }
    fetchEvents()
  }, [])

  const selectedDateEvents = events.filter(event => 
    format(event.date, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd')
  )

  // Function to get events for a specific date
  const getEventsForDate = (date: Date) => {
    return events.filter(event => 
      format(event.date, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
    )
  }

  // Custom tile content to show event indicators
  const tileContent = ({ date, view }: { date: Date; view: string }) => {
    if (view === 'month') {
      const dateEvents = getEventsForDate(date)
      return dateEvents.length > 0 ? (
        <div className="flex justify-center items-center">
          <div className="w-2 h-2 bg-blue-500 rounded-full mt-1" />
        </div>
      ) : null
    }
  }

  return (
    <div className="flex flex-col md:flex-row w-full gap-4 p-4 min-h-screen bg-gray-100">
      <div className="w-full md:w-3/4">
        <Card className="p-4">
          <div className="calendar-container">
            <Calendar
              onChange={(value) => {
                if (value instanceof Date) {
                  setSelectedDate(value)
                  if (isAlumni) {
                    setIsAddEventOpen(true)
                  }
                }
              }}
              value={selectedDate}
              tileContent={tileContent}
              className="w-full rounded-lg shadow-lg"
              tileClassName={({ date }) => {
                const dateEvents = getEventsForDate(date)
                return dateEvents.length > 0 ? 'has-events' : ''
              }}
            />
          </div>
        </Card>
      </div>
      
      <div className="w-full md:w-1/4">
        <Card className="p-4 bg-white shadow-lg">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">
            Events for {format(selectedDate, 'MMMM d, yyyy')}
          </h2>
          <ScrollArea className="h-[calc(100vh-12rem)]">
            <div className="space-y-3 pr-4">
              {selectedDateEvents.length === 0 ? (
                <p className="text-gray-500">No events scheduled for this date</p>
              ) : (
                selectedDateEvents.map((event) => (
                  <Card key={event._id} className="p-4 bg-white border-l-4 border-l-blue-500 shadow-md">
                    <h3 className="font-medium text-lg text-gray-800">{event.title}</h3>
                    <div className="text-sm text-blue-600 mt-2">
                      {event.startTime} - {event.endTime}
                    </div>
                    <p className="text-sm text-gray-600 mt-2">{event.description}</p>
                    <div className="text-xs text-gray-500 mt-3 flex items-center">
                      <span className="inline-block w-2 h-2 bg-blue-500 rounded-full mr-2" />
                      Posted by {event.createdBy.name}
                    </div>
                  </Card>
                ))
              )}
            </div>
          </ScrollArea>
        </Card>
      </div>

      {isAlumni && (
        <AddEventDialog
          open={isAddEventOpen}
          onOpenChange={setIsAddEventOpen}
          selectedDate={selectedDate}
          onEventAdded={(newEvent: NewEvent) => {
            setEvents(prev => [...prev, { ...newEvent, date: new Date(newEvent.date), _id: Math.random().toString() }])
            setIsAddEventOpen(false)
          }}
        />
      )}

      <style jsx global>{`
        .calendar-container {
          width: 100%;
          max-width: 100%;
          background: white;
          border-radius: 8px;
          padding: 16px;
        }
        
        .react-calendar {
          width: 100%;
          border: none;
          font-family: Arial, sans-serif;
        }

        .react-calendar__tile {
          height: 100px;
          display: flex;
          flex-direction: column;
          justify-content: flex-start;
          align-items: center;
          padding: 8px;
          position: relative;
        }

        .react-calendar__tile--now {
          background: #e3f2fd !important;
        }

        .react-calendar__tile--active {
          background: #bbdefb !important;
          color: black !important;
        }

        .react-calendar__tile.has-events {
          font-weight: bold;
          color: #1976d2;
        }

        .react-calendar__tile:enabled:hover,
        .react-calendar__tile:enabled:focus {
          background-color: #e3f2fd;
        }

        .react-calendar__month-view__days__day--weekend {
          color: #d32f2f;
        }
      `}</style>
    </div>
  )
} 