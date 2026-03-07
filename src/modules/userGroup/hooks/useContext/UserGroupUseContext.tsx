import { createContext } from "react";


interface CombinedContextType {
  selectedRowData: object;
  selectedRowCondition: boolean;
  selected: object;
  setSelectedRowData: (value: Object) => void;
  setSelectedRowCondition: (value: boolean) => void;
  setSelected: (value: Object) => void;
  tableData: any;
  setTableData: (value: any) => void;
  activeTab: number;
  setActiveTab: (value: number) => void;
  hasChanges: boolean;
  setHasChanges: (value: boolean) => void;
  formDatashow: object;
  setFormDatashow: (value: object) => void;
}
export const UserGrpContext = createContext<CombinedContextType | undefined>(undefined);