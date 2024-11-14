// components/providers/MeetingSummariesPageProvider.tsx
import { ReactNode } from 'react';
import { MeetingSummariesProvider } from '../../context/MeetingSummariesContext';

interface MeetingSummariesPageProviderProps {
  children: ReactNode;
  initialData?: any;
}

export function MeetingSummariesPageProvider({ children, initialData }: MeetingSummariesPageProviderProps) {
  return (
    <MeetingSummariesProvider initialData={initialData}>
      {children}
    </MeetingSummariesProvider>
  );
}