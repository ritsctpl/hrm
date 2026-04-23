/* eslint-disable @next/next/no-img-element */
import React, { useEffect, useMemo, useRef, useState } from "react";
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
import { HrmOrganizationService } from "@modules/hrmOrganization/services/hrmOrganizationService";
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
import { HrmEmployeeService } from "@modules/hrmEmployee/services/hrmEmployeeService";
import { useRbacContext } from "@modules/hrmAccess/context/RbacContext";
import { useCurrentEmployeeStore } from "@modules/hrmAccess/stores/currentEmployeeStore";
import { HomeOutlined } from "@mui/icons-material";
import ritsLogo from "../images1/rits-logo.png";
import himalayaLogo from "../images/image1.png"; // Add this import
import exideLogo from "../images/EXIDE-logo.png"; // Add this import
import LoadingWrapper from "./LoadingWrapper";
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
  const site = rbac.currentOrganizationId;
  const availableSites = rbac.organizations.map((org) => org.organizationId);
  const currentOrg = rbac.organizations.find(o => o.organizationId === site);

  // Org switcher (admin-only). Org admins (full VIEW+ADD+EDIT+DELETE on
  // HRM_ORGANIZATION) get the full org list from the backend; regular users
  // see only the orgs RBAC has granted them. Shown as a dropdown when the
  // user has >1 accessible org, otherwise rendered as a read-only badge.
  const orgActions = rbac.getModuleActions('HRM_ORGANIZATION');
  const isOrgAdmin =
    orgActions.includes('VIEW') &&
    orgActions.includes('ADD') &&
    orgActions.includes('EDIT') &&
    orgActions.includes('DELETE');

  const [allOrgs, setAllOrgs] = useState<Array<{ organizationId: string; organizationName: string }>>([]);
  useEffect(() => {
    if (!isOrgAdmin) return;
    let cancelled = false;
    (async () => {
      try {
        const list = await HrmOrganizationService.fetchAllOrganizations();
        if (!cancelled) setAllOrgs(list);
      } catch (e) {
        console.error('[OrgSwitcher] fetchAllOrganizations failed:', e);
      }
    })();
    return () => { cancelled = true; };
  }, [isOrgAdmin]);

  // Merge-preference: admin's full list takes precedence; fall back to RBAC
  // list for non-admins (or while the admin list is loading). Dedupe by
  // organizationId — backends have been observed returning the same org
  // twice (e.g. "RITS" appearing both from site-service and hrm-service),
  // which causes React duplicate-key warnings in the Select.
  const rawSwitcherOrgs = isOrgAdmin && allOrgs.length > 0
    ? allOrgs
    : rbac.organizations.map(o => ({
        organizationId: o.organizationId,
        organizationName: o.organizationName,
      }));
  const switcherOrgs = useMemo(() => {
    const seen = new Map<string, { organizationId: string; organizationName: string }>();
    for (const o of rawSwitcherOrgs) {
      const id = o.organizationId;
      if (!id) continue;
      // Keep the first occurrence, but upgrade the display name if a later
      // duplicate carries a more informative one (non-empty, not just the id).
      const existing = seen.get(id);
      if (!existing) {
        seen.set(id, { organizationId: id, organizationName: o.organizationName || id });
      } else if (
        (!existing.organizationName || existing.organizationName === id) &&
        o.organizationName &&
        o.organizationName !== id
      ) {
        existing.organizationName = o.organizationName;
      }
    }
    return Array.from(seen.values());
    // rawSwitcherOrgs is rebuilt every render; memoising on its length +
    // stable inputs keeps the list stable across re-renders when nothing
    // actually changed.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allOrgs, rbac.organizations, isOrgAdmin]);
  const canSwitchOrg = switcherOrgs.length > 1;

  // Display name resolution: prefer RBAC-provided name, then fall back to
  // the admin's full org list (covers the case where the admin has switched
  // into an org they aren't RBAC-assigned to — without this, the header
  // would render the raw handle/UUID from the `site` cookie).
  const orgDisplayName =
    currentOrg?.organizationName ||
    switcherOrgs.find(o => o.organizationId === site)?.organizationName ||
    site ||
    '';

  const allActivities = rbac.currentOrgModules.map((m) => ({
    description: m.moduleName,
    url: m.appUrl,
    activityId: m.moduleCode,
    type: 'UI',
  }));

  // Signed-in user's employee card (photo + name) AND current org logo —
  // both cached via the global store and fetched in parallel.
  const currentEmployee = useCurrentEmployeeStore(s => s.data);
  const currentOrgCard = useCurrentEmployeeStore(s => s.org);
  const loadCurrentEmployee = useCurrentEmployeeStore(s => s.load);
  useEffect(() => {
    if (rbac.isReady && site) {
      loadCurrentEmployee();
    }
  }, [rbac.isReady, site, loadCurrentEmployee]);

  // Resolve the best available image source for the user avatar:
  // prefer photoBase64 (already inlined) → photoUrl → null (fallback to initial).
  const userAvatarSrc = currentEmployee?.photoBase64 || currentEmployee?.photoUrl || null;
  // Same for the organization logo shown in the home/logo slot.
  const orgLogoSrc = currentOrgCard?.logoBase64 || currentOrgCard?.logoUrl || null;

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
 
  // Fetch site details (theme/logo) from RBAC currentOrganizationId
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
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleSettingsClick = () => {
    setAnchorEl(null);
    router.push('/rits/hrm_settings_app');
  };

  const handleLogoutClick = () => {
    setAnchorEl(null);
    destroyCookie(null, 'rl_user_id', { path: '/' });
    logout();
  };
 
  const handleSiteChange = async (newSite: string) => {
    try {
      message.destroy();
      setIsLoading(true);

      const cookies = parseCookies();
      const userId = cookies.rl_user_id;

      // Persist the user's default organization — upserts UserSitePreference
      // so the next login restores the last-selected company. No tenant
      // update here; RBAC is created per-company in this app's model.
      const res = await HrmEmployeeService.updateLastDefaultOrganization({
        user: userId,
        defaultOrganizationId: newSite,
      }) as { errorCode?: string; message?: string; message_details?: { msg?: string } } | undefined;
      if (res?.errorCode) {
        message.destroy();
        message.error(res?.message || "Failed to update default organization");
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

      // Switch organization via RBAC context. Note: if the admin switches
      // to an org not in their RBAC-assigned list, switchOrganization is a
      // no-op — the subsequent reload rebuilds state from the cookie we
      // just wrote, so this is still safe.
      rbac.switchOrganization(newSite);

      if (onSiteChange) {
        onSiteChange(newSite);
      }

      // Always reload so every module's stores / React Query caches refetch
      // under the new organization, regardless of whether onSiteChange is
      // provided by the parent.
      window.location.reload();

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
    <>
      {(
        <AppBar
          position="sticky"
          style={{
            boxShadow: "none",
            backgroundColor: "var(--background-color)",
            color: "var(--text-color)",
            borderBottom: "1px solid var(--line-color)",
            width: "100%",
            top: 0,
            zIndex: 100,
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
            {/*
              Branding image removed from the top nav bar — the org logo
              now lives in the sidebar's top slot (AppSidebar brandMark)
              and acts as the home button from there.
            */}
            <Typography
              variant="h6"
              className={styles.title}
              style={{
                color: "var(--text-color)",
              }}
            >
              {appTitle}
            </Typography>
            {orgDisplayName && (
              canSwitchOrg ? (
                // Admin with access to multiple orgs — show dropdown.
                // handleSiteChange updates the cookie + server-side default
                // site and performs a full reload so every store / React
                // Query cache refetches under the new organization.
                <Select
                  value={site || undefined}
                  onChange={(val) => handleSiteChange(val as string)}
                  size="small"
                  style={{
                    marginLeft: 16,
                    minWidth: 180,
                  }}
                  popupMatchSelectWidth={260}
                  title={orgDisplayName}
                  showSearch
                  optionFilterProp="label"
                  options={switcherOrgs.map((o) => ({
                    value: o.organizationId,
                    label: o.organizationName || o.organizationId,
                  }))}
                />
              ) : (
                // Single org (or non-admin with one org) — read-only badge.
                <Typography
                  variant="body2"
                  title={orgDisplayName}
                  style={{
                    marginLeft: 16,
                    padding: "4px 14px",
                    borderRadius: 14,
                    background: "var(--button-color, #1890ff)",
                    color: "#ffffff",
                    fontSize: 13,
                    fontWeight: 700,
                    letterSpacing: 0.3,
                    whiteSpace: "nowrap",
                    boxShadow: "0 1px 4px rgba(0,0,0,0.12)",
                  }}
                >
                  {orgDisplayName}
                </Typography>
              )
            )}
 
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
              {userAvatarSrc ? (
                <img
                  src={userAvatarSrc}
                  alt={currentEmployee?.fullName || username || ''}
                  title={`${currentEmployee?.fullName || username || ''} | ${orgDisplayName}`}
                  onClick={handleMenuOpen}
                  className={styles.avatar}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    objectFit: 'cover',
                    border: '1px solid var(--line-color)',
                    cursor: 'pointer',
                  }}
                />
              ) : (
                <div
                  className={styles.avatar}
                  onClick={handleMenuOpen}
                  title={`${currentEmployee?.fullName || username || ''} | ${orgDisplayName}`}
                  style={{ cursor: 'pointer' }}
                >
                  {(currentEmployee?.fullName || username || '?').charAt(0).toUpperCase()}
                </div>
              )}
              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                PaperProps={{ style: { minWidth: 160 } }}
              >
                <MenuItem onClick={handleSettingsClick}>
                  {t('settings._label') || 'Settings'}
                </MenuItem>
                <MenuItem onClick={handleLogoutClick}>
                  {t('logout') || 'Logout'}
                </MenuItem>
              </Menu>
            </Box>
          </Toolbar>
        </AppBar>
      )}
    </>
  );
};
 
export default CommonAppBar;