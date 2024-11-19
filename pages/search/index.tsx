// pages/search/index.tsx
import { GetServerSideProps } from 'next';
import React, { useState, useEffect, useCallback, useRef } from 'react';
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
import HowToModal from '../../components/modals/HowToModal';
import { MeetingSummariesPageProvider } from '../../components/providers/MeetingSummariesPageProvider';
import { getFilterStateFromUrl, updateUrlWithFilters } from '../../utils/urlParams';
import styles from '../../styles/search.module.css';

interface SearchPageProps {
  initialData: MeetingSummary[];
  initialFilters: FilterState;
  initialTab: 'meetings' | 'actions' | 'decisions';
}

export default function SearchPage({ 
  initialData, 
  initialFilters,
  initialTab,
}: SearchPageProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'meetings' | 'actions' | 'decisions'>(initialTab);
  const [filters, setFilters] = useState<FilterState>(initialFilters);
  const [isInitialized, setIsInitialized] = useState(false);
  const isUserAction = useRef(false);
  const lastUserActionTimestamp = useRef<number>(Date.now());
  const pendingTabChange = useRef<string | null>(null);

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
      const currentTab = pendingTabChange.current || activeTab;
      updateUrlWithFilters(router, filters, currentTab);
      pendingTabChange.current = null;
    }
  }, [filters, activeTab, router, isInitialized]);

  // Handle browser back/forward navigation
  useEffect(() => {
    const handleRouteChange = () => {
      const timeSinceLastUserAction = Date.now() - lastUserActionTimestamp.current;
      if (!isUserAction.current && timeSinceLastUserAction > 500) {
        const newFilters = getFilterStateFromUrl(router.query);
        const newTab = (router.query.tab as 'meetings' | 'actions' | 'decisions') || 'meetings';
        
        setFilters(newFilters);
        setActiveTab(newTab);
      }
      isUserAction.current = false;
    };

    router.events.on('routeChangeComplete', handleRouteChange);
    return () => {
      router.events.off('routeChangeComplete', handleRouteChange);
    };
  }, [router]);

  const handleTabChange = (tab: 'meetings' | 'actions' | 'decisions') => {
    if (tab === activeTab) return;
    
    isUserAction.current = true;
    lastUserActionTimestamp.current = Date.now();
    pendingTabChange.current = tab;
    
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
  };

  return (
    <MeetingSummariesPageProvider initialData={initialData}>
      <div className={styles.searchPage}>
        {process.env.NEXT_PUBLIC_NODE_ENV === 'test' && (
          <DataDebugger filters={filters} />
        )}
        
        <div className={styles.filtersSection}>
          <div className={styles.filterControls}>
            <SearchBar 
              value={filters.search} 
              onChange={(value) => handleFilterChange({ search: value })}
              placeholder={`Search ${
                activeTab === 'meetings' 
                  ? 'meetings'
                  : activeTab === 'actions' 
                    ? 'action items'
                    : 'decisions'
              }...`}
            />
            <HowToModal />
          </div>
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
            className={`${styles.tab} ${activeTab === 'meetings' ? styles.active : ''}`}
            onClick={() => handleTabChange('meetings')}
            aria-selected={activeTab === 'meetings'}
            role="tab"
          >
            Meetings
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
            className={`${styles.tab} ${activeTab === 'decisions' ? styles.active : ''}`}
            onClick={() => handleTabChange('decisions')}
            aria-selected={activeTab === 'decisions'}
            role="tab"
          >
            Decisions
          </button>
        </div>
          
        <div className={styles.tableContainer}>
          {activeTab === 'meetings' ? (
            <MeetingsTable 
              filters={filters} 
              initialData={initialData} 
            />
          ) : activeTab === 'actions' ? (
            <ActionItemsTable 
              filters={filters} 
              initialData={initialData} 
            />
          ) : (
            <DecisionsTable 
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
    const initialTab = (context.query.tab as 'meetings' | 'actions' | 'decisions') || 'meetings';

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
        initialTab: 'meetings',
      },
    };
  }
}