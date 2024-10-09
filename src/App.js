import React, { useEffect, useRef, useState } from 'react';
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import loadingGif from './assets/img2.gif';

const App = () => {
  const gridApiRef = useRef(null); 
  const [gridApi, setGridApi] = useState(null);

  const columnDefs = [
  
    {
      headerName: "ID",
      field:"id",
      maxWidth: 100,
      cellRenderer: (params) => {
        return params.value !== undefined ? params.value : <img src={loadingGif} alt="loading" style={{width: "100%", height: "60px"}}/>;
      },
    },
    { field: "name", minWidth: 150, filter: true, sortable: true },
    { field: "email", filter: true, sortable: true },
    { field: "phone", minWidth: 150, filter: true, sortable: true },
  ];

  const gridOptions = {
    columnDefs: columnDefs,
    defaultColDef: {
      flex: 1,
      minWidth: 100,
      sortable: true,
    },
    rowBuffer: 5, // Number of extra rows to fetch outside of viewable area
    rowSelection: "multiple",
    rowModelType: "infinite",
    cacheBlockSize: 100, // Number of rows per request block
    maxBlocksInCache: 5, // Limit number of data blocks in cache
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!gridApiRef.current) {
        console.error("Grid API is not available");
        return;
      }

      const dataSource = {
        rowCount: undefined, // Infinite scroll

        getRows: async (params) => {
          console.log("Requesting rows " + params.startRow + " to " + params.endRow);

          const url = new URL(`http://localhost:3004/users`);
          url.searchParams.append('start', params.startRow);
          url.searchParams.append('end', params.endRow);

          try {
            const response = await fetch(url);
            const data = await response.json();

            setTimeout(() => {
              const rowsThisPage = data.slice(params.startRow, params.endRow);
              const lastRow = data.length <= params.endRow ? data.length : -1;
              params.successCallback(rowsThisPage, lastRow);
            }, 10);
          } catch (error) {
            console.error("Error fetching data:", error);
            params.failCallback(); // Fallback for error handling
          }
        },
      };

      gridApi.setGridOption("datasource", dataSource);
    };

    if (gridApi) {
      fetchData();
    }
  }, [gridApi]);

  const onGridReady = (params) => {
    gridApiRef.current = params.api;
    setGridApi(params.api); 
  };

  return (
    <div className="ag-theme-alpine" style={{ height: 600, width: '100%' }}>
      <AgGridReact
        gridOptions={gridOptions}
        onGridReady={onGridReady}
        pagination={true}
        paginationPageSize={50}
      />
    </div>
  );
};

export default App;