// 'use client'
// import React, { Fragment, useState, useEffect, useRef } from 'react';
// import { Input as AntdInput, Form } from 'antd';
// import { GrChapterAdd } from 'react-icons/gr';
// import styled from 'styled-components';
// import { v4 as uuidv4 } from 'uuid';
// import DynamicModal from './DynamicModal';
// import DynamicTable from './BrowseTable';
// import { parseCookies } from 'nookies';
// import { fetchActivityBrowse, fetchActivityBrowses } from '@services/cycleTimeService';
// import { fetchResource, fetchResourceType } from '@services/equResourceService';
// import { useTranslation } from 'react-i18next';
// import debounce from 'lodash/debounce';

// const { Item } = Form;

// const StyledItem = styled(Item)`
//   > div {
//     width: 100%;
//     text-align: left;
//   }

//   border-radius: 0.4rem;
//   margin-bottom: 5px !important;

//   & .ant-form-item-label {
//     display: block;
//     width: 40%;
//     text-align: center;
//   }

//   & .ant-form-item-label > label > span {
//     font-weight: 600 !important;
//     position: relative;
//     font-size: 14px;
//     line-height: 1.3;
//     letter-spacing: 0.03em;
//   }

//   & .ant-row {
//     flex-flow: nowrap !important;
//   }
// `;

// const AntdInputStyle = styled(AntdInput)`
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

//   .ant-input-affix-wrapper-focused {
//     box-shadow: none;
//     border-right-width: 0px !important;
//   }

//   &.ant-input {
//     font-weight: 500 !important;
//     padding: 8px 11px !important;
//     color: black !important;
//   }

//   &.ant-input[disabled] {
//     color: #545454;
//     font-size: 1rem;
//     font-weight: 500;
//     text-align: left;
//   }
// `;

// interface UiConfig {
//   label?: string;
//   tabledataApi?: string;
//   okButtonVisible?: boolean;
//   selectEventCall?: boolean;
//   multiSelect: boolean;
//   tableTitle?: string;
//   cancelButtonVisible?: boolean;
//   pagination?: false | {
//     current: number;
//     pageSize: number;
//     total: number;
//   };
//   selectEventApi?: string;
//   filtering?: boolean;
//   sorting?: boolean;
//   tableDataSeviceApi?: string;
// }

// interface DynamicBrowseProps {
//   uiConfig: UiConfig;
//   initial: string | undefined;
//   onSelectionChange?: (values: DataRow[],inputValue1:string) => void;
//   setOnChangeValue?: (callback: (newValues: string) => void) => void;
//   setUpdate?: () => void;
//   style?: React.CSSProperties;
//   isDisable?: boolean;
//   selectedInput?: number;
//   onBlur?: () => void;
// }


// interface DataRow {
//   id: string;
//   [key: string]: any;
// }


// export const DynamicBrowse: React.FC<DynamicBrowseProps> = ({ uiConfig, onSelectionChange, initial, setOnChangeValue, setUpdate, style, isDisable, selectedInput, onBlur }) => {
//   const { t } = useTranslation();
//   const [modalOpen, setModalOpen] = useState(false);
//   const [selectedRows, setSelectedRows] = useState<DataRow[]>([]);
//   const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
//   const [inputValue, setInputValue] = useState<string>('');
//   const [inputValue1, setInputValue1] = useState<string>('');
//   const [tableData, setTableData] = useState<DataRow[]>([]);
//   const [columns, setColumns] = useState<any[]>([]);
//   const processResource = (resource) => {
//     if(resource === null){
//       return [];
//     }
//     if (uiConfig.selectEventApi === "resource" || uiConfig.selectEventApi === "activity") {
   
      
//       return resource.map(row => {
//         return {
//           id: uuidv4(),
//           ...row
//         };
//       });
//     } else if (uiConfig.tabledataApi === "pcuheader-service") {
//       // Handle pcuheader-service data
      
//       if (Array.isArray(resource)) {
//         return resource.map(row => {
//           return {
//             id: uuidv4(),
//             pcuBO: row.pcuBO,
//             shopOrderBO: row.shopOrderBO, 
//             itemBO: row.itemBO
//           };
//         });
//       }
//     } else {
  
      
//       for (const key in resource) {
//         if (Array.isArray(resource[key])) {
//           return resource[key].map(row => {
//             return {
//               id: uuidv4(),
//               ...row
//             };
//           });
//         }
//       }
//     }
//     throw new Error('Unexpected data format');
//   };

//   const firstInputRef = useRef<any>(null);

//   // useEffect(() => {
//   //   if (selectedInput === 0) {
//   //     // Try multiple methods to ensure selection works
//   //     const selectInput = () => {
//   //       const inputElement = document.querySelector('.ant-input') as HTMLInputElement;
//   //       if (inputElement) {
//   //         inputElement.focus();
//   //         inputElement.select();
//   //         // For some browsers, select() might not work immediately
//   //         setTimeout(() => {
//   //           inputElement.setSelectionRange(0, inputElement.value.length);
//   //         }, 0);
//   //       }
//   //     };

//   //     // Try immediately
//   //     selectInput();
      
//   //     // Also try after a short delay to ensure DOM is ready
//   //     const timeoutId = setTimeout(selectInput, 100);
      
//   //     return () => clearTimeout(timeoutId);
//   //   }
//   // }, [selectedInput, inputValue]); // Add inputValue as dependency to ensure it runs when value changes

//   useEffect(() => {
//     if (modalOpen && (uiConfig.tabledataApi || uiConfig.tableDataSeviceApi)) {
//       const fetchBrowseData = async () => {
//         const cookies = parseCookies();
//         const site = cookies.site;
//         const userId = cookies.rl_user_id;
//         const url = uiConfig.tabledataApi;
//         const newUrl = uiConfig.selectEventApi;
//         try {
//           let resource;
//           if (uiConfig.tableDataSeviceApi) {
//             resource = await fetchActivityBrowses(site, userId, url);
            
            
//           }
//           else if(uiConfig.tableTitle === "Select Resource Type") {
//             resource = await fetchResourceType(site, userId, url , newUrl);
//             console.log('call');
            
//           }
//            else {
//             resource = await fetchResource(site, userId, url,newUrl);
//           }

//            // Process the resource to add IDs and handle any array in the object
//            const dataWithIds = processResource(resource);

//            // Derive columns from the data
//            const keys = Object.keys(dataWithIds[0] || {});
//            const newColumns = keys
//            .filter(key => key !== 'id')
//            .map(key => ({
//              title: t(key),
//              dataIndex: key,
//              render: (text) => (typeof text === 'boolean' ? (text ? 'True' : 'False') : text), // Render boolean values
//            }));
//         const filteredItems = dataWithIds.filter(item => {
//       // Check if any value in the item object contains inputValue
//       return Object.values(item).some(value =>
//         value !== null && value.toString().toLowerCase().includes(inputValue.toLowerCase())
//       );
//     });
//           setTableData(filteredItems);
//           setColumns(newColumns);

//           if (initial) {
//             const initialSelection = dataWithIds.find(row => {
//               const firstKey = Object.keys(row).find(key => key !== 'id');
//               return firstKey && row[firstKey] === initial;
//             });
//             if (initialSelection) {
//               setSelectedRows([initialSelection]);
//               setSelectedRowKeys([initialSelection.id]);
//               // setInputValue(initialSelection[Object.keys(initialSelection)[1]]);
//             }
//           }

//         } catch (error) {
//           console.error('Error fetching data:', error);
//         }
//       };

//       fetchBrowseData();
//     }
    
//   }, [modalOpen, uiConfig.tabledataApi, uiConfig.tableDataSeviceApi, initial]);

//   useEffect(() => {
//     if (!modalOpen) {
//       setInputValue(initial || '');
//       setInputValue1(initial || '');
//     }
//   }, [initial]);

//   // Modified useEffect to run on important prop changes
//   useEffect(() => {
//     if (firstInputRef.current && !isDisable && selectedInput === 0) {
//       firstInputRef.current.focus();
//       firstInputRef.current.select();
//     }

//   }, [initial, selectedInput]);

//   const handleCancel = () => {
//     setModalOpen(false);
//   };
//   const handleReset = () => {
//     setSelectedRows([]);
//     setSelectedRowKeys([]);
//     setInputValue('');
//     setInputValue1('');
//     onSelectionChange([], '');
//   };
//   const handleRowSelectionChange = (selectedRowKeys: React.Key[], selectedRows: DataRow[]) => {
//     try {
//       setSelectedRowKeys(selectedRowKeys);
//       setSelectedRows(selectedRows);
//       const values = selectedRows.map(row => row[Object.keys(row)[1]]).join(', ');
//       setInputValue(values);
//       setInputValue1(values);
//       onSelectionChange([...selectedRows.map(row => ({...row, inputValue}))],inputValue1);
//       if (selectedRows.length > 0) {
//         setModalOpen(false);
//       }
//       if (uiConfig.selectEventCall) {
        
//         setModalOpen(false);
//       }
//     } catch (error) {
//       console.error('Error in handleRowSelectionChange:', error);
//     }
//   };

//   const handleRowSelect = (id: string, value: string | null) => {
//     try {
//       const selectedRow = tableData.find(row => row.id === id);
     
//       if (selectedRow) {
//         const nextKey = Object.keys(selectedRow).find(key => key !== 'id');
//         if (nextKey) {
//           const valueToAdd = selectedRow[nextKey] || '';
//           setInputValue(valueToAdd[0].operationId);
          
//           if (uiConfig.multiSelect) {
//             const newRows = [...selectedRows];
//             const existingRowIndex = newRows.findIndex(row => row.id === id);
//             if (existingRowIndex > -1) {
//               newRows.splice(existingRowIndex, 1);
//             } else {
//               newRows.push(selectedRow);
//             }
//             setSelectedRows(newRows);
//             setInputValue(newRows.map(row => row[nextKey] || '').join(', '));
//             setInputValue1(newRows.map(row => row[nextKey] || '').join(', '));
//           } else {
//             setSelectedRows([selectedRow]);
//             setInputValue(valueToAdd);
//             setInputValue1(valueToAdd);
//           }
//         }
//       }
      
//     } catch (error) {
//       console.error('Error in handleRowSelect:', error);
//     }
//   };

//   const handleInputChange = debounce((e: React.ChangeEvent<HTMLInputElement>) => {
//     const newValue = e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, '');
//     setInputValue1(newValue);
    
//     setUpdate?.();
//     setInputValue(newValue);
//     // setOnChangeValue?.(newValue);
//     if(selectedRows.length==1){
//       onSelectionChange(selectedRows,newValue);
//     }
//     else  {
//       onSelectionChange([],newValue);
//     }

//     if (newValue === '') {
//       setSelectedRows([]);
//       setSelectedRowKeys([]);
      
//       setInputValue("");
//       setInputValue1("");
//       onSelectionChange([],newValue);

//     } else {
//       const cookies = parseCookies();
//       const site = cookies.site;
//       const userId = cookies.rl_user_id;
//       const url = uiConfig.tabledataApi;
     
//       const newUrl = uiConfig.selectEventApi;
//       const fetchBrowseData = async () => {
//         let resource;
//         if (uiConfig.tableDataSeviceApi) {
//           resource = await fetchActivityBrowses(site, userId, url);
          
          
//         } else {
//           resource = await fetchResource(site, userId, url,newUrl);
         
//         }

//          // Process the resource to add IDs and handle any array in the object
//          const dataWithIds = processResource(resource);

//          // Derive columns from the data
//          const keys = Object.keys(dataWithIds[0] || {});
//          const newColumns = keys
//            .filter(key => key !== 'id')
//            .map(key => ({
//             //  title: key.charAt(0).toUpperCase() + key.slice(1),
//             title: t(key),
//              dataIndex: key
//            }));
//       const filteredItems = dataWithIds.filter(item => {
//     // Check if any value in the item object contains inputValue
//     return Object.values(item).some(value =>
//       value !== null && value.toString().toLowerCase().includes(newValue.toLowerCase())
//     );
//   });
//   if(filteredItems.length===1){
//     onSelectionChange(filteredItems,newValue);
//   }
  
// }
// fetchBrowseData()
      
//     }
    
//   });
  



//   const rowSelection = {
//     selectedRowKeys,
//     onChange: handleRowSelectionChange,
//     type: uiConfig.multiSelect ? 'checkbox' : 'radio' as 'checkbox' | 'radio',
//   };
 

//   // Function to handle suffix click event
//   const handleSuffixClick = () => {
//     setModalOpen(true); // Open the modal
//     // filterData(); 
//   };

//   return (
//     <StyledItem
//       label={
//         uiConfig?.label && (
//           <Fragment>
//             <label>
//               {uiConfig?.label}&nbsp;
//             </label>
//           </Fragment>
//         )
//       }
//     >
//       <AntdInputStyle
//         style={style}
//         value={inputValue} // Bind the input value to reflect selection
//         onChange={(e) => {
//           handleInputChange(e);
//           setInputValue1(e.target.value);
//         }} // Allow manual input changes
//         disabled = {isDisable}
//         ref={firstInputRef}
//         onBlur={onBlur}
//         suffix={<GrChapterAdd style={{ cursor: 'pointer' }} onClick={handleSuffixClick} />}
//       />

//       <DynamicModal
//         width={'70%'}
//         visible={modalOpen}
//         onCancel={handleCancel}
//         onReset={handleReset}
//         title={uiConfig.tableTitle}
//         okButtonVisible={uiConfig.okButtonVisible}
//         cancelButtonVisible={uiConfig.cancelButtonVisible}
//       >
//         <DynamicTable
//           dataSource={tableData}
//           columns={columns}
//           uiConfig={{
//             multiSelect: uiConfig.multiSelect,
//             pagination: uiConfig.pagination,
//           }}
//           rowSelection={rowSelection}
//           onRowSelect={handleRowSelect}
//         />
//       </DynamicModal>
//     </StyledItem>
//   );
// };
