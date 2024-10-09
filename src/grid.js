import React, { useState, useEffect } from 'react';
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';

const App = () => {
  const [rowData, setRowData] = useState([]);
  const [pageSize] = useState(100); // Number of records to fetch/display at a time
  const [currentPage, setCurrentPage] = useState(0);
  const [totalRows, setTotalRows] = useState(0);

  // Fetch data function
  const fetchRowData = async (page) => {
    const response = await fetch(`http://localhost:3004/users?page=${page}&size=${pageSize}`);
    const data = await response.json();
    console.log(data)
    setRowData(data); // Update the state with fetched rows
  };

  useEffect(() => {
    // Fetch the initial data
    fetchRowData(currentPage);
  }, [currentPage]);

  const handleLoadMore = () => {
    if ((currentPage + 1) * pageSize < totalRows) {
      setCurrentPage(currentPage + 1); // Move to the next page
    }
  };

  const columnDefs = [
    { field: 'id', filter: true }, 
    { field: 'name', filter: true  },
    { field: 'email', filter: true  },
    { field: 'phone', filter: true  },
    // Define other columns as needed
  ];

  return (
    <div>
      <div className="ag-theme-alpine" style={{ height: 600, width: 800 }}>
        <AgGridReact
          columnDefs={columnDefs}
          rowData={rowData}
          paginationPageSize={pageSize}
          pagination={true} // Enable pagination if needed
        />
      </div>
      <button onClick={handleLoadMore} disabled={(currentPage + 1) * pageSize >= totalRows}>
        Load More
      </button>
    </div>
  );
};

export default App;
