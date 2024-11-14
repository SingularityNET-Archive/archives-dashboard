// ../context/MeetingSummariesContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { MeetingSummary, ActionItem, Decision } from '../types/meetings';

interface MeetingSummariesContextType {
  summaries: MeetingSummary[];
  loading: boolean;
  error: Error | null;
  fetchMeetingSummaries: () => Promise<void>;
  getActionItems: () => ActionItem[];
  getDecisions: () => Decision[];
}

const MeetingSummariesContext = createContext<MeetingSummariesContextType | undefined>(undefined);

interface MeetingSummariesProviderProps {
  children: React.ReactNode;
  initialData?: MeetingSummary[];
}

export function MeetingSummariesProvider({ children, initialData = [] }: MeetingSummariesProviderProps) {
  const [summaries, setSummaries] = useState<MeetingSummary[]>(initialData);
  const [loading, setLoading] = useState(false);
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

  const fetchMeetingSummaries = async () => {
    const API_KEY = process.env.NEXT_PUBLIC_SERVER_API_KEY;

    setLoading(true);
    try {
      const response = await fetch('/api/getMeetingSummaries', {
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

  useEffect(() => {
    let mounted = true;

    const loadData = async () => {
      if (!Array.isArray(initialData) || initialData.length === 0) {
        setLoading(true);
        try {
          const API_KEY = process.env.NEXT_PUBLIC_SERVER_API_KEY;
          const response = await fetch('/api/getMeetingSummaries', {
            headers: {
              'api_key': API_KEY || '',
            },
          });

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          const data = await response.json();
          if (mounted) {
            setSummaries(Array.isArray(data) ? data : []);
            setError(null);
          }
        } catch (err) {
          if (mounted) {
            setError(err instanceof Error ? err : new Error('An error occurred'));
            console.error('Error fetching meeting summaries:', err);
            setSummaries([]);
          }
        } finally {
          if (mounted) {
            setLoading(false);
          }
        }
      }
    };

    loadData();

    return () => {
      mounted = false;
    };
  }, [initialData]);

  const value = {
    summaries: Array.isArray(summaries) ? summaries : [],
    loading,
    error,
    fetchMeetingSummaries,
    getActionItems,
    getDecisions
  };

  return (
    <MeetingSummariesContext.Provider value={value}>
      {children}
    </MeetingSummariesContext.Provider>
  );
}

export function useMeetingSummaries() {
  const context = useContext(MeetingSummariesContext);
  if (context === undefined) {
    throw new Error('useMeetingSummaries must be used within a MeetingSummariesProvider');
  }
  return context;
}