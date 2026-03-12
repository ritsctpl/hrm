// 'use client'
// import React, { useState, useEffect, useRef } from 'react';
// import { Input as AntdInput, Modal, Table, Button, Space } from 'antd';
// import { GrChapterAdd } from 'react-icons/gr';
// import styled from 'styled-components';
// import { v4 as uuidv4 } from 'uuid';
// import debounce from 'lodash/debounce';
// import { browserApi } from '@services/componentBuilderService';
// import { parseCookies } from 'nookies';
// import { buildPayloadFromMapping } from '@modules/mfrScreen/utils/bomSync';

// const StyledInput = styled(AntdInput)`
//   border-radius: 0.4rem;
//   box-shadow: none;

//   ::placeholder {
//     font-size: 14px !important;
//     font-weight: 500 !important;
//   }

//   :focus {
//     border-color: #57a8e9;
//     outline: 0;
//     -webkit-box-shadow: 0 0 0 2px rgba(87,168,233, .2);
//     box-shadow: 0 0 0 2px rgba(87,168,233, .2);
//   }

//   &.ant-input {
//     padding: 8px 11px !important;
//     color: black !important;
//   }

//   &.ant-input[disabled] {
//     color: #545454;
//     font-size: 1rem;
//     text-align: left;
//   }
// `;

// const StyledModal = styled(Modal)`
//   .ant-modal-content {
//     border-radius: 8px;
//     height: 80vh;
//     display: flex;
//     flex-direction: column;
//   }

//   .ant-modal-header {
//     border-radius: 8px 8px 0 0;
//     flex-shrink: 0;
//   }

//   .ant-modal-body {
//     flex: 1;
//     overflow: hidden;
//     display: flex;
//     flex-direction: column;
//     padding: 0;
//   }

//   .ant-modal-footer {
//     flex-shrink: 0;
//   }
// `;

// const StyledTable = styled(Table)`
//   .ant-table-thead > tr > th {
//     background-color: #f0f2f5;
//     font-weight: 600;
//   }

//   .ant-table-tbody > tr {
//     cursor: pointer;
    
//     &:hover {
//       background-color: #f5f5f5;
//     }
//   }

//   .ant-table-row-selected {
//     background-color: #e6f7ff !important;
//   }
// `;

// const SearchContainer = styled.div`
//   position: sticky;
//   top: 0;
//   z-index: 10;
//   background: white;
//   padding: 16px;
//   border-bottom: 1px solid #f0f0f0;
//   flex-shrink: 0;
// `;

// const TableContainer = styled.div`
//   flex: 1;
//   overflow: auto;
//   padding: 16px;
// `;

// // ========================= INTERFACES =========================

// export interface BrowseConfig {
//     ref?: React.RefObject<any>;
//     /** API endpoint to fetch data */
//     endpoint: string;

//     /** HTTP method for external APIs (default: 'POST' for internal, 'GET' for external) */
//     method?: 'GET' | 'POST';

//     /** Search configuration for smart search functionality */
//     searchConfig?: {
//         /** Enable smart search (default: false) */
//         enabled: boolean;
//         /** API endpoint to search all data when local search returns no results */
//         searchAllEndpoint: string;
//         /** Field name to send as search parameter (e.g., 'item', 'name') */
//         searchTerm: string;
//     };

//     /** Display label for the input field */
//     label?: string;

//     /** Modal title */
//     modalTitle?: string;

//     /** Enable multi-select (checkbox) or single-select (radio) */
//     multiSelect?: boolean;

//     /** Initial selected value(s) */
//     initialValue?: string | string[];

//     /** Enable sorting in table */
//     sorting?: boolean;

//     /** Enable filtering/search */
//     filtering?: boolean;

//     /** Pagination configuration */
//     pagination?: false | {
//         pageSize?: number;
//     };

//     /** Columns to display in the table (if not provided, will auto-generate from data) */
//     columns?: BrowseColumn[];

//     /** Field to use as display value in input (default: first non-id field) */
//     displayField?: string;

//     /** Field to use as unique key (default: 'id' or will generate) */
//     keyField?: string;

//     /** Minimum characters required to trigger search */
//     minSearchLength?: number;

//     /** Custom data transformer function */
//     dataTransformer?: (data: any) => any[];

//     /** Disable the input */
//     disabled?: boolean;

//     /** Placeholder text */
//     placeholder?: string;

//     /** Auto-select when only one match is found (default: false) */
//     autoSelectSingleMatch?: boolean;

//     /** Filter data to only show items where field starts with this value (e.g., '3' to show items starting with 3) */
//     startsWith?: string;

//     /** Specific field to apply startsWith filter (required when startsWith is provided) */
//     startsWithField?: string;
// }

// export interface BrowseColumn {
//     /** Column title */
//     title: string;

//     /** Data field key */
//     dataIndex: string;

//     /** Column key (optional) */
//     key?: string;

//     /** Enable sorting for this column */
//     sorter?: boolean | ((a: any, b: any) => number);

//     /** Custom render function */
//     render?: (value: any, record: any, index: number) => React.ReactNode;

//     /** Column width */
//     width?: number | string;
// }

// export interface DynamicBrowseProps {
//     /** Reference to the input element */
//     ref?: React.RefObject<any>;
//     /** Browse configuration */
//     config: BrowseConfig;

//     payload?: any;

//     /** Template data for finding fields across all components */
//     templateData?: any;
    
//     /** Object values for finding field values across all components */
//     objectValues?: any;

//     /** Callback when selection changes */
//     onSelectionChange?: (selectedRows: any[], inputValue: string) => void;

//     /** Callback when input value changes (manual typing) */
//     onInputChange?: (value: string) => void;

//     /** Custom styles for the input */
//     style?: React.CSSProperties;

//     /** Input blur event */
//     onBlur?: () => void;

//     /** Auto-focus the input */
//     autoFocus?: boolean;
// }

// interface DataRow {
//     id: string;
//     [key: string]: any;
// }

// // ========================= COMPONENT =========================

// export const DynamicBrowse: React.FC<DynamicBrowseProps> = ({
//     ref,
//     config,
//     payload,
//     templateData,
//     objectValues,
//     onSelectionChange,
//     onInputChange,
//     style,
//     onBlur,
//     autoFocus = false,
// }) => {
//     const [modalOpen, setModalOpen] = useState(false);
//     const [selectedRows, setSelectedRows] = useState<DataRow[]>([]);
//     const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
//     const [inputValue, setInputValue] = useState<string>('');
//     const [tableData, setTableData] = useState<DataRow[]>([]);
//     const [allData, setAllData] = useState<DataRow[]>([]);
//     const [columns, setColumns] = useState<any[]>([]);
//     const [loading, setLoading] = useState(false);
//     const [modalSearchTerm, setModalSearchTerm] = useState<string>('');
//     const [lastSearchTerm, setLastSearchTerm] = useState<string>(''); // Track if we searched all
//     const [isSearchingAll, setIsSearchingAll] = useState(false); // Track if currently searching all
//     const inputRef = useRef<any>(null);

//     const {
//         endpoint,
//         method,
//         searchConfig,
//         label,
//         modalTitle = 'Select',
//         multiSelect = false,
//         initialValue,
//         sorting = true,
//         filtering = true,
//         pagination = { pageSize: 10 },
//         columns: configColumns,
//         displayField,
//         keyField = 'id',
//         dataTransformer,
//         disabled = false,
//         placeholder,
//         autoSelectSingleMatch = false,
//         startsWith,
//         startsWithField
//     } = config;
//     // ========================= DATA PROCESSING =========================

//     /**
//      * Processes raw API response to extract array data
//      * Handles both direct arrays and objects containing arrays
//      */
//     const extractArrayFromResponse = (response: any): any[] => {
//         if (Array.isArray(response)) {
//             return response;
//         }

//         if (typeof response === 'object' && response !== null) {
//             // Find the first array property
//             for (const key in response) {
//                 if (Array.isArray(response[key])) {
//                     return response[key];
//                 }
//             }
//         }

//         return [];
//     };

//     /**
//      * Apply startsWith filter if configured
//      */
//     const applyStartsWithFilter = (data: any[]): any[] => {
//         if (!startsWith || !startsWithField) {
//             return data;
//         }

//         const startsWithLower = startsWith.toLowerCase();

//         return data.filter(row => {
//             const fieldValue = row[startsWithField];
//             if (fieldValue !== null && fieldValue !== undefined) {
//                 return String(fieldValue).toLowerCase().startsWith(startsWithLower);
//             }
//             return false;
//         });
//     };

//     /**
//      * Adds unique IDs to data rows if not present
//      */
//     const addIdsToData = (data: any[]): DataRow[] => {
//         return data.map((row, index) => {
//             if (!row[keyField]) {
//                 return {
//                     id: row.id || uuidv4(),
//                     ...row
//                 };
//             }
//             return {
//                 ...row,
//                 id: row[keyField]
//             };
//         });
//     };

//     /**
//      * Generates columns from data if not provided in config
//      */
//     const generateColumns = (data: DataRow[]): any[] => {
//         if (!data || data.length === 0) return [];

//         const sampleRow = data[0];
//         const keys = Object.keys(sampleRow).filter(key => key !== 'id');

//         return keys.map(key => ({
//             title: key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' '),
//             dataIndex: key,
//             key: key,
//             sorter: sorting ? (a: any, b: any) => {
//                 const aVal = a[key];
//                 const bVal = b[key];

//                 if (typeof aVal === 'string') {
//                     return aVal.localeCompare(bVal);
//                 }
//                 if (typeof aVal === 'number') {
//                     return aVal - bVal;
//                 }
//                 return 0;
//             } : false,
//             render: (value: any) => {
//                 if (typeof value === 'boolean') {
//                     return value ? 'Yes' : 'No';
//                 }
//                 if (value === null || value === undefined) {
//                     return '-';
//                 }
//                 return String(value);
//             }
//         }));
//     };

//     /**
//      * Gets the display value for a row
//      */
//     const getDisplayValue = (row: DataRow): string => {
//         if (displayField && row[displayField]) {
//             return String(row[displayField]);
//         }

//         // Use first non-id field
//         const keys = Object.keys(row).filter(key => key !== 'id');
//         if (keys.length > 0) {
//             return String(row[keys[0]]);
//         }

//         return '';
//     };

//     // ========================= DATA FETCHING =========================

//     /**
//      * Fetches data from the API endpoint
//      */
//     const fetchData = async (searchTermValue?: string): Promise<DataRow[]> => {
//         try {
//             setLoading(true);

//             // Determine which endpoint to use
//             const useEndpoint = searchTermValue && searchConfig?.enabled && searchConfig?.searchAllEndpoint 
//                 ? searchConfig.searchAllEndpoint 
//                 : endpoint;

//             // Resolve dynamic payload references using the existing utility
//             const resolvedPayload = templateData && objectValues 
//                 ? buildPayloadFromMapping(payload || {}, templateData, objectValues)
//                 : payload || {};

//             // Add search term to payload if searching all
//             const finalPayload = searchTermValue && searchConfig?.enabled && searchConfig?.searchAllEndpoint
//                 ? { ...resolvedPayload, [searchConfig.searchTerm]: searchTermValue }
//                 : resolvedPayload;

//             let data: any;

//             // Check if endpoint is external (starts with http:// or https://)
//             if (endpoint.startsWith('http://') || endpoint.startsWith('https://')) {
//                 // For external APIs, use the specified method or default to GET
//                 const httpMethod = method || 'GET';
                
//                 try {
//                     if (httpMethod === 'GET') {
//                         const response = await fetch(endpoint, {
//                             method: 'GET',
//                             headers: {
//                                 'Accept': 'application/json',
//                             },
//                             mode: 'cors'
//                         });
//                         if (!response.ok) {
//                             throw new Error(`HTTP error! status: ${response.status}`);
//                         }
//                         data = await response.json();
//                     } else {
//                         // For external POST requests
//                         const response = await fetch(endpoint, {
//                             method: 'POST',
//                             headers: {
//                                 'Content-Type': 'application/json',
//                                 'Accept': 'application/json',
//                             },
//                             mode: 'cors',
//                             body: JSON.stringify(finalPayload)
//                         });
//                         if (!response.ok) {
//                             throw new Error(`HTTP error! status: ${response.status}`);
//                         }
//                         data = await response.json();
//                     }
//                 } catch (error) {
//                     // Handle CORS errors specifically
//                     if (error instanceof Error && error.message.includes('CORS')) {
//                         console.error('CORS error when accessing external API:', endpoint, error);
//                         throw new Error(`CORS error: Cannot access external API ${endpoint}. The API server needs to enable CORS or use a proxy.`);
//                     }
//                     throw error;
//                 }
//             } else {
//                 // For internal APIs, use browserApi (POST request)
//                 data = await browserApi(useEndpoint, { site: parseCookies().site, ...finalPayload });
//             }
            
//             // Use custom transformer if provided
//             let arrayData = dataTransformer ? dataTransformer(data) : extractArrayFromResponse(data);

//             // Add IDs
//             const dataWithIds = addIdsToData(arrayData);

//             // Apply startsWith filter if configured
//             const filteredData = applyStartsWithFilter(dataWithIds);

//             return filteredData;
//         } catch (error) {
//             console.error('Error fetching data:', error);
//             return [];
//         } finally {
//             setLoading(false);
//         }
//     };

//     // ========================= EFFECTS =========================

//     /**
//      * Update input value when initialValue changes
//      */
//     useEffect(() => {
//         // Update input value whenever initialValue changes
//         const newValue = initialValue
//             ? (Array.isArray(initialValue) ? initialValue.join(', ') : initialValue)
//             : '';
//         setInputValue(newValue);
//     }, [initialValue]);

//     /**
//      * Auto-focus input if requested
//      */
//     useEffect(() => {
//         if (autoFocus && inputRef.current && !disabled) {
//             inputRef.current.focus();
//             inputRef.current.select();
//         }
//     }, [autoFocus, disabled]);

//     /**
//      * Fetch data when modal opens
//      */
//     useEffect(() => {
//         if (modalOpen) {
//             loadData();
//         }
//     }, [modalOpen]);

//     /**
//      * Update selected rows when modal opens (to highlight previously selected)
//      */
//     useEffect(() => {
//         if (modalOpen && allData.length > 0) {
//             // Only try to match selections if input contains comma (multiple selections)
//             if (inputValue && inputValue.includes(',')) {
//                 // Split comma-separated values to handle multiple selections
//                 const inputValues = inputValue.split(',').map(v => v.trim());
                
//                 const matchedRows = allData.filter(row => {
//                     const displayValue = getDisplayValue(row);
//                     return inputValues.some(val => val === displayValue);
//                 });

//                 if (matchedRows.length > 0) {
//                     setSelectedRowKeys(matchedRows.map(row => row.id));
//                     setSelectedRows(matchedRows);
//                 }
//             }
//         }
//     }, [modalOpen, allData]);

//     /**
//      * Load data and apply filters
//      */
//     const loadData = async () => {
//         const data = await fetchData();
//         setAllData(data);

//         // Generate columns if not provided
//         const cols = configColumns || generateColumns(data);
//         setColumns(cols);

//         // Determine what to show based on input value
//         const hasCommaSelections = inputValue && inputValue.includes(',');
        
//         if (hasCommaSelections) {
//             // Show only selected items when reopening with comma-separated values
//             const inputValues = inputValue.split(',').map(v => v.trim());
//             const selectedData = data.filter(row => {
//                 const displayValue = getDisplayValue(row);
//                 return inputValues.some(val => val === displayValue);
//             });
//             setTableData(selectedData);
//         } else {
//             // Apply search filter for typed search terms
//             applyModalSearch(modalSearchTerm, data);
//         }
//     };

//     /**
//      * Apply modal search filter with smart search strategy
//      */
//     const applyModalSearch = async (searchTerm: string, data: DataRow[]) => {
//         if (!searchTerm || searchTerm.trim().length === 0) {
//             // No search term - reset to initial data
//             if (lastSearchTerm && searchConfig?.enabled) {
//                 // We had searched all before, reload top 50
//                 const freshData = await fetchData();
//                 setAllData(freshData);
//                 setTableData(freshData);
//                 setLastSearchTerm('');
//                 setIsSearchingAll(false);
//             } else {
//                 setTableData(data);
//             }
//             return;
//         }

//         const searchLower = searchTerm.toLowerCase();

//         // Check if smart search is enabled
//         if (!searchConfig?.enabled || !searchConfig?.searchAllEndpoint) {
//             // No smart search, just filter locally
//             const filteredData = data.filter(row => {
//                 return Object.values(row).some(value =>
//                     value !== null &&
//                     value !== undefined &&
//                     String(value).toLowerCase().includes(searchLower)
//                 );
//             });
//             setTableData(filteredData);
//             return;
//         }

//         // Smart search strategy with searchConfig
//         if (lastSearchTerm) {
//             // We previously searched all items
//             if (searchTerm.startsWith(lastSearchTerm)) {
//                 // Current search is more specific, filter from current results
//                 const filtered = data.filter(row => {
//                     return Object.values(row).some(value =>
//                         value !== null &&
//                         value !== undefined &&
//                         String(value).toLowerCase().includes(searchLower)
//                     );
//                 });

//                 if (filtered.length === 0) {
//                     // No results, make new API call
//                     await searchAllData(searchTerm);
//                 } else {
//                     setTableData(filtered);
//                 }
//             } else {
//                 // Search term changed direction, make new API call
//                 await searchAllData(searchTerm);
//             }
//         } else {
//             // No previous API search, try filtering from current data first
//             const localFiltered = data.filter(row => {
//                 return Object.values(row).some(value =>
//                     value !== null &&
//                     value !== undefined &&
//                     String(value).toLowerCase().includes(searchLower)
//                 );
//             });

//             if (localFiltered.length > 0) {
//                 // Found in current data
//                 setTableData(localFiltered);
//             } else {
//                 // Not found, search all items
//                 await searchAllData(searchTerm);
//             }
//         }
//     };

//     /**
//      * Search all data using searchAllEndpoint
//      */
//     const searchAllData = async (searchTerm: string) => {
//         setIsSearchingAll(true);
//         setLastSearchTerm(searchTerm);
        
//         const data = await fetchData(searchTerm);
//         setAllData(data);
//         setTableData(data);
        
//         setIsSearchingAll(false);
//     };

//     // ========================= HANDLERS =========================

//     /**
//      * Handle input change (manual typing)
//      */
//     const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//         const value = e.target.value;
//         setInputValue(value);

//         // Clear selections if input is cleared
//         if (value === '') {
//             setSelectedRows([]);
//             setSelectedRowKeys([]);
//             onSelectionChange?.([], '');
//         }

//         onInputChange?.(value);

//         // Debounced fetch and filter
//         debouncedFetchAndFilter(value);
//     };

//     /**
//      * Debounced fetch and filter function
//      */
//     const debouncedFetchAndFilter = debounce((value: string) => {
//         // If user types any characters, fetch and filter data
//         if (value.length > 0) {
//             fetchAndFilterData(value);
//         }
//     }, 300);

//     /**
//      * Fetch data and filter by search term
//      */
//     const fetchAndFilterData = async (searchTerm: string) => {
//         const data = await fetchData();
//         const searchLower = searchTerm.toLowerCase();

//         const filteredData = data.filter(row => {
//             return Object.values(row).some(value =>
//                 value !== null &&
//                 value !== undefined &&
//                 String(value).toLowerCase().includes(searchLower)
//             );
//         });

//         // Auto-select if exactly one match and autoSelectSingleMatch is enabled
//         if (autoSelectSingleMatch && filteredData.length === 1) {
//             const row = filteredData[0];
//             setSelectedRows([row]);
//             setSelectedRowKeys([row.id]);
//             const displayValue = getDisplayValue(row);
//             setInputValue(displayValue);
//             onSelectionChange?.([row], displayValue);
//         }
//     };

//     /**
//      * Handle browse button click
//      */
//     const handleBrowseClick = () => {
//         // If user typed something (not comma-separated selected values), use it as search filter
//         const isTypedSearch = inputValue && !inputValue.includes(',');
        
//         if (isTypedSearch) {
//             setModalSearchTerm(inputValue);
//         } else {
//             setModalSearchTerm('');
//         }
        
//         setModalOpen(true);
//     };

//     /**
//      * Handle modal cancel
//      */
//     const handleCancel = () => {
//         setModalOpen(false);
//     };

//     /**
//      * Handle reset button
//      */
//     const handleReset = () => {
//         setSelectedRows([]);
//         setSelectedRowKeys([]);
//         setInputValue('');
//         setModalSearchTerm('');
//         setLastSearchTerm('');
//         setIsSearchingAll(false);
//         onSelectionChange?.([], '');

//         // Reload all data
//         if (allData.length > 0) {
//             setTableData(allData);
//         }
//     };

//     /**
//      * Handle row selection change
//      */
//     const handleRowSelectionChange = (selectedKeys: React.Key[], selected: DataRow[]) => {
//         setSelectedRowKeys(selectedKeys);
//         setSelectedRows(selected);

//         // Update input value
//         const displayValues = selected.map(row => getDisplayValue(row)).join(', ');
//         setInputValue(displayValues);

//         // Notify parent
//         onSelectionChange?.(selected, displayValues);

//         // Close modal if single select and a row is selected
//         if (!multiSelect && selected.length > 0) {
//             setModalOpen(false);
//         }
//     };

//     /**
//      * Handle row click (for single select)
//      */
//     const handleRowClick = (record: DataRow) => {
//         if (!multiSelect) {
//             handleRowSelectionChange([record.id], [record]);
//         }
//     };

//     /**
//      * Handle OK button in modal
//      */
//     const handleOk = () => {
//         setModalOpen(false);
//     };

//     // ========================= ROW SELECTION CONFIG =========================

//     const rowSelection = {
//         selectedRowKeys,
//         onChange: handleRowSelectionChange,
//         type: multiSelect ? ('checkbox' as const) : ('radio' as const),
//     };

//     // ========================= RENDER =========================

//     return (
//         <div style={{ width: '100%' }}>
//             {label && (
//                 <div style={{ marginBottom: 4, fontWeight: 600, fontSize: 14 }}>
//                     {label}
//                 </div>
//             )}

//             <StyledInput
//                 ref={ref}
//                 value={inputValue}
//                 onChange={handleInputChange}
//                 disabled={disabled}
//                 onBlur={() => {
//                     // Call parent onBlur if provided
//                     onBlur?.();
//                     // Also trigger onSelectionChange with current input value when blur (for manual entry)
//                     if (inputValue && selectedRows.length === 0) {
//                         onSelectionChange?.([], inputValue);
//                     }
//                 }}
//                 onKeyDown={(e) => {
//                     // Handle Enter key to confirm manual input
//                     if (e.key === 'Enter' && inputValue && selectedRows.length === 0) {
//                         onSelectionChange?.([], inputValue);
//                     }
//                 }}
//                 placeholder={`${placeholder}`}
//                 style={style}
//                 suffix={
//                     <GrChapterAdd
//                         style={{ cursor: disabled ? 'not-allowed' : 'pointer' }}
//                         onClick={disabled ? undefined : handleBrowseClick}
//                     />
//                 }
//             />

//             <StyledModal
//                 open={modalOpen}
//                 onCancel={handleCancel}
//                 onOk={handleOk}
//                 title={modalTitle}
//                 centered
//                 width="70%"
//                 footer={[
//                     <Button key="reset" onClick={handleReset}>
//                         Reset
//                     </Button>,
//                     <Button key="cancel" onClick={handleCancel}>
//                         Cancel
//                     </Button>,
//                     multiSelect && (
//                         <Button key="ok" type="primary" onClick={handleOk}>
//                             OK
//                         </Button>
//                     ),
//                 ]}
//             >
//                 {filtering && (
//                     <SearchContainer>
//                         <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
//                             <AntdInput
//                                 placeholder="Search in table..."
//                                 value={modalSearchTerm}
//                                 onChange={(e) => {
//                                     const value = e.target.value;
//                                     setModalSearchTerm(value);
//                                     // Debounce the search to avoid too many API calls
//                                     debounce(() => applyModalSearch(value, allData), 500)();
//                                 }}
//                             />
//                             {isSearchingAll && (
//                                 <span style={{ color: '#1890ff', fontSize: '12px', whiteSpace: 'nowrap' }}>
//                                     Searching all...
//                                 </span>
//                             )}
//                             {lastSearchTerm && !isSearchingAll && (
//                                 <span style={{ color: '#52c41a', fontSize: '12px', whiteSpace: 'nowrap' }}>
//                                     Searched all
//                                 </span>
//                             )}
//                         </div>
//                     </SearchContainer>
//                 )}

//                 <TableContainer>
//                     <StyledTable
//                         dataSource={tableData}
//                         columns={columns}
//                         rowSelection={rowSelection}
//                         loading={loading}
//                         pagination={pagination}
//                         rowKey="id"
//                         onRow={(record: DataRow) => ({
//                             onClick: () => handleRowClick(record),
//                         })}
//                         scroll={{ x: 'max-content', y: '50vh' }}
//                     />
//                 </TableContainer>
//             </StyledModal>
//         </div>
//     );
// };

// export default DynamicBrowse;