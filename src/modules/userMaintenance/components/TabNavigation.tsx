import React, { useContext, useEffect, useState } from "react";
import { Form, Button, message, Checkbox } from "antd";
import { Box, Tab } from "@mui/material";
import { TabContext, TabList, TabPanel } from "@mui/lab";
import { parseCookies } from "nookies";
import { addUser, getSiteRetrieveTop50, updateUser } from "@services/userService";
import { UserContext } from "../hooks/userContext";
import CustomDataTable from "./customData";
import styles from "../styles/Tab.module.css";
import { useTranslation } from "react-i18next";
import UserTransfer from "./UserGroup";
import UserWorkCenter from "./WorkCenter";
import LabourRule from "./LabourRule";
import LabourTracking from "./LabourTracking";
import SupervisionTracking from "./SupervisionTracking";
import {
  CreateKeycloakUser,
  UpdateKeycloakUser,
} from "@/app/api/auth/keycloakCredentials";
import DynamicForm from "@modules/userMaintenance/components/DynamicForm";
import getKeycloakInstance from "@/keycloak";

// Types
interface UserFormData {
  user: string;
  firstName: string;
  lastName: string;
  emailAddress: string;
  password: string;
  confirmPassword: string;
  site?: string[];
  labourRules?: Array<{ labourRule: string }>;
  labourTracking?: Array<{ validFrom: string; validTo: string }>;
  supervisor?: Array<{ validFrom: string; validTo: string }>;
  status?: string;
  employeeNumber?: string;
  erpUser?: string;
  erpPersonnelNumber?: string;
  addAsErpOperation?: boolean;
}

interface Site {
  site: string;
}

interface HomeProps {
  onCancel: () => void;
  username: string;
}

const REQUIRED_ROLES = ["Add Credential", "USER"];

const Home: React.FC<HomeProps> = ({ onCancel, username }) => {
  // Context
  const {
    isEditing,
    erpShift,
    formData,
    setFormData,
    call,
    setCall,
    setIsFullScreen,
    activeTab,
    setActiveTab,
    setIsAletered,
    selectedSites,
    setSelectedSites,
  } = useContext(UserContext);

  // State
  const [mainForm] = Form.useForm();
  const [sites, setSites] = useState<Site[]>([]);
  const [currentPlant, setCurrentPlant] = useState<string | null>(null);
  const [isPopupVisible, setIsPopupVisible] = useState(false);

  // Hooks
  const { t } = useTranslation();
  const cookies = parseCookies();
  const roles = cookies.role;
  const site = cookies.site;

  // useEffect(() => {
  //   setCurrentPlant(site);
  // }, [site]);

  // Validation functions
  const validateFormData = (data: UserFormData): string | null => {
    if (!data?.user) return "User field cannot be empty";
    if (!data?.firstName) return "First Name cannot be empty";
    if (!data?.lastName) return "Last Name cannot be empty";
    if (!data?.password) return "Password cannot be empty";
    if (!data?.confirmPassword && !isEditing && !erpShift) return "Confirm Password cannot be empty";
    if (data.password !== data.confirmPassword && !isEditing && !erpShift) return "Passwords do not match";

    const hasEmptyFields = {
      labourRules: data?.labourRules?.some((d) => !d.labourRule.trim()),
      labourTracking: data?.labourTracking?.some(
        (d) => !d.validFrom.trim() || !d.validTo.trim()
      ),
      supervisor: data?.supervisor?.some(
        (d) => !d.validFrom.trim() || !d.validTo.trim()
      ),
    };

    if (hasEmptyFields.labourRules) return "Labour Rules fields cannot be empty";
    if (hasEmptyFields.labourTracking) return "Labour Tracking fields cannot be empty";
    if (hasEmptyFields.supervisor) return "Supervisor fields cannot be empty";

    return null;
  };

  const hasRequiredRole = (userRoles: string): boolean => {
    return REQUIRED_ROLES.every((role) => userRoles?.includes(role));
  };

  // Effects
  useEffect(() => {
    if (mainForm && formData) {
      mainForm.setFieldsValue(formData);
    }
    if (activeTab === "5") {
      setIsFullScreen(true);
    }
  }, [formData, mainForm, activeTab, setIsFullScreen]);

  useEffect(() => {
    const fetchSites = async () => {
      try {
        const response = await getSiteRetrieveTop50();
        if (response.errorCode) {
          throw new Error(response.message || "Failed to fetch sites");
        }
        setSites(response?.retrieveTop50List || []);
      } catch (error) {
        console.error("Error fetching sites:", error);
        message.error("Failed to fetch sites");
      }
    };

    fetchSites();
  }, []);

  // Event handlers
  const handleTabChange = (_: React.SyntheticEvent, newValue: string) => {
    setActiveTab(newValue);
  };

  const handleCancel = () => {
    mainForm.resetFields();
    setIsPopupVisible(false);
    setSelectedSites([]);
    onCancel();
  };

  const handleCheckboxChange = (checkedValues: string[]) => {
    const uniqueValues = Array.from(new Set(checkedValues));
    setSelectedSites(uniqueValues);
  };

  const handleKeycloakUserOperation = async (
    userData: UserFormData,
    isUpdate: boolean
  ) => {
    const keyCloakUser = {
      data: {
        user: userData.user,
        firstName: userData.firstName,
        lastName: userData.lastName,
        emailAddress: userData.emailAddress,
        password: userData.password,
      },
    };

    const operation = isUpdate ? UpdateKeycloakUser : CreateKeycloakUser;
    const result = await operation(keyCloakUser);

    if (!result.succes && !(isUpdate && result.error === "User exists with same username")) {
      throw new Error(result.error);
    }

    return result;
  };

  const handleUserOperation = async (isUpdate: boolean) => {
    const validationError = validateFormData(formData);
    if (validationError) {
      message.error(validationError);
      return;
    }
    try {
      const site = cookies.site;
      const userId = cookies.rl_user_id;
      setCurrentPlant(site);

      const finalSelectedSites = selectedSites.length > 0
        ? selectedSites
        : ["RITS", "*"];
      // debugger
      await handleKeycloakUserOperation(formData, isUpdate);

      const payload = {
        ...formData,
        site: finalSelectedSites,
        currentSite: site,
        localDateTime: new Date().toISOString(),
      };

      const operation = isUpdate ? updateUser : addUser;
      const req = {site, userId, ...payload};
      const response = await operation(req);

      if (response.message || response.error) {
        throw new Error(response.message || response.error);
      }

      message.success(response?.message_details?.msg);
      setCall(call + 1);
      setIsAletered(false);
      setIsPopupVisible(false);
      // handleCancel();
    } catch (error) {
      message.error(error.message || "Operation failed");
    }
  };

  const handleAdd = () => {
    setIsPopupVisible(true);
    if (isEditing && erpShift) {
      handleUserOperation(true);
    } else {
      handleUserOperation(false);
    }
  };

  // Field configuration
  const fieldsToInclude = [
    "user",
    "firstName",
    "lastName",
    "password",
    "confirmPassword",
    "emailAddress",
    "status",
    "employeeNumber",
    "erpUser",
    "erpPersonnelNumber",
    "addAsErpOperation",
  ];

  const handleValuesChange = (changedValues: Partial<UserFormData>) => {
    setFormData((prev) => ({ ...prev, ...changedValues }));
  };

  return (
    <div style={{ padding: "0px 20px" }}>
      <TabContext value={activeTab}>
        <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
          <TabList onChange={handleTabChange} aria-label="user maintenance tabs">
            <Tab label={t("main")} value="1" />
            <Tab label={t("sites")} value="2" />
            <Tab label={t("userGroup")} value="3" />
            <Tab label={t("workCenter")} value="4" />
            <Tab label={t("labourTracking")} value="5" />
            <Tab label={t("supervisor")} value="6" />
            <Tab label={t("labourRule")} value="7" />
            <Tab label={t("customData")} value="8" />
          </TabList>
        </Box>

        <TabPanel value="1">
          <DynamicForm
            data={formData}
            fields={fieldsToInclude}
            username={username}
            onValuesChange={handleValuesChange}
          />
        </TabPanel>

        <TabPanel value="2">
          <div className={styles.sitesContainer}>
            <Checkbox.Group
              value={isEditing && erpShift ? selectedSites : [...selectedSites,  currentPlant]}
              onChange={handleCheckboxChange}
              className={styles.checkboxGroup}
            >
              {sites.map((site) => {
                const isStarOrCurrentSite =
                  // site.site === "*" || site.site === currentPlant;
                  site.site === currentPlant;
                return (
                  <Checkbox
                    key={site.site}
                    value={site.site}
                    disabled={isStarOrCurrentSite}
                    className={styles.checkbox}
                  >
                    <span 
                    // className={isStarOrCurrentSite ? styles.disabledSite : ""}
                    >
                      {site.site}
                    </span>
                  </Checkbox>
                );
              })}
            </Checkbox.Group>
          </div>
        </TabPanel>

        <TabPanel value="3"><UserTransfer /></TabPanel>
        <TabPanel value="4"><UserWorkCenter /></TabPanel>
        <TabPanel value="5"><LabourTracking /></TabPanel>
        <TabPanel value="6"><SupervisionTracking /></TabPanel>
        <TabPanel value="7"><LabourRule /></TabPanel>
        <TabPanel value="8"><CustomDataTable /></TabPanel>
      </TabContext>

      <div className={styles.submitButton}>
        {isEditing && erpShift ? (
          <Button
            type="primary"
            onClick={handleAdd}
            disabled={!hasRequiredRole(roles)}
          >
            {t("save")}
          </Button>
        ) : (
          <Button
            type="primary"
            onClick={handleAdd}
            disabled={!hasRequiredRole(roles)}
          >
            {t("create")}
          </Button>
        )}
        <Button style={{ marginLeft: 8 }} onClick={handleCancel}>
          {t("cancel")}
        </Button>
      </div>
    </div>
  );
};

export default Home;
