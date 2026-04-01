"use client";

import { ChevronLeft, ChevronRight, Clock, Wrench } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { PageShell, PageHeader } from "@/components/primitives/page-shell";
import { StatusBadge } from "@/components/primitives/status-badge";

interface CalendarEvent {
  id: string;
  title: string;
  customer: string;
  time: string;
  type: "repair" | "pickup" | "special_order";
}

const MOCK_EVENTS: Record<string, CalendarEvent[]> = {
  "2026-03-24": [
    { id: "1", title: "Full Tune-Up", customer: "James Rodriguez", time: "09:00 AM", type: "repair" },
    { id: "2", title: "Brake Replacement", customer: "Sarah Chen", time: "10:30 AM", type: "repair" },
    { id: "3", title: "Headset Service", customer: "Lisa Park", time: "02:00 PM", type: "repair" },
  ],
  "2026-03-25": [
    { id: "4", title: "Pickup - Trek Domane", customer: "James Rodriguez", time: "05:00 PM", type: "pickup" },
    { id: "5", title: "Chain & Gear Service", customer: "Emma Davis", time: "12:00 PM", type: "repair" },
  ],
  "2026-03-26": [
    { id: "6", title: "BB Service", customer: "David Kim", time: "09:00 AM", type: "repair" },
    { id: "7", title: "Brake Pad Arrival", customer: "Sarah Chen", time: "All Day", type: "special_order" },
  ],
  "2026-03-27": [
    { id: "8", title: "Wheel Build Complete", customer: "Ana Gutierrez", time: "03:00 PM", type: "pickup" },
  ],
};

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function CalendarPage() {
  const [selectedDate, setSelectedDate] = useState("2026-03-24");
  const events = MOCK_EVENTS[selectedDate] || [];

  // Simple week view centered on selected date
  const selectedObj = new Date(selectedDate + "T12:00:00");
  const startOfWeek = new Date(selectedObj);
  startOfWeek.setDate(selectedObj.getDate() - selectedObj.getDay());

  const weekDates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(startOfWeek);
    d.setDate(startOfWeek.getDate() + i);
    return d.toISOString().split("T")[0];
  });

  const prevWeek = () => {
    const d = new Date(selectedDate + "T12:00:00");
    d.setDate(d.getDate() - 7);
    setSelectedDate(d.toISOString().split("T")[0]);
  };
  const nextWeek = () => {
    const d = new Date(selectedDate + "T12:00:00");
    d.setDate(d.getDate() + 7);
    setSelectedDate(d.toISOString().split("T")[0]);
  };

  const typeConfig = {
    repair: { label: "Repair", color: "info" as const },
    pickup: { label: "Pickup", color: "success" as const },
    special_order: { label: "Special Order", color: "warning" as const },
  };

  return (
    <PageShell>
      <PageHeader title="Calendar" description="Scheduled repairs, pickups, and special orders" />

      {/* Week Navigation */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={prevWeek}><ChevronLeft className="h-4 w-4" /></Button>
        <div className="flex items-center gap-1">
          {weekDates.map((date) => {
            const d = new Date(date + "T12:00:00");
            const isSelected = date === selectedDate;
            const hasEvents = !!MOCK_EVENTS[date];
            return (
              <button
                key={date}
                onClick={() => setSelectedDate(date)}
                className={`flex flex-col items-center rounded-lg px-3 py-2 transition-colors min-w-[56px] ${
                  isSelected ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                }`}
              >
                <span className="text-[10px] font-medium uppercase">{DAYS[d.getDay()]}</span>
                <span className="text-lg font-semibold">{d.getDate()}</span>
                {hasEvents && !isSelected && <span className="h-1 w-1 rounded-full bg-primary mt-0.5" />}
              </button>
            );
          })}
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={nextWeek}><ChevronRight className="h-4 w-4" /></Button>
      </div>

      {/* Events for Selected Day */}
      <div className="rounded-lg border bg-card p-5">
        <p className="text-sm font-semibold mb-4">
          {new Date(selectedDate + "T12:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
        </p>

        {events.length > 0 ? (
          <div className="space-y-2">
            {events.map((event) => (
              <div key={event.id} className="flex items-center gap-3 rounded-md border p-3 hover:bg-muted/30 transition-colors cursor-pointer">
                <div className="h-8 w-8 rounded-md bg-primary/8 flex items-center justify-center shrink-0">
                  {event.type === "repair" ? <Wrench className="h-4 w-4 text-primary" /> : <Clock className="h-4 w-4 text-primary" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">{event.title}</p>
                    <StatusBadge status={typeConfig[event.type].color} dot={false}>
                      {typeConfig[event.type].label}
                    </StatusBadge>
                  </div>
                  <p className="text-xs text-muted-foreground">{event.customer}</p>
                </div>
                <span className="text-xs text-muted-foreground shrink-0">{event.time}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-8">No events scheduled for this day.</p>
        )}
      </div>
    </PageShell>
  );
}
