// components/providers/MeetingSummariesPageProvider.tsx
import { ReactNode } from 'react';
import { MeetingSummariesProvider } from '../../context/MeetingSummariesContext';
import { MeetingSummary } from '../../types/meetings';

interface MeetingSummariesPageProviderProps {
  children: ReactNode;
  initialData?: MeetingSummary[];
}

export function MeetingSummariesPageProvider({ children, initialData }: MeetingSummariesPageProviderProps) {
  return (
    <MeetingSummariesProvider initialData={initialData}>
      {children}
    </MeetingSummariesProvider>
  );
}