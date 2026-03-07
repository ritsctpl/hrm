import { createContext } from "react";
import { User } from "../types/userTypes";


interface CombinedContextType {
  isEditing: boolean;
  setIsEditing: (value: boolean) => void;
  erpShift: boolean;
  setErpShift: (value: boolean) => void;
  isFullScreen: boolean;
  setIsFullScreen: (value: boolean) => void;
  formData: User;
  setFormData: (value: Object) => void;
  call: number;
  callUser: number;
  setCall: (value: number) => void;
  isModalVisible: boolean;
  setIsModalVisible: (value: boolean) => void;
  isAltered: boolean;
  setIsAletered: (value: boolean) => void;
  activeTab: any;
  setActiveTab: (value: any) => void;
  isPlusClicked: number;
  setIsPlusClicked: (value: number) => void;
  availableUG: any;
  setAvailableUG: (value: any) => void;
  assignedUG: any;
  setAssignedUG: (value: any) => void;
  
  selectedSites: any;
  setSelectedSites: (value: any) => void;
}
export const UserContext = createContext<CombinedContextType | undefined>(undefined);

