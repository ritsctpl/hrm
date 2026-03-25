'use client';

import { useState, useEffect } from 'react';
import { Drawer, Button, Select, Checkbox, Divider, message, Typography, Spin } from 'antd';
import { parseCookies } from 'nookies';
import BuMappingRow from '../molecules/BuMappingRow';
import { HrmHolidayService } from '../../services/hrmHolidayService';
import { HrmOrganizationService } from '../../../hrmOrganization/services/hrmOrganizationService';
import { useHrmHolidayStore } from '../../stores/hrmHolidayStore';
import type { BuMappingPanelProps } from '../../types/ui.types';
import type { BusinessUnit, Department } from '../../../hrmOrganization/types/domain.types';
import styles from '../../styles/HolidayForm.module.css';

export default function BuMappingPanel({
  open,
  groupHandle,
  mappings: initialMappings,
  onClose,
  onMappingChanged,
}: BuMappingPanelProps) {
  const [companyHandle, setCompanyHandle] = useState<string | undefined>();
  const [buHandle, setBuHandle] = useState<string | undefined>();
  const [deptHandle, setDeptHandle] = useState<string | undefined>();
  const [primaryFlag, setPrimaryFlag] = useState(false);
  const [adding, setAdding] = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);
  const [loadingMappings, setLoadingMappings] = useState(false);
  const [localMappings, setLocalMappings] = useState<any[]>([]);
  
  // Organization data
  const [companies, setCompanies] = useState<any[]>([]);
  const [businessUnits, setBusinessUnits] = useState<BusinessUnit[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loadingCompanies, setLoadingCompanies] = useState(false);
  const [loadingBUs, setLoadingBUs] = useState(false);
  const [loadingDepts, setLoadingDepts] = useState(false);
  
  const { addMapping, removeMapping } = useHrmHolidayStore();

  const cookies = parseCookies();
  const site = cookies.site ?? '';
  const userId = cookies.userId ?? '';

  // Fetch Companies when panel opens
  useEffect(() => {
    if (open) {
      loadCompanies();
      loadMappings();
    }
  }, [open]);

  // Fetch Business Units when Company is selected
  useEffect(() => {
    if (companyHandle) {
      loadBusinessUnits(companyHandle);
    } else {
      setBusinessUnits([]);
      setBuHandle(undefined);
      setDepartments([]);
      setDeptHandle(undefined);
    }
  }, [companyHandle]);

  // Fetch Departments when Business Unit is selected
  useEffect(() => {
    if (buHandle) {
      loadDepartments(buHandle);
    } else {
      setDepartments([]);
      setDeptHandle(undefined);
    }
  }, [buHandle]);

  const loadCompanies = async () => {
    setLoadingCompanies(true);
    try {
      const response = await HrmOrganizationService.fetchBySite(site);
      
      // Handle different response structures
      let companyData: any[] = [];
      
      // If response is wrapped in a response property (array)
      if (response && response && Array.isArray(response)) {
        companyData = response;
      }
      // If response is wrapped in a data property
      else if (response && typeof response === 'object' && 'data' in response) {
        companyData = Array.isArray(response.data) ? response.data : [response.data];
      }
      // If it's a single company object
      else if (response && typeof response === 'object') {
        companyData = [response];
      }
      
      setCompanies(companyData);
    } catch (error) {
      message.error('Failed to load companies');
      setCompanies([]);
    } finally {
      setLoadingCompanies(false);
    }
  };

  const loadBusinessUnits = async (compHandle: string) => {
    setLoadingBUs(true);
    try {
      const data = await HrmOrganizationService.fetchBusinessUnits(site, compHandle);
      setBusinessUnits(data || []);
    } catch (error) {
      console.error('Failed to load business units:', error);
      message.error('Failed to load business units');
      setBusinessUnits([]);
    } finally {
      setLoadingBUs(false);
    }
  };

  const loadDepartments = async (buHandle: string) => {
    setLoadingDepts(true);
    try {
      const data = await HrmOrganizationService.fetchDepartments(site, buHandle);
      setDepartments(data || []);
    } catch (error) {
      console.error('Failed to load departments:', error);
      message.error('Failed to load departments');
      setDepartments([]);
    } finally {
      setLoadingDepts(false);
    }
  };

  const loadMappings = async () => {
    setLoadingMappings(true);
    try {
      const res = await HrmHolidayService.listMappings({
        site,
        groupHandle,
      });
      
      let mappingsData: any[] = [];
      if (res.success && res.data) {
        mappingsData = res.data;
      } else if (Array.isArray(res)) {
        // Handle case where response is directly an array
        mappingsData = res;
      }
      
      // Enrich mappings with BU and Dept names
      const enrichedMappings = await Promise.all(
        mappingsData.map(async (mapping) => {
          try {
            // Fetch BU details if buName is null
            if (!mapping.buName && mapping.buHandle) {
              const buDetails = await HrmOrganizationService.fetchBusinessUnit(site, mapping.buHandle);
              if (buDetails) {
                mapping.buName = `${buDetails.buCode} - ${buDetails.buName}`;
              }
            }
            
            // Fetch Dept details if deptName is null and deptHandle exists
            if (!mapping.deptName && mapping.deptHandle) {
              const deptDetails = await HrmOrganizationService.fetchDepartment(site, mapping.deptHandle);
              if (deptDetails) {
                mapping.deptName = `${deptDetails.deptCode} - ${deptDetails.deptName}`;
              }
            }
          } catch (error) {
            // Set fallback values if fetch fails
            if (!mapping.buName) mapping.buName = mapping.buHandle;
            if (!mapping.deptName && mapping.deptHandle) mapping.deptName = mapping.deptHandle;
          }
          return mapping;
        })
      );
      
      setLocalMappings(enrichedMappings);
    } catch (error) {
      // Don't show error message as mappings might not exist yet
      setLocalMappings([]);
    } finally {
      setLoadingMappings(false);
    }
  };

  const handleAdd = async () => {
    if (!companyHandle) {
      message.warning('Please select an Organization');
      return;
    }
    if (!buHandle) {
      message.warning('Please select a Business Unit');
      return;
    }
    setAdding(true);
    try {
      const res = await HrmHolidayService.addMapping({
        site,
        groupHandle,
        buHandle,
        deptHandle,
        primaryFlag,
        mappedBy: userId,
      });
      
      if (res.success) {
        addMapping({
          ...res.data,
          buHandle: buHandle,
          buName: res.data.buName ?? buHandle,
          primaryFlag,
          mappedAt: res.data.mappedAt ?? new Date().toISOString(),
          mappedBy: userId,
        });
        // Reset form inputs
        setCompanyHandle(undefined);
        setBuHandle(undefined);
        setDeptHandle(undefined);
        setPrimaryFlag(false);
        // Show success message
        message.success('Mapping added successfully');
        // Reload mappings to get fresh data
        await loadMappings();
        // Notify parent and refresh data
        onMappingChanged();
        // Close the drawer
        onClose();
      } else {
        message.error(res.message || 'Failed to add mapping');
      }
    } catch (error: any) {
      // Extract error message from different possible error formats
      const errorMessage = 
        error?.response?.data?.message_details?.msg || 
        error?.response?.data?.message || 
        error?.message || 
        'Failed to add mapping';
      message.error(errorMessage);
      console.error('Add mapping error:', error);
    } finally {
      setAdding(false);
    }
  };

  const handleRemove = async (mappingHandle: string) => {
    setRemoving(mappingHandle);
    try {
      const res = await HrmHolidayService.removeMapping({
        site,
        groupHandle,
        mappingHandle,
        removedBy: userId,
      });
      if (res.success) {
        removeMapping(mappingHandle);
        message.success('Mapping removed');
        // Reload mappings to get fresh data
        await loadMappings();
        onMappingChanged();
      } else {
        message.error(res.message || 'Failed to remove mapping');
      }
    } catch (error: any) {
      // Extract error message from different possible error formats
      const errorMessage = 
        error?.response?.data?.message_details?.msg || 
        error?.response?.data?.message || 
        error?.message || 
        'Failed to remove mapping';
      message.error(errorMessage);
      console.error('Remove mapping error:', error);
    } finally {
      setRemoving(null);
    }
  };

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="Manage BU / Dept Mappings"
      width={520}
      destroyOnHidden
      footer={
        <div className={styles.drawerFooter}>
          <Button onClick={onClose}>Close</Button>
        </div>
      }
    >
      <Typography.Text strong>Add New Mapping</Typography.Text>
      <div style={{ marginTop: 12 }}>
        <Select
          placeholder="Select Organization..."
          value={companyHandle}
          onChange={setCompanyHandle}
          style={{ width: '100%', marginBottom: 8 }}
          showSearch
          loading={loadingCompanies}
          filterOption={(input, option) =>
            (option?.label as string)?.toLowerCase().includes(input.toLowerCase())
          }
          options={companies.map((company) => ({
            value: company.handle,
            label: company.companyName || company.legalName || company.tradeName || company.handle,
          }))}
        />
        <Select
          placeholder="Select Business Unit..."
          value={buHandle}
          onChange={setBuHandle}
          style={{ width: '100%', marginBottom: 8 }}
          showSearch
          loading={loadingBUs}
          disabled={!companyHandle}
          filterOption={(input, option) =>
            (option?.label as string)?.toLowerCase().includes(input.toLowerCase())
          }
          options={businessUnits.map((bu) => ({
            value: bu.handle,
            label: `${bu.buCode} - ${bu.buName}`,
          }))}
        />
        <Select
          placeholder="Select Department (optional)..."
          value={deptHandle}
          onChange={setDeptHandle}
          allowClear
          style={{ width: '100%', marginBottom: 8 }}
          showSearch
          loading={loadingDepts}
          disabled={!buHandle}
          filterOption={(input, option) =>
            (option?.label as string)?.toLowerCase().includes(input.toLowerCase())
          }
          options={departments.map((dept) => ({
            value: dept.handle,
            label: `${dept.deptCode} - ${dept.deptName}`,
          }))}
        />
        <Checkbox
          checked={primaryFlag}
          onChange={(e) => setPrimaryFlag(e.target.checked)}
          style={{ marginBottom: 12 }}
        >
          Set as Primary
        </Checkbox>
        <div>
          <Button type="primary" onClick={handleAdd} loading={adding} block>
            Add Mapping
          </Button>
        </div>
      </div>

      <Divider />

      <Typography.Text strong>Current Mappings ({localMappings.length})</Typography.Text>
      <div style={{ marginTop: 8 }}>
        {loadingMappings ? (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <Spin size="small" />
          </div>
        ) : localMappings.length === 0 ? (
          <Typography.Text type="secondary">No mappings yet.</Typography.Text>
        ) : (
          localMappings.map((m) => (
            <Spin key={m.handle} spinning={removing === m.handle} size="small">
              <BuMappingRow mapping={m} onRemove={handleRemove} canRemove />
            </Spin>
          ))
        )}
      </div>
    </Drawer>
  );
}
