import { createContext } from "react";


interface CombinedContextType {
  formData: object;
  formChange: boolean;
  setFormData :(value: Object) => void;
  setFormChange :(value: boolean) => void;
  activeTab: number;
  setActiveTab: (value: number) => void;
  }
export const ActivityGrpContext = createContext<CombinedContextType | undefined>(undefined);