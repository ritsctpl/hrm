import { createContext } from "react";
import { ActivityData } from "../types/activityTypes";


interface CombinedContextType {
   
   
    // formData:RoutingData;
    // setFormData :(value: Object) => void;

    
    // activeTab:number;
    // setActiveTab :(value: number) => void;
    
    payloadData:object;
    setPayloadData :(value: Object) => void; 
    
    showAlert:boolean;
    setShowAlert :(value: boolean) => void;

    schemaData: object;
    mainSchema: object;

    // formSchema: object;
    // setFormSchema:(value: Object) => void;
    
    // schema: object;
    // setSchema:(value: Object) => void;

    addClickCount: number;


  }
export const ActivityContext = createContext<CombinedContextType | undefined>(undefined);
