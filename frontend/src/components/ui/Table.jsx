import React, { useState, useEffect } from "react";
import clsx from "clsx";
import {
  Eye,
  Edit2,
  RotateCcw,
  Trash2,
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ChevronDown
} from "lucide-react";

const formatLabel = (label = "") => {
  const cleaned = label
    .replace(/([A-Z])/g, " $1")
    .replace(/[_-]+/g, " ")
    .trim()
    .toLowerCase();
  if (!cleaned) return label;
  return cleaned
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

export default function Table({
  title,
  subtitle,
  columns,
  data,
  actions,
  searchable = true,
  filterOptions = null,
  pageSizeOptions = [10, 25, 50, 100],
  defaultPageSize = 10,
  containerClassName = "",
  manualPagination = false,
  page: controlledPage = 1,
  pageSize: controlledPageSize = null,
  total = null,
  onPageChange = null,
  onPageSizeChange = null,
  isLoading = false,
  searchPlaceholder = "Search staff by name or email...",
}) {
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(defaultPageSize);
  const [responsiveView, setResponsiveView] = useState(false);
  const [filters, setFilters] = useState({});
  const [showFilterDropdown, setShowFilterDropdown] = useState(null);

  useEffect(() => {
    if (manualPagination) {
      setCurrentPage(controlledPage || 1);
    }
  }, [manualPagination, controlledPage]);

  useEffect(() => {
    if (manualPagination && controlledPageSize) {
      setPageSize(controlledPageSize);
    }
  }, [manualPagination, controlledPageSize]);

  // Check if we're in mobile view
  useEffect(() => {
    const checkResponsive = () => {
      setResponsiveView(window.innerWidth < 768);
    };

    checkResponsive();
    window.addEventListener("resize", checkResponsive);

    return () => {
      window.removeEventListener("resize", checkResponsive);
    };
  }, []);
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showFilterDropdown && !event.target.closest('.filter-dropdown')) {
        setShowFilterDropdown(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showFilterDropdown]);

  // Filter data based on search term and filters
  const filteredData = data.filter((row) => {
    // Search filter
    const matchesSearch = search === "" || 
      Object.values(row).some(val => 
        String(val).toLowerCase().includes(search.toLowerCase())
      );
    
    // Apply additional filters if any
    const matchesFilters = Object.entries(filters).every(([key, value]) => {
      if (!value || value === "All") return true;
      return String(row[key]) === String(value);
    });
    
    return matchesSearch && matchesFilters;
  });

  // Calculate pagination
  const effectivePageSize = pageSize || defaultPageSize;
  const totalEntries = manualPagination
    ? total ?? filteredData.length
    : filteredData.length;
  const displayPage = manualPagination ? (controlledPage || 1) : currentPage;
  const totalPages =
    totalEntries === 0 ? 0 : Math.ceil((totalEntries || 0) / (effectivePageSize || 1));
  const startIndex = (displayPage - 1) * effectivePageSize;
  const paginatedData = manualPagination
    ? filteredData
    : filteredData.slice(startIndex, startIndex + effectivePageSize);

  // Handle page changes
  const goToPage = (page) => {
    if (totalPages === 0) return;
    if (page < 1) page = 1;
    if (page > totalPages) page = totalPages;
    if (manualPagination) {
      onPageChange?.(page);
    } else {
      setCurrentPage(page);
    }
  };

  // Handle page size change
  const handlePageSizeChange = (e) => {
    const newSize = parseInt(e.target.value);
    setPageSize(newSize);
    if (manualPagination) {
      onPageSizeChange?.(newSize);
    } else {
      setCurrentPage(1); // Reset to first page when changing page size
    }
  };
  
  // Handle filter change
  const handleFilterChange = (filterName, value) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: value
    }));
    setCurrentPage(1); // Reset to first page when filter changes
    setShowFilterDropdown(null); // Close dropdown after selection
  };

  // Toggle filter dropdown
  const toggleFilterDropdown = (filterName) => {
    setShowFilterDropdown(showFilterDropdown === filterName ? null : filterName);
  };

  return (
    <div
      className={clsx(
        "card-default p-4 sm:p-6 rounded-xl shadow-sm bg-white",
        containerClassName
      )}
    >
      {/* Header */}
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between">
          <div>
            {title && <h2 className="text-xl font-bold text-neutral-800">{title}</h2>}
            {subtitle && <p className="text-sm text-neutral-500 mt-1">{subtitle}</p>}
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          {searchable && (
            <div className="relative flex-grow">
              <Search className="absolute left-3 top-3 h-4 w-4 text-neutral-400" />
              <input
                type="text"
                placeholder={searchPlaceholder}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input-primary pl-9 w-full h-10 bg-neutral-100 border-0"
              />
            </div>
          )}

          {filterOptions && (
            <div className="flex gap-3">
              {Object.entries(filterOptions).map(([filterName, options]) => (
                <div key={filterName} className="relative filter-dropdown">
                  <button 
                    className="input-primary h-10 px-4 flex items-center justify-between gap-2 min-w-[140px] bg-neutral-100 border-0"
                    onClick={() => toggleFilterDropdown(filterName)}
                  >
                    <span>
                      {filters[filterName] ||
                        `All ${formatLabel(filterName)}`}
                    </span>
                    <ChevronDown className="h-4 w-4 text-neutral-500" />
                  </button>
                  
                  {showFilterDropdown === filterName && (
                    <div className="absolute z-10 mt-1 w-full bg-white rounded-lg shadow-lg border border-neutral-200 py-1">
                      <div 
                        className="px-3 py-2 hover:bg-neutral-100 cursor-pointer flex items-center"
                        onClick={() => handleFilterChange(filterName, null)}
                      >
                        <span className={`mr-2 ${!filters[filterName] ? "text-primary-DEFAULT" : ""}`}>
                          {!filters[filterName] && "✓"}
                        </span>
                        All {formatLabel(filterName)}
                      </div>
                      {options.map((option) => (
                        <div 
                          key={option}
                          className="px-3 py-2 hover:bg-neutral-100 cursor-pointer flex items-center"
                          onClick={() => handleFilterChange(filterName, option)}
                        >
                          <span className={`mr-2 ${filters[filterName] === option ? "text-primary-DEFAULT" : ""}`}>
                            {filters[filterName] === option && "✓"}
                          </span>
                          {option}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Table for desktop view */}
      {!responsiveView ? (
        <div className="overflow-x-auto -mx-4 sm:-mx-6">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                {columns.map((col) => (
                  <th 
                    key={col.key} 
                    className="px-4 sm:px-6 py-3 text-left text-sm font-medium text-neutral-700 border-b border-neutral-200"
                  >
                    {col.label}
                  </th>
                ))}
                {actions && (
                  <th className="px-4 sm:px-6 py-3 text-left text-sm font-medium text-neutral-700 border-b border-neutral-200">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {paginatedData.length > 0 ? (
                paginatedData.map((row, idx) => (
                  <tr 
                    key={idx} 
                    className="hover:bg-neutral-50 transition-colors duration-150 border-b border-neutral-100"
                  >
                    {columns.map((col) => (
                      <td 
                        key={col.key} 
                        className="px-4 sm:px-6 py-4 text-sm text-neutral-700"
                      >
                        {col.render ? col.render(row[col.key], row) : row[col.key]}
                      </td>
                    ))}
                    {actions && (
                      <td className="px-4 sm:px-6 py-4 text-sm">
                        <div className="flex items-center gap-3 justify-end">
                          {actions.map((Action, actionIdx) => (
                            <span key={actionIdx}>
                              <Action row={row} />
                            </span>
                          ))}
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              ) : (
                <tr>
                  <td 
                    colSpan={actions ? columns.length + 1 : columns.length} 
                    className="px-4 sm:px-6 py-8 text-center text-sm text-neutral-500"
                  >
                    No data found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      ) : (
        // Mobile card view
        <div className="space-y-4">
          {paginatedData.length > 0 ? (
            paginatedData.map((row, idx) => (
              <div
                key={idx}
                className="bg-white p-4 rounded-lg border border-neutral-200 shadow-sm"
              >
                {columns.map((col) => (
                  <div
                    key={col.key}
                    className="flex justify-between py-2 border-b border-neutral-100 last:border-0"
                  >
                    <span className="text-sm font-medium text-neutral-500">
                      {col.label}
                    </span>
                    <span className="text-sm text-neutral-800">
                      {col.render ? col.render(row[col.key], row) : row[col.key]}
                    </span>
                  </div>
                ))}
                {actions && (
                  <div className="mt-3 pt-3 border-t border-neutral-200 flex justify-end gap-2">
                    {actions.map((Action, actionIdx) => (
                      <span key={actionIdx}>
                        <Action row={row} />
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="bg-white p-6 rounded-lg border border-neutral-200 text-center text-neutral-500">
              No data found
            </div>
          )}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 0 && (
        <div className="mt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="text-sm text-neutral-500">
            Showing {totalEntries === 0 ? 0 : startIndex + 1} to{" "}
            {Math.min(startIndex + effectivePageSize, totalEntries)} of{" "}
            {totalEntries} entries
          </div>

          <div className="flex items-center gap-2">
            <select 
              value={pageSize} 
              onChange={handlePageSizeChange}
              className="input-primary text-sm py-1.5 pl-2 pr-8"
              disabled={isLoading}
            >
              {pageSizeOptions.map((size) => (
                <option key={size} value={size}>
                  {size} per page
                </option>
              ))}
            </select>

            <div className="flex items-center">
              <button
                onClick={() => goToPage(1)}
                disabled={displayPage === 1 || isLoading}
                className="p-1 rounded-md hover:bg-neutral-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronsLeft className="h-5 w-5 text-neutral-600" />
              </button>
              <button
                onClick={() => goToPage(displayPage - 1)}
                disabled={displayPage === 1 || isLoading}
                className="p-1 rounded-md hover:bg-neutral-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="h-5 w-5 text-neutral-600" />
              </button>

              <span className="px-3 py-1 text-sm">
                {displayPage} / {totalPages}
              </span>

              <button
                onClick={() => goToPage(displayPage + 1)}
                disabled={displayPage === totalPages || isLoading}
                className="p-1 rounded-md hover:bg-neutral-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="h-5 w-5 text-neutral-600" />
              </button>
              <button
                onClick={() => goToPage(totalPages)}
                disabled={displayPage === totalPages || isLoading}
                className="p-1 rounded-md hover:bg-neutral-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronsRight className="h-5 w-5 text-neutral-600" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
