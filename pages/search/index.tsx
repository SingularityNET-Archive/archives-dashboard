// pages/search/index.tsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/router';
import { FilterState } from '../../types/meetings';
import { useGlobalMeetingSummaries } from '../../context/GlobalMeetingSummariesContext';
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
import { getFilterStateFromUrl, updateUrlWithFilters } from '../../utils/urlParams';
import styles from '../../styles/search.module.css';

export default function SearchPage() {
  const router = useRouter();
  const { summaries, loading } = useGlobalMeetingSummaries();
  
  // Initialize state based on URL parameters
  const [activeTab, setActiveTab] = useState<'meetings' | 'actions' | 'decisions'>(
    (router.query.tab as 'meetings' | 'actions' | 'decisions') || 'meetings'
  );
  const [filters, setFilters] = useState<FilterState>(getFilterStateFromUrl(router.query));
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Refs for handling navigation and user actions
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

  // Show loading state while data is being fetched
  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner}>Loading...</div>
      </div>
    );
  }

  return (
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
          <MeetingsTable filters={filters} />
        ) : activeTab === 'actions' ? (
          <ActionItemsTable filters={filters} />
        ) : (
          <DecisionsTable filters={filters} />
        )}
      </div>
    </div>
  );
}