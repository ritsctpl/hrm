/* eslint-disable @next/next/no-img-element */
import React, { useEffect, useRef, useState } from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  TextField,
  Box,
  Autocomplete,
  IconButton,
  Menu,
  MenuItem,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { fetchSiteAll } from "@services/siteServices";
import { useAuth } from "../context/AuthContext";
import { useRouter } from "next/navigation";
import styles from "./CommonAppBar.module.css";
import logo from "../images/rits-logo-removebg-preview.png"; // Import the image
import { destroyCookie, parseCookies, setCookie } from "nookies";
import { useTranslation } from "react-i18next";
import { message, Modal, Select } from "antd";
import { DecodedToken } from "@modules/userMaintenance/types/userTypes";
import { decryptToken } from "@utils/encryption";
import jwtDecode from "jwt-decode";
import { updateUserSite } from "@services/userService";
import { useRbacContext } from "@modules/hrmAccess/context/RbacContext";
import { HomeOutlined } from "@mui/icons-material";
import ritsLogo from "../images1/rits-logo.png";
import himalayaLogo from "../images/image1.png"; // Add this import
import exideLogo from "../images/EXIDE-logo.png"; // Add this import
import LoadingWrapper from "./LoadingWrapper";
import { Building2, LogOut } from "lucide-react";
import { CiSearch } from "react-icons/ci";
import { useTheme as useAppTheme } from "./ThemeContext";
const { Option } = Select;
interface CommonAppBarProps {
  allActivities?: { description: string; url: string }[];
  username?: string | null;
  site?: string | null;
  appTitle: string;
  color?: string;
  onSiteChange?: (newSite: string) => void;
  onSearchChange?: (searchTerm: string) => void;
  logoHeader?: string;
  setUserDetails?: unknown;
}
 
const CommonAppBar: React.FC<CommonAppBarProps> = ({
  color,
  appTitle,
  onSiteChange,
  onSearchChange,
  logoHeader,
}) => {
  const { isAuthenticated, token, logout } = useAuth();
  const rbac = useRbacContext();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [siteDetails, setSiteDetails] = useState<any>();
  const theme = useTheme();

  const isSmallScreen = useMediaQuery(theme.breakpoints.down("md"));
  const { i18n, t } = useTranslation();
  const [isLoading, setIsLoading] = useState(true);
  const [isClientSide, setIsClientSide] = useState(false);
  const { updateThemeFromSite } = useAppTheme();

  // Derive from RBAC context
  const site = rbac.currentSite;
  const availableSites = rbac.organizations.map((org) => org.site);
  const allActivities = rbac.currentOrgModules.map((m) => ({
    description: m.moduleName,
    url: m.appUrl,
    activityId: m.moduleCode,
    type: 'UI',
  }));

  useEffect(() => {
    setIsClientSide(true);
  }, []);

  useEffect(() => {
    if (rbac.isReady) {
      setIsLoading(false);
    }
  }, [rbac.isReady]);
 
  useEffect(() => {
    const cleanedUrl = window.location.pathname
      ?.replace(/.*\/rits/, "/rits")
      .replace(/\/index\.html$/, "");
    const filteredDescriptions = allActivities
      ?.filter((activity) => activity.url?.startsWith(cleanedUrl))
      ?.map((activity) => activity.description);
    // console.log(cleanedUrl,"filteredDescriptions");
    // Ensure /rits/mfr_request_app and /rits/mfr get distinct titles if their descriptions are different
    if (filteredDescriptions?.length > 0 && cleanedUrl !== "/rits/pod_app") {
      // If multiple descriptions exist for similar URLs, try to match the exact cleanedUrl
      const exactActivity = allActivities.find(
        (activity) => activity.url?.replace(/.*\/rits/, "/rits").replace(/\/index\.html$/, "") === cleanedUrl
      );
      if (exactActivity && exactActivity.description) {
        document.title = exactActivity.description;
      } else {
        document.title = filteredDescriptions[0];
      }
    } else if (cleanedUrl === "/manufacturing" || cleanedUrl === "/hrm") {
      document.title = "Welcome";
    } else if (cleanedUrl !== "/rits/pod_app") {
      document.title = "App";
    }
  }, [allActivities]);
 
  const modalShownRef = useRef(false);

 
  useEffect(() => {
    const currentPath = window.location.pathname.split("/").pop() || "";
 
    if (!allActivities?.length) {
      return;
    }
 
    const newActivitiesUrl = allActivities.map((activity) => {
      const cleanedUrl = (activity.url || "")
        .replace(/\/rits/, "")
        .replace(/\/index\.html$/, "");
      return cleanedUrl;
    });
 
    const isValidPath = newActivitiesUrl.some((activity) => {
      const urlParts = activity.replace(/^\/|\/$/g, "").split(/[\/\?]/);
      return urlParts.some(
        (part) => part && part !== "index.html" && part === currentPath
      );
    });

    // Check if the current URL contains /rits/user_manual
    const isUserManualPath = window.location.pathname.includes("/rits/user_manual");
 
    if (
      !isValidPath &&
      currentPath !== "manufacturing" &&
      currentPath !== "hrm" &&
      !isUserManualPath &&
      !modalShownRef.current
    ) {
      modalShownRef.current = true;
      Modal.warning({
        title: "Access Denied",
        content:
          "You do not have access to this page. Redirecting to home page...",
        icon: <HomeOutlined />,
        closable: false,
        maskClosable: false,
        keyboard: false,
        mask: true,
        maskStyle: { backdropFilter: "blur(8px)" },
        onOk: () => {
          router.push("/");
        },
      });
    }
  }, [allActivities, router]);
 
  const getImageSource = (imageIcon: string) => {
    const imageMap = {
      "/images/rits-logo.png": ritsLogo.src,
      "/images/image1.png": himalayaLogo.src,
      "/images/EXIDE-logo.png": exideLogo.src,
    };
 
    return imageMap[imageIcon] || imageIcon; // This already returns the image source
  };
 
  const changeLanguage = (value) => {
    try {
      i18n.changeLanguage(value);
      localStorage.setItem("language", value);
 
      // Clear any existing language cookie first
      destroyCookie(null, "language", { path: "/" });
 
      // Then, set the new language cookie
      setCookie(null, "language", value, {
        path: "/", // makes it available across all pages
        maxAge: 30 * 24 * 60 * 60, // optional: set expiry for 30 days
      });
    } catch (error) {
      console.error("Error changing language:", error);
    }
  };
  useEffect(() => {
    if (isAuthenticated && token) {
      try {
        const decryptedToken = decryptToken(token);
        const decoded: DecodedToken = jwtDecode<DecodedToken>(decryptedToken);
        setUsername(decoded.preferred_username);
        setCookie(null, "rl_user_id", decoded.preferred_username, {
          path: "/", // makes it available across all pages
          maxAge: 30 * 24 * 60 * 60, // optional: set expiry for 30 days
        });
      } catch (error) {
        console.error("Error decoding token:", error);
      }
    }
  }, [isAuthenticated, token]);
 
  // Fetch site details (theme/logo) from RBAC currentSite
  useEffect(() => {
    const loadSiteDetails = async () => {
      if (site) {
        try {
          const responseSite = await fetchSiteAll(site);
          setSiteDetails(responseSite);
          localStorage.setItem("theme", JSON.stringify(responseSite.theme));
        } catch (error) {
          console.error("Error fetching site details:", error);
        }
      }
    };
    loadSiteDetails();
  }, [site]);
 
  const handleLogoClick = () => {
    router.push("/");
  };
 
  const handleSearchChange = (
    event: React.ChangeEvent<{}>,
    newValue: string | null
  ) => {
    const value = newValue || "";
    setSearchTerm(value);
    if (onSearchChange) onSearchChange(value);
  };
 
  const handleActivitySelect = (event: any, newValue: string | null) => {
    const selectedActivity = allActivities.find(
      (activity) => activity.description === newValue
    );
    if (selectedActivity) {
      const cleanedUrl = `/hrm${selectedActivity.url.replace(
        /\/index\.html$/,
        ""
      )}`;
      let activityId = selectedActivity.activityId;
      const url = `${window.location.origin}${cleanedUrl}`;
 
      if (event.ctrlKey) {
        const newTab = window.open(url, "_blank");
        if (newTab) newTab.focus();
        sessionStorage.setItem("activityId", activityId);
      } else {
        window.location.href = url;
      }
    }
   
    // Clear the search term after selection
    setSearchTerm("");
    if (onSearchChange) {
      onSearchChange("");
    }
  };
 
  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    // debugger
    setAnchorEl(event.currentTarget);
  };
 
  const handleMenuClose = () => {
    setAnchorEl(null);
  };
 
  const handleSiteChange = async (newSite: string) => {
    try {
      message.destroy();
      setIsLoading(true);

      const cookies = parseCookies();
      const userId = cookies.rl_user_id;
      const currentSite = cookies.site;
      const payload = {
        defaultSite: newSite,
        site: currentSite,
        user: userId,
      };

      const res = await updateUserSite(payload);
      if (res.errorCode) {
        message.destroy();
        message.error(res.message || "Failed to update site");
        return;
      }

      // Fetch new site details immediately
      const newSiteDetails = await fetchSiteAll(newSite);
      setSiteDetails(newSiteDetails);
      localStorage.setItem("theme", JSON.stringify(newSiteDetails.theme));

      // Update theme and store in cookie
      await updateThemeFromSite(newSiteDetails);

      // Set the site cookie
      setCookie(null, "site", newSite, {
        path: "/",
        maxAge: 30 * 24 * 60 * 60,
      });

      // Switch organization via RBAC context
      rbac.switchOrganization(newSite);

      if (onSiteChange) {
        onSiteChange(newSite);
        window.location.reload();
      }

      if (res.message_details?.msg) {
        message.success(res.message_details.msg);
      } else if (res.message) {
        message.success(res.message);
      } else {
        message.success("Site updated successfully");
      }
    } catch (e) {
      console.error("Error updating site:", e);
      message.error("Failed to update site");
    } finally {
      setIsLoading(false);
      setAnchorEl(null);
    }
  };

  const cookies = parseCookies();
  const language = cookies.language || "en";
  // const uniqueActivities = Array.from(
  //   new Set(allActivities?.map((activity) => activity.description))
  // ); // Remove duplicates
  const uniqueActivities = Array.from(
    new Set(
      allActivities
        ?.filter((activity) => activity?.type?.toLowerCase() == "ui" || activity?.type?.toLowerCase() == "ui5") // ✅ filter first
        .map((activity) => activity?.description)
    )
  );
  
  const currentLanguage = cookies.language || "en";
  const values =
    typeof window !== "undefined"
      ? JSON.parse(sessionStorage.getItem("batchTop50Data") || "{}")
      : {};
 
  return (
    <LoadingWrapper isLoading={isClientSide && isLoading}>
      {(
        <AppBar
          position="static"
          style={{
            boxShadow: "none",
            backgroundColor: siteDetails?.theme?.background,
            color: siteDetails?.theme?.color,
            borderBottom:"1px solid var(--line-color)",
            width: "100%",
          }}
          className={styles.appBar}
        >
          <Toolbar
            variant="dense"
            className={styles.toolbar}
            sx={{
              flexDirection: isSmallScreen ? "column" : "row",
              minHeight: 48,
            }}
          >
            <img
              src={
                siteDetails?.theme?.logo
                  ? getImageSource(siteDetails?.theme?.logo)
                  : logo.src
              }
              alt="company Logo"
              className={styles.logo}
              onClick={handleLogoClick}
            />
            <Typography
              variant="h6"
              className={styles.title}
              style={{
                color: siteDetails?.theme?.color,
                fontFamily:
                  siteDetails?.theme?.background === "#ffffff"
                    ? "roboto"
                    : "inherit",
              }}
            >
              {appTitle}
            </Typography>
 
            <Box className={styles.searchBox}>
              <Autocomplete
                freeSolo
                options={uniqueActivities}
                inputValue={searchTerm}
                value={null}
                onInputChange={handleSearchChange}
                onChange={(event, newValue) => {
                  handleActivitySelect(event, newValue);
                  setSearchTerm("");
                  if (onSearchChange) {
                    onSearchChange("");
                  }
                }}
                filterOptions={(options, state) =>
                  options.filter(
                    (option) =>
                      state.inputValue &&
                      option
                        .toLowerCase()
                        .includes(state.inputValue.toLowerCase())
                  )
                }
                renderInput={(params) => (
                  <TextField
                    {...params}
                    variant="outlined"
                    placeholder={t("searchActivities")}
                    style={{ borderRadius: "5px", width: "300px" }}
                    className={styles.searchField}
                    InputProps={{
                      ...params.InputProps,
                      endAdornment: <CiSearch />,
                      classes: {
                        root: styles.searchFieldRoot,
                        notchedOutline: styles.noBorder,
                      },
                    }}
                  />
                )}
              />
            </Box>
 
            <Box className={styles.userInfo}>
              <IconButton
                color="inherit"
                onClick={handleMenuOpen}
                className={styles.iconButton}
                title={site || ""}
              >
                <Building2 size={18} style={{ color: "var(--text-color)" }} />
              </IconButton>
              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
                PaperProps={{
                  style: {
                    maxHeight: 200,
                    width: "20ch",
                  },
                }}
              >
                {availableSites?.map((siteOption, index) => (
                  <MenuItem
                    key={index}
                    onClick={() => handleSiteChange(siteOption)}
                  >
                    {siteOption}
                  </MenuItem>
                ))}
              </Menu>
              <div>
                <Select
                  defaultValue={currentLanguage}
                  style={{ width: 90 }}
                  onChange={changeLanguage}
                >
                  <Option value="en">English</Option>
                  <Option value="ka">ಕನ್ನಡ</Option>
                  <Option value="ta">தமிழ்</Option>
                  <Option value="hi">हिंदी</Option>
                </Select>
              </div>
              <IconButton
                color="inherit"
                onClick={() => {
                  destroyCookie(null, 'rl_user_id', { path: '/' });
                  logout();
                }}
                title={t("logout")}
                sx={{ color: "var(--text-color)" }}
              >
                <LogOut size={18} />
              </IconButton>
              <div
                className={styles.avatar}
                title={`${username} | ${site}`}
              >
                {username ? username.charAt(0).toUpperCase() : "?"}
              </div>
            </Box>
          </Toolbar>
        </AppBar>
      )}
    </LoadingWrapper>
  );
};
 
export default CommonAppBar;