import React, {useState} from "react";
import Grid from "@mui/material/Unstable_Grid2/Grid2";
import  Box  from "@mui/system/Box";
import { DataGrid} from '@mui/x-data-grid';
import { objectsAreEqual } from "../functionsAndConstants/Utils";
import ButtonField from "./Button";
import { WHITE_COLOR } from "../Theme";



const DataTable = (props) => {    
    const { 
        rows, 
        columns, 
        onRowClick,
        onCellClick,
        disabled,
        checkboxSelection,
        onStateChange
    } = props;

    const [pageSize, setPageSize] = useState(5);

    return (
        <Grid display="flex" justifyContent="center" alignItems="center" width={"100%"} flexDirection="column">
            <Box sx={{  width: '95%', color: WHITE_COLOR }}>
                <DataGrid
                    disableRowSelectionOnClick={true}
                    onStateChange={onStateChange}
                    columns={columns}
                    onCellClick={ (e) => { if(onCellClick){onCellClick(e.formattedValue)}} }
                    onRowClick={ (e) => { if(onRowClick) onRowClick(e.row)} }
                    rows={rows}
                    getRowId={(row) => row.id}
                    rowsPerPageOptions={[5,10,20]}
                    pageSizeOptions={[5,10,20]}
                    pageSize={pageSize}
                    checkboxSelection={!disabled && checkboxSelection}
                    onPageSizeChange={(newPageSize) => setPageSize(newPageSize)}
                    setPageSize={(newPageSize) => setPageSize(newPageSize)}
                />
            </Box>
        </Grid>
    )

};

export default DataTable;
