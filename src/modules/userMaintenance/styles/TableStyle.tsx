import { Table } from "antd";
import styled from "styled-components";

export const StyledTable = styled(Table)`
  .ant-table-thead > tr > th {
    background: #fafafa;
    font-size: 15px;
    padding-left:16px;
    color: #000;
    /*border: 1px solid #d4d5e1;  Add border to header cells */
  }
.ant-table-wrapper table {
    width: 100%;
    text-align: start;
    border-radius: 0px!important;
    border-collapse: separate;
    border-spacing: 0;
}
  .ant-table-tbody > tr > td {
   /* border: 1px solid #efefef;  Add border to body cells */
    background-color: #FFFFFF;
    font-size: 15px;
  }

  .ant-table-tbody > tr:hover {
    background: #fafafa;
  }

  .selected-row {
    background: #fafafa !important;
    .ant-table-cell {
      font-weight: bold;
    }
  }
`;