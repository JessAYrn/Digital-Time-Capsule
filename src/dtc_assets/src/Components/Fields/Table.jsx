import React from "react";
import Grid from "@mui/material/Unstable_Grid2/Grid2";
import  Box  from "@mui/system/Box";
import { DataGrid, GridToolbarContainer, useGridApiRef } from '@mui/x-data-grid';
import "./Table.scss";

const DataTable = (props) => {

    const tableRef = useGridApiRef();
    console.log(tableRef);
    const { rows, columns} = props;

    return (
        <Grid display="flex" justifyContent="center" alignItems="center" width={"100%"}>
            <Box sx={{ height: 400, width: '100%' }}>
            <DataGrid
                className="DataGridTable"
                rows={rows}
                apiRef={tableRef}
                columns={columns}
                initialState={{
                pagination: {
                    paginationModel: {
                    pageSize: 5,
                    },
                },
                }}
                pageSizeOptions={[5]}
                checkboxSelection
                disableRowSelectionOnClick
            />
            </Box>
        </Grid>
    )

};

export default DataTable;
