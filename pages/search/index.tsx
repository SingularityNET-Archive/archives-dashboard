// pages/search/index.tsx
import { GetServerSideProps } from 'next';
import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
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
import { getFilterStateFromUrl, updateUrlWithFilters } from '../../utils/urlParams';
import styles from '../../styles/search.module.css';

interface SearchPageProps {
  initialData: MeetingSummary[];
  initialFilters: FilterState;
  initialTab: 'decisions' | 'actions' | 'meetings';
  //error?: string;
}

export default function SearchPage({ 
  initialData, 
  initialFilters,
  initialTab,
  //error 
}: SearchPageProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'decisions' | 'actions' | 'meetings'>(initialTab);
  const [filters, setFilters] = useState<FilterState>(initialFilters);
  const [isInitialized, setIsInitialized] = useState(false);
  const isUserAction = React.useRef(false);
  const lastUserActionTimestamp = React.useRef<number>(Date.now());

  // Memoized filter update handler
  const handleFilterChange = useCallback((updates: Partial<FilterState>) => {
    isUserAction.current = true;
    lastUserActionTimestamp.current = Date.now();
    setFilters(prev => ({ ...prev, ...updates }));
  }, []);

  // Handle URL updates when filters or tab changes
  useEffect(() => {
    if (!isInitialized) {
      setIsInitialized(true);
      return;
    }

    if (isUserAction.current) {
      updateUrlWithFilters(router, filters, activeTab);
    }
  }, [filters, activeTab, router, isInitialized]);

  // Handle browser back/forward navigation
  useEffect(() => {
    const handleRouteChange = () => {
      // Ignore route changes that happen immediately after user actions
      const timeSinceLastUserAction = Date.now() - lastUserActionTimestamp.current;
      if (!isUserAction.current && timeSinceLastUserAction > 500) {
        const newFilters = getFilterStateFromUrl(router.query);
        const newTab = (router.query.tab as 'decisions' | 'actions' | 'meetings') || 'decisions';
        
        setFilters(newFilters);
        setActiveTab(newTab);
      }
    };

    router.events.on('routeChangeComplete', handleRouteChange);
    return () => {
      router.events.off('routeChangeComplete', handleRouteChange);
    };
  }, [router]);

  const handleTabChange = (tab: 'decisions' | 'actions' | 'meetings') => {
    isUserAction.current = true;
    lastUserActionTimestamp.current = Date.now();
    setActiveTab(tab);
    setFilters(prev => ({ 
      ...prev, 
      search: '', 
      status: '',
      effect: '',
      assignee: '',
      workgroup: prev.workgroup,
      date: prev.date,
      dateRange: prev.dateRange
    }));
    setTimeout(() => {
      isUserAction.current = false;
    }, 500);
  };

  /*if (error) {
    return (
      <div className={styles.errorContainer}>
        <h2>Error Loading Data</h2>
        <p>{error}</p>
      </div>
    );
  }*/

  return (
    <MeetingSummariesPageProvider initialData={initialData}>
      <div className={styles.searchPage}>
        {process.env.NEXT_PUBLIC_NODE_ENV === 'test' && (
          <DataDebugger filters={filters} />
        )}
        
        <div className={styles.filtersSection}>
          <SearchBar 
            value={filters.search} 
            onChange={(value) => handleFilterChange({ search: value })}
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
              onChange={(value) => handleFilterChange({ workgroup: value })}
            />
            <DateFilter
              value={filters.date}
              onChange={(value) => handleFilterChange({ date: value })}
            />
            {activeTab === 'decisions' && (
              <EffectFilter 
                value={filters.effect}
                onChange={(value) => handleFilterChange({ effect: value })}
              />
            )}
            {activeTab === 'actions' && (
              <>
                <StatusFilter 
                  value={filters.status}
                  onChange={(value) => handleFilterChange({ status: value })}
                />
                <AssigneeFilter 
                  value={filters.assignee}
                  onChange={(value) => handleFilterChange({ assignee: value })}
                />
              </>
            )}
          </div>
        </div>

        <div className={styles.tabs}>
          <button 
            className={`${styles.tab} ${activeTab === 'decisions' ? styles.active : ''}`}
            onClick={() => handleTabChange('decisions')}
            aria-selected={activeTab === 'decisions'}
            role="tab"
          >
            Decisions
          </button>
          <button 
            className={`${styles.tab} ${activeTab === 'actions' ? styles.active : ''}`}
            onClick={() => handleTabChange('actions')}
            aria-selected={activeTab === 'actions'}
            role="tab"
          >
            Action Items
          </button>
          <button 
            className={`${styles.tab} ${activeTab === 'meetings' ? styles.active : ''}`}
            onClick={() => handleTabChange('meetings')}
            aria-selected={activeTab === 'meetings'}
            role="tab"
          >
            Meetings
          </button>
        </div>
          
        <div className={styles.tableContainer}>
          {activeTab === 'decisions' ? (
            <DecisionsTable 
              filters={filters} 
              initialData={initialData} 
            />
          ) : activeTab === 'actions' ? (
            <ActionItemsTable 
              filters={filters} 
              initialData={initialData} 
            />
          ) : (
            <MeetingsTable 
              filters={filters} 
              initialData={initialData} 
            />
          )}
        </div>
      </div>
    </MeetingSummariesPageProvider>
  );
}

export const getServerSideProps: GetServerSideProps<SearchPageProps> = async (context) => {
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
    
    // Get initial filters and tab from URL parameters
    const initialFilters = getFilterStateFromUrl(context.query);
    const initialTab = (context.query.tab as 'decisions' | 'actions' | 'meetings') || 'decisions';

    return {
      props: {
        initialData: data,
        initialFilters,
        initialTab,
      },
    };
  } catch (error) {
    console.error('Error fetching meeting summaries:', error);
    return {
      props: {
        initialData: [],
        initialFilters: {
          workgroup: '',
          status: '',
          search: '',
          date: '',
          dateRange: { start: '', end: '' },
          assignee: '',
          effect: ''
        },
        initialTab: 'decisions',
        //error: error instanceof Error ? error.message : 'An error occurred',
      },
    };
  }
};