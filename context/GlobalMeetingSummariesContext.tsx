// context/GlobalMeetingSummariesContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { MeetingSummary, ActionItem, Decision } from '../types/meetings';

interface GlobalMeetingSummariesContextType {
  summaries: MeetingSummary[];
  loading: boolean;
  error: Error | null;
  getActionItems: () => ActionItem[];
  getDecisions: () => Decision[];
}

const GlobalMeetingSummariesContext = createContext<GlobalMeetingSummariesContextType | undefined>(undefined);

export function GlobalMeetingSummariesProvider({ children }: { children: React.ReactNode }) {
  const [summaries, setSummaries] = useState<MeetingSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

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
        const response = await fetch(`${baseUrl}/api/getMeetingSummaries`, {
          headers: {
            'api_key': API_KEY || '',
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        setSummaries(Array.isArray(data) ? data : []);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('An error occurred'));
        console.error('Error fetching meeting summaries:', err);
        setSummaries([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <GlobalMeetingSummariesContext.Provider 
      value={{ summaries, loading, error, getActionItems, getDecisions }}
    >
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