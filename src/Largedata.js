"use client"

import React, { useCallback, useMemo, useState, useEffect } from 'react'
import { ModuleRegistry } from '@ag-grid-community/core'
import { InfiniteRowModelModule } from '@ag-grid-community/infinite-row-model'
import { AgGridReact } from '@ag-grid-community/react'
import '@ag-grid-community/styles/ag-grid.css'
import '@ag-grid-community/styles/ag-theme-quartz.css'
import spinner from './assets/img2.gif'

ModuleRegistry.registerModules([InfiniteRowModelModule])

export default function LargeData() {
  const containerStyle = useMemo(() => ({ width: '100%', height: '600px' }), [])
  const gridStyle = useMemo(() => ({ height: '100%', width: '100%' }), [])
  const [gridApi, setGridApi] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [dataSource, setDataSource] = useState(null)

  const [columnDefs] = useState([
    {
      headerName: 'ID',
      field: 'id',
      maxWidth: 100,
      valueGetter: 'node.id',
    },
    { field: "name", minWidth: 150, filter: 'agTextColumnFilter' },
    { field: "email", minWidth: 150, filter: 'agTextColumnFilter' },
    { field: "phone", minWidth: 150, filter: 'agTextColumnFilter' },
  ])

  const defaultColDef = useMemo(() => {
    return {
      flex: 1,
      minWidth: 100,
      sortable: true,
      filter: true,
    }
  }, [])

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch('http://localhost:3004/users')
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()

      const newDataSource = {
        getRows: (params) => {
          console.log('Requesting data from server...')
          console.log(params)

          // Simulate server-side operations
          let rowData = [...data] // Create a copy of the data

          // Apply filtering
          const filterModel = params.filterModel
          Object.keys(filterModel).forEach(key => {
            const filter = filterModel[key]
            rowData = rowData.filter(row => {
              if (filter.type === 'contains') {
                return row[key].toString().toLowerCase().includes(filter.filter.toLowerCase())
              }
              if (filter.type === 'equals') {
                return row[key].toString() === filter.filter
              }
              // Add more filter types as needed
              return true
            })
          })

          // Apply sorting
          if (params.sortModel && params.sortModel.length > 0) {
            const { colId, sort } = params.sortModel[0]
            rowData.sort((a, b) => {
              const valueA = a[colId]
              const valueB = b[colId]
              
              if (valueA === valueB) return 0
              
              if (typeof valueA === 'string' && typeof valueB === 'string') {
                return sort === 'asc' ? valueA.localeCompare(valueB) : valueB.localeCompare(valueA)
              }
              
              if (valueA < valueB) return sort === 'asc' ? -1 : 1
              if (valueA > valueB) return sort === 'asc' ? 1 : -1
              return 0
            })
          }

          // Apply pagination
          const startRow = params.startRow
          const endRow = params.endRow
          const rowsThisPage = rowData.slice(startRow, endRow)
          const lastRow = rowData.length

          // Return the result to the grid
          setTimeout(() => {
            params.successCallback(rowsThisPage, lastRow)
          }, 500) // Increased timeout to 500ms to make the loading state more noticeable
        }
      }

      setDataSource(newDataSource)
      setLoading(false)
    } catch (error) {
      console.error("Failed to fetch data:", error)
      setError(error.message)
      setLoading(false)
    }
  }, [])

  const onGridReady = useCallback((params) => {
    setGridApi(params.api)
    if (dataSource) {
      params.api.setGridOption('datasource', dataSource)
    }
  }, [dataSource])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleRetry = useCallback(() => {
    setError(null)
    fetchData()
  }, [fetchData])

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <p className="text-red-500 mb-4">Error: {error}</p>
        <button 
          onClick={handleRetry}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <div style={containerStyle} className="relative">
      {loading ? (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(255, 255, 255, 0.25)',
          zIndex: 10,
        }}  >
          <img 
            src={spinner}
            alt="Loading" 
            style={{width:'280px', height:'280px'}}
          />
        </div>
      ) : (
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
          />
        </div>
      )}
    </div>
  )
}