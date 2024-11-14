// pages/search/index.tsx
import { GetServerSideProps } from 'next';
import { useState } from 'react';
import { MeetingSummary, FilterState } from '../../types/meetings';
import SearchBar from '../../components/filters/SearchBar';
import WorkgroupFilter from '../../components/filters/WorkgroupFilter';
import StatusFilter from '../../components/filters/StatusFilter';
import DecisionsTable from '../../components/tables/DecisionsTable';
import ActionItemsTable from '../../components/tables/ActionItemsTable';
import DataDebugger from '../../components/debug/DataDebugger';
import { MeetingSummariesPageProvider } from '../../components/providers/MeetingSummariesPageProvider';

interface SearchPageProps {
  initialData: MeetingSummary[];
}

export default function SearchPage({ initialData }: SearchPageProps) {
  const [activeTab, setActiveTab] = useState<'decisions' | 'actions'>('decisions');
  const [filters, setFilters] = useState<FilterState>({
    workgroup: '',
    status: '',
    search: '',
    dateRange: { start: '', end: '' }
  });

  return (
    <MeetingSummariesPageProvider initialData={initialData}>
      <div className="search-page">
        <DataDebugger filters={filters} />
        <div className="filters-section">
          <SearchBar 
            value={filters.search} 
            onChange={(value) => setFilters(prev => ({ ...prev, search: value }))} 
          />
          <div className="filter-group">
            <WorkgroupFilter 
              value={filters.workgroup}
              onChange={(value) => setFilters(prev => ({ ...prev, workgroup: value }))}
            />
            <StatusFilter 
              value={filters.status}
              onChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
            />
          </div>
        </div>
        
        <div className="tabs">
          <button 
            className={`tab ${activeTab === 'decisions' ? 'active' : ''}`}
            onClick={() => setActiveTab('decisions')}
          >
            Decisions
          </button>
          <button 
            className={`tab ${activeTab === 'actions' ? 'active' : ''}`}
            onClick={() => setActiveTab('actions')}
          >
            Action Items
          </button>
        </div>
  
        {activeTab === 'decisions' ? (
          <DecisionsTable filters={filters} initialData={initialData} />
        ) : (
          <ActionItemsTable filters={filters} initialData={initialData} />
        )}
      </div>
    </MeetingSummariesPageProvider>
  );
}

export const getServerSideProps: GetServerSideProps = async () => {
  const API_KEY = process.env.NEXT_PUBLIC_SERVER_API_KEY;

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
    return {
      props: {
        initialData: data,
      },
    };
  } catch (error) {
    console.error('Error fetching meeting summaries:', error);
    return {
      props: {
        initialData: [],
        error: error instanceof Error ? error.message : 'An error occurred',
      },
    };
  }
};