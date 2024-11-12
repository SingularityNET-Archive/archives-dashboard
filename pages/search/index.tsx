// pages/search/index.tsx
import { useState } from 'react';
import SearchBar from '../../components/filters/SearchBar';
import WorkgroupFilter from '../../components/filters/WorkgroupFilter';
import StatusFilter from '../../components/filters/StatusFilter';
import DecisionsTable from '../../components/tables/DecisionsTable';
import ActionItemsTable from '../../components/tables/ActionItemsTable';

export default function SearchPage() {
  const [activeTab, setActiveTab] = useState<'decisions' | 'actions'>('decisions');
  const [filters, setFilters] = useState({
    workgroup: '',
    status: '',
    search: '',
    dateRange: { start: '', end: '' }
  });

  return (
    <div className="search-page">
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
        <DecisionsTable filters={filters} />
      ) : (
        <ActionItemsTable filters={filters} />
      )}
    </div>
  );
}