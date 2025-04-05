// context/GlobalMeetingSummariesContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { MeetingSummary, ActionItem, Decision } from '../types/meetings';

interface GlobalMeetingSummariesContextType {
  summaries: MeetingSummary[];
  loading: boolean;
  error: Error | null;
  getActionItems: () => ActionItem[];
  getDecisions: () => Decision[];
  lastFetchedAt: string | null;
}

const GlobalMeetingSummariesContext = createContext<GlobalMeetingSummariesContextType | undefined>(undefined);

const LAST_FETCHED_KEY = 'meetingSummaries_lastFetchedAt';

export function GlobalMeetingSummariesProvider({ children }: { children: React.ReactNode }) {
  const [summaries, setSummaries] = useState<MeetingSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [lastFetchedAt, setLastFetchedAt] = useState<string | null>(null);

  const getActionItems = (): ActionItem[] => {
    if (!Array.isArray(summaries)) return [];

    return summaries.flatMap(summary => {
      if (!summary?.summary?.agendaItems) return [];

      return summary.summary.agendaItems.flatMap(agenda => {
        if (!agenda?.actionItems) return [];

        return agenda.actionItems.map(item => ({
          ...item,
          workgroup: summary.summary.workgroup,
          workgroup_id: summary.summary.workgroup_id
        }));
      });
    });
  };

  const getDecisions = (): Decision[] => {
    if (!Array.isArray(summaries)) return [];

    return summaries.flatMap(summary => {
      if (!summary?.summary?.agendaItems) return [];

      return summary.summary.agendaItems.flatMap(agenda => {
        if (!agenda?.decisionItems) return [];

        return agenda.decisionItems.map(item => ({
          ...item,
          workgroup: summary.summary.workgroup,
          workgroup_id: summary.summary.workgroup_id,
          date: summary.summary.meetingInfo.date
        }));
      });
    });
  };

  useEffect(() => {
    const fetchData = async () => {
      const API_KEY = process.env.NEXT_PUBLIC_SERVER_API_KEY;
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

      try {
        // Ensure we're getting fresh data by adding timestamp to URL to bypass any CDN or browser caching
        const timestamp = new Date().getTime();
        const url = `${baseUrl}/api/getMeetingSummaries?_=${timestamp}`;

        const response = await fetch(url, {
          headers: {
            'api_key': API_KEY || '',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          },
          cache: 'no-store',
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        setSummaries(Array.isArray(data) ? data : []);

        // Set and store the current timestamp
        const now = new Date().toISOString();
        setLastFetchedAt(now);

        // Save to localStorage if available
        if (typeof window !== 'undefined') {
          localStorage.setItem(LAST_FETCHED_KEY, now);
        }

        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('An error occurred'));
        console.error('Error fetching meeting summaries:', err);
        setSummaries([]);
      } finally {
        setLoading(false);
      }
    };

    // Load the last fetched timestamp from localStorage on initialization
    if (typeof window !== 'undefined') {
      const storedTimestamp = localStorage.getItem(LAST_FETCHED_KEY);
      if (storedTimestamp) {
        setLastFetchedAt(storedTimestamp);
      }
    }

    fetchData();
  }, []);

  return (
    <GlobalMeetingSummariesContext.Provider value={{
      summaries,
      loading,
      error,
      getActionItems,
      getDecisions,
      lastFetchedAt
    }}>
      {children}
    </GlobalMeetingSummariesContext.Provider>
  );
}

export function useGlobalMeetingSummaries() {
  const context = useContext(GlobalMeetingSummariesContext);
  if (context === undefined) {
    throw new Error('useGlobalMeetingSummaries must be used within a GlobalMeetingSummariesProvider');
  }
  return context;
}