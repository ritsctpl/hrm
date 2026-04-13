/**
 * SkillsTab - View and manage employee skills with proficiency levels
 */

'use client';

import React, { useState, useCallback } from 'react';
import { Button, Input, Select, Modal, Empty, message } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { parseCookies } from 'nookies';
import EmpSkillTag from '../molecules/EmpSkillTag';
import { HrmEmployeeService } from '../../services/hrmEmployeeService';
import Can from '../../../hrmAccess/components/Can';
import { useCan } from '../../../hrmAccess/hooks/useCan';
import { PROFICIENCY_LABELS } from '../../utils/constants';
import type { ProfileTabProps } from '../../types/ui.types';
import type { Skill, SkillProficiency } from '../../types/domain.types';
import styles from '../../styles/HrmEmployeeTable.module.css';

const SkillsTab: React.FC<ProfileTabProps & { onRefresh: () => void }> = ({
  profile,
  onRefresh,
}) => {
  const { skills } = profile;
  const { canDelete } = useCan(undefined, 'employee_skill');
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [skillName, setSkillName] = useState('');
  const [proficiency, setProficiency] = useState<SkillProficiency>('INTERMEDIATE');
  const [loading, setLoading] = useState(false);

  const handleAdd = useCallback(async () => {
    if (!skillName.trim()) {
      message.warning('Please enter a skill name');
      return;
    }

    setLoading(true);
    try {
      const cookies = parseCookies();
      const site = cookies.site;
      const modifiedBy = cookies.username || 'system';

      const newSkill: Skill = {
        skillName: skillName.trim(),
        proficiencyLevel: proficiency,
      };

      await HrmEmployeeService.addSkill(site, profile.handle, newSkill, modifiedBy);
      message.success('Skill added');
      setAddModalOpen(false);
      setSkillName('');
      setProficiency('INTERMEDIATE');
      onRefresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to add skill';
      message.error(msg);
    } finally {
      setLoading(false);
    }
  }, [skillName, proficiency, profile.handle, onRefresh]);

  const handleRemove = useCallback(
    async (skillId: string) => {
      try {
        const cookies = parseCookies();
        const site = cookies.site;
        const modifiedBy = cookies.username || 'system';

        await HrmEmployeeService.removeSkill(site, profile.handle, skillId, modifiedBy);
        message.success('Skill removed');
        onRefresh();
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to remove skill';
        message.error(msg);
      }
    },
    [profile.handle, onRefresh]
  );

  return (
    <div className={styles.tabContent}>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
        <Can I="add" object="employee_skill">
          <Button
            type="primary"
            size="small"
            onClick={() => setAddModalOpen(true)}
          >
            Add Skill
          </Button>
        </Can>
      </div>

      {skills.length === 0 ? (
        <Empty description="No skills recorded" />
      ) : (
        <div className={styles.skillsGrid}>
          {skills.map((skill) => (
            <EmpSkillTag
              key={skill.skillId}
              skill={skill}
              removable={canDelete}
              onRemove={handleRemove}
            />
          ))}
        </div>
      )}

      <Modal
        title="Add Skill"
        open={addModalOpen}
        onOk={handleAdd}
        onCancel={() => setAddModalOpen(false)}
        confirmLoading={loading}
        okText="Add"
        destroyOnHidden
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '12px 0' }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 500, display: 'block', marginBottom: 4 }}>
              Skill Name
            </label>
            <Input
              value={skillName}
              onChange={(e) => setSkillName(e.target.value)}
              placeholder="e.g. React, Welding, SAP"
            />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 500, display: 'block', marginBottom: 4 }}>
              Proficiency
            </label>
            <Select
              value={proficiency}
              onChange={(val) => setProficiency(val)}
              style={{ width: '100%' }}
              options={Object.entries(PROFICIENCY_LABELS).map(([v, l]) => ({
                value: v,
                label: l,
              }))}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default SkillsTab;
