import React, {useState} from "react";
import Grid from "@mui/material/Unstable_Grid2/Grid2";
import  Box  from "@mui/system/Box";
import { DataGrid} from '@mui/x-data-grid';
import "./Table.scss";
import { objectsAreEqual } from "../functionsAndConstants/Utils";
import ButtonField from "./Button";



const DataTable = (props) => {    
    const { 
        rows, 
        columns, 
        onCellEditStop, 
        isLoading, 
        onRowClick,
        onCellClick,
        Icon_1, 
        Icon_2,
        text_1, 
        text_2,
        iconSize,
        disabled,
        onClick_button_1, 
        onClick_button_2,
        transparent,
        checkboxSelection
    } = props;
    const [pageSize, setPageSize] = useState(5);
    const [tableState, setTableState] = useState({});

    const onCellEditStop_ = (rowState) => {
        console.log(rowState);
    };

    const onStateChange_ = (newState) => {
        if(!objectsAreEqual(tableState, newState)) setTableState(newState);
    };

    return (
        <Grid display="flex" justifyContent="center" alignItems="center" width={"100%"} flexDirection="column">
            <Box sx={{ height: 400, width: '100%', color: "white" }}>
                <DataGrid
                    className={`${transparent ? "transparent" : ""} dataGridTable`}
                    sx={{
                        boxShadow: 2,
                        border: 2,
                        '& .MuiDataGrid-cell': {
                            color: 'secondary.main'
                        },
                        borderColor: 'primary.main',
                        '& .MuiDataGrid-cell:hover': {
                        color: 'primary.main',
                        },
                        '& .MuiDataGrid-withBorderColor': {
                            borderColor: 'primary.light'
                        },
                        color: 'white.main',
                        '& .MuiDataGrid-cell' :{
                            color: 'white.main'
                        },
                        '& .css-ecaxhr-MuiDataGrid-root': {
                            color: 'custom.main',
                        },
                        '& .css-rtrcn9-MuiTablePagination-root': {
                            color: 'white.main'
                        },
                        '& .css-zylse7-MuiButtonBase-root-MuiIconButton-root':{
                            color: 'white.main'
                        }
                    }}
                    disableRowSelectionOnClick={true}
                    onStateChange={ (state) => onStateChange_(state) }
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
            {
                (onClick_button_1 || onClick_button_2) && tableState.rowSelection && (tableState.rowSelection.length > 0) &&
                    <Grid display="flex" justifyContent="center" alignItems="center" width={"100%"}>
                        <Grid display="flex" justifyContent="left" alignItems="center" width={"50%"}>
                            {onClick_button_1 && <ButtonField
                                onClick={() => onClick_button_1({tableState})}
                                Icon={Icon_1}
                                text={text_1}
                                disabled={disabled}
                                isLoading={isLoading}
                                iconSize={iconSize}
                            />}
                        </Grid>
                        <Grid display="flex" justifyContent="right" alignItems="center" width={"50%"}>
                        {onClick_button_2 && <ButtonField
                            onClick={() => onClick_button_2({tableState})}
                            Icon={Icon_2}
                            text={text_2}
                            disabled={disabled}
                            isLoading={isLoading}
                            iconSize={iconSize}
                        />}
                        </Grid>
                    </Grid>
            }
            
        </Grid>
    )

};

export default DataTable;
