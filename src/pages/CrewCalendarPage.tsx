import React, { useState, useEffect, useCallback } from 'react';
import { CalendarService } from '../lib/calendarService';

interface CalendarEvent {
  id: string;
  quoteId: string;
  title: string;
  description: string;
  startDate: string;
  startTime: string;
  endDate?: string;
  endTime?: string;
  location: string;
  notes: string[];
}

export default function CrewCalendarPage() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('week');

  const loadCalendarEvents = useCallback(async () => {
    setLoading(true);
    try {
      const today = new Date(selectedDate);
      const startDate = today.toISOString().split('T')[0];
      
      let endDate = new Date(today);
      if (viewMode === 'day') {
        // Same day
      } else if (viewMode === 'week') {
        endDate.setDate(endDate.getDate() + 7);
      } else {
        endDate.setMonth(endDate.getMonth() + 1);
      }
      const endDateStr = endDate.toISOString().split('T')[0];
      
      const calendarEvents = await CalendarService.getCalendarEvents(startDate, endDateStr);
      setEvents(calendarEvents);
    } catch (error) {
      console.error('Error loading calendar events:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedDate, viewMode]);

  useEffect(() => {
    loadCalendarEvents();
  }, [loadCalendarEvents]);

  const eventsForDate = (date: string) => {
    return events.filter(e => e.startDate === date);
  };

  const upcomingEvents = events
    .filter(e => {
      const eventDate = new Date(e.startDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return eventDate >= today;
    })
    .sort((a, b) => {
      const dateA = new Date(`${a.startDate}T${a.startTime}`);
      const dateB = new Date(`${b.startDate}T${b.startTime}`);
      return dateA.getTime() - dateB.getTime();
    })
    .slice(0, 10);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F3F4F6]">
      {/* Header */}
      <header className="bg-white border-b border-[#E5E7EB]">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Crew Calendar</h1>
              <p className="text-sm text-[#374151]">Your scheduled moves</p>
            </div>
            <div className="flex items-center space-x-3">
              <select
                value={viewMode}
                onChange={(e) => setViewMode(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="day">Day</option>
                <option value="week">Week</option>
                <option value="month">Month</option>
              </select>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Upcoming Jobs */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Upcoming Jobs</h2>
          {upcomingEvents.length === 0 ? (
            <div className="bg-white rounded-xl shadow p-6 text-center">
              <p className="text-[#374151]">No upcoming jobs scheduled</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {upcomingEvents.map((event) => (
                <div key={event.id} className="bg-white rounded-xl shadow p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">{event.title}</h3>
                      <p className="text-sm text-[#374151] mt-1">
                        {new Date(event.startDate).toLocaleDateString('en-US', { 
                          weekday: 'short', 
                          month: 'short', 
                          day: 'numeric' 
                        })} at {event.startTime}
                      </p>
                    </div>
                  </div>
                  
                  <div className="space-y-2 mt-4">
                    <div>
                      <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">Location</p>
                      <p className="text-sm text-gray-900 dark:text-white">{event.location}</p>
                    </div>
                    
                    {event.notes.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">Job Notes</p>
                        <ul className="space-y-1">
                          {event.notes.map((note, idx) => (
                            <li key={idx} className="text-sm text-[#374151] flex items-start">
                              <span className="mr-2">•</span>
                              <span>{note}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-[#E5E7EB]">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Job ID: {event.quoteId}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Calendar View */}
        {viewMode === 'week' && (
          <div className="bg-white rounded-xl shadow">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Week View
              </h2>
              <div className="grid grid-cols-7 gap-2">
                {Array.from({ length: 7 }).map((_, idx) => {
                  const date = new Date(selectedDate);
                  date.setDate(date.getDate() + (idx - new Date(selectedDate).getDay()));
                  const dateStr = date.toISOString().split('T')[0];
                  const dayEvents = eventsForDate(dateStr);
                  
                  return (
                    <div key={idx} className="border border-[#E5E7EB] rounded-lg p-3 min-h-[200px]">
                      <p className="text-sm font-semibold text-[#374151] mb-2">
                        {date.toLocaleDateString('en-US', { weekday: 'short' })}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                        {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </p>
                      <div className="space-y-2">
                        {dayEvents.map((event) => (
                          <div key={event.id} className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded text-xs">
                            <p className="font-semibold text-blue-900 dark:text-blue-100">{event.startTime}</p>
                            <p className="text-blue-700 dark:text-blue-300 truncate">{event.title}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Export Calendar Button */}
        {events.length > 0 && (
          <div className="mt-6 bg-white rounded-xl shadow p-6">
            <button
              onClick={() => {
                const icsContent = CalendarService.exportToICS(events);
                const blob = new Blob([icsContent], { type: 'text/calendar' });
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = 'crew-calendar.ics';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
              }}
              className="px-4 py-2 bg-accent hover:bg-accent-dark text-white rounded-lg text-sm font-semibold"
            >
              Export Calendar to Device
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

