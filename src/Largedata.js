import React, { useCallback, useMemo, useState } from 'react';
import { ModuleRegistry } from '@ag-grid-community/core';
import { InfiniteRowModelModule } from '@ag-grid-community/infinite-row-model';
import { AgGridReact } from '@ag-grid-community/react';
import '@ag-grid-community/styles/ag-grid.css';
import '@ag-grid-community/styles/ag-theme-quartz.css';

ModuleRegistry.registerModules([InfiniteRowModelModule]);

export default function Largedata() {
  const containerStyle = useMemo(() => ({ width: '100%', height: '600px' }), []);
  const gridStyle = useMemo(() => ({ height: '100%', width: '100%' }), []);
  const [gridApi, setGridApi] = useState(null);

  const [columnDefs] = useState([
    {
      headerName: 'ID',
      field:'id',
      maxWidth: 100,
      valueGetter: 'node.id',
      cellRenderer: (props) => {
        if (props.value !== undefined) {
          return props.value;
        } else {
          return <img src="https://www.ag-grid.com/example-assets/loading.gif" alt="Loading" />;
        }
      },
    },
    { field: "name", minWidth: 150, filter: 'agTextColumnFilter'  },
    { field: "email", minWidth: 150, filter: 'agTextColumnFilter' },
    { field: "phone", minWidth: 150, filter: 'agTextColumnFilter'},
  ]);

  const defaultColDef = useMemo(() => {
    return {
      flex: 1,
      minWidth: 100,
      sortable: true,
      filter: true,
    };
  }, []);

  const onGridReady = useCallback((params) => {
    setGridApi(params.api);

    fetch('http://localhost:3004/users')
      .then((resp) => resp.json())
      .then((data) => {
        const dataSource = {
          getRows: (params) => {
            console.log('Requesting data from server...');
            console.log(params);

            // Simulate server-side operations
            let rowData = [...data]; // Create a copy of the data

            // Apply filtering
            const filterModel = params.filterModel;
            Object.keys(filterModel).forEach(key => {
              const filter = filterModel[key];
              rowData = rowData.filter(row => {
                if (filter.type === 'contains') {
                  return row[key].toString().toLowerCase().includes(filter.filter.toLowerCase());
                }
                if (filter.type === 'equals') {
                  return row[key].toString() === filter.filter;
                }
                // Add more filter types as needed
                return true;
              });
            });

            // Apply sorting
            if (params.sortModel && params.sortModel.length > 0) {
              const { colId, sort } = params.sortModel[0];
              rowData.sort((a, b) => {
                const valueA = a[colId];
                const valueB = b[colId];
                
                if (valueA === valueB) return 0;
                
                if (typeof valueA === 'string' && typeof valueB === 'string') {
                  return sort === 'asc' ? valueA.localeCompare(valueB) : valueB.localeCompare(valueA);
                }
                
                if (valueA < valueB) return sort === 'asc' ? -1 : 1;
                if (valueA > valueB) return sort === 'asc' ? 1 : -1;
                return 0;
              });
            }

            // Apply pagination
            const startRow = params.startRow;
            const endRow = params.endRow;
            const rowsThisPage = rowData.slice(startRow, endRow);
            const lastRow = rowData.length;

            // Return the result to the grid
            setTimeout(() => {
              params.successCallback(rowsThisPage, lastRow);
            }, 10);
          }
        };

        params.api.setGridOption('datasource', dataSource);
      });
  }, []);

  return (
    <div style={containerStyle}>
      <div style={gridStyle} className="ag-theme-quartz">
        <AgGridReact
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          rowModelType={'infinite'}
          cacheBlockSize={50}
          cacheOverflowSize={2}
          maxConcurrentDatasourceRequests={1}
          infiniteInitialRowCount={1000}
          maxBlocksInCache={10}
          onGridReady={onGridReady}
          pagination={true}
          paginationPageSize={50}
          paginationPageSizeSelector={[50,100,200]}
        />
      </div>
    </div>
  );
}