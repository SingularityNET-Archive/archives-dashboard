// pages/search/index.tsx
import { GetServerSideProps } from 'next';
import { useState } from 'react';
import { MeetingSummary, FilterState } from '../../types/meetings';
import SearchBar from '../../components/filters/SearchBar';
import WorkgroupFilter from '../../components/filters/WorkgroupFilter';
import StatusFilter from '../../components/filters/StatusFilter';
import DateFilter from '../../components/filters/DateFilter';
import AssigneeFilter from '../../components/filters/AssigneeFilter';
import EffectFilter from '../../components/filters/EffectFilter';
import DecisionsTable from '../../components/tables/DecisionsTable';
import ActionItemsTable from '../../components/tables/ActionItemsTable';
import MeetingsTable from '../../components/tables/MeetingsTable';
import DataDebugger from '../../components/debug/DataDebugger';
import { MeetingSummariesPageProvider } from '../../components/providers/MeetingSummariesPageProvider';
import styles from '../../styles/search.module.css';

interface SearchPageProps {
  initialData: MeetingSummary[];
}

export default function SearchPage({ initialData }: SearchPageProps) {
  const [activeTab, setActiveTab] = useState<'decisions' | 'actions' | 'meetings'>('decisions');
  const [filters, setFilters] = useState<FilterState>({
    workgroup: '',
    status: '',
    search: '',
    date: '', 
    dateRange: { start: '', end: '' },
    assignee: '',
    effect: ''
  });

  const handleTabChange = (tab: 'decisions' | 'actions' | 'meetings') => {
    setActiveTab(tab);
    // Clear the search and status when switching tabs
    setFilters(prev => ({ ...prev, search: '', status: '' }));
  };

  return (
    <MeetingSummariesPageProvider initialData={initialData}>
      <div className={styles.searchPage}>
        <DataDebugger filters={filters} />
        <div className={styles.filtersSection}>
          <SearchBar 
            value={filters.search} 
            onChange={(value) => setFilters(prev => ({ ...prev, search: value }))}
            placeholder={`Search ${
              activeTab === 'decisions' 
                ? 'decisions' 
                : activeTab === 'actions' 
                  ? 'action items'
                  : 'meetings'
            }...`}
          />
          <div className={styles.filterGroup}>
            <WorkgroupFilter 
              value={filters.workgroup}
              onChange={(value) => setFilters(prev => ({ ...prev, workgroup: value }))}
            />
            <DateFilter
              value={filters.date}
              onChange={(value) => setFilters(prev => ({ ...prev, date: value }))}
            />
            {activeTab === 'decisions' && (
              <EffectFilter 
                value={filters.effect}
                onChange={(value) => setFilters(prev => ({ ...prev, effect: value }))}
              />
            )}
            {activeTab === 'actions' && (
              <>
                <StatusFilter 
                  value={filters.status}
                  onChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
                />
                <AssigneeFilter 
                  value={filters.assignee}
                  onChange={(value) => setFilters(prev => ({ ...prev, assignee: value }))}
                />
              </>
            )}
          </div>
        </div>
        <div className={styles.tabs}>
          <button 
            className={`${styles.tab} ${activeTab === 'decisions' ? styles.active : ''}`}
            onClick={() => handleTabChange('decisions')}
          >
            Decisions
          </button>
          <button 
            className={`${styles.tab} ${activeTab === 'actions' ? styles.active : ''}`}
            onClick={() => handleTabChange('actions')}
          >
            Action Items
          </button>
          <button 
            className={`${styles.tab} ${activeTab === 'meetings' ? styles.active : ''}`}
            onClick={() => handleTabChange('meetings')}
          >
            Meetings
          </button>
        </div>
          
        {activeTab === 'decisions' ? (
          <DecisionsTable filters={filters} initialData={initialData} />
        ) : activeTab === 'actions' ? (
          <ActionItemsTable filters={filters} initialData={initialData} />
        ) : (
          <MeetingsTable filters={filters} initialData={initialData} />
        )}
      </div>
    </MeetingSummariesPageProvider>
  );
}

export const getServerSideProps: GetServerSideProps = async () => {
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