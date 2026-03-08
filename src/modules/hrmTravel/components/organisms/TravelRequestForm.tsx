"use client";

import React from "react";
import { Form, Input, Radio, Button } from "antd";
import type { TravelType, TravelMode } from "../../types/domain.types";
import type { TravelFormState } from "../../types/ui.types";
import { ALLOWED_MODES_BY_TYPE, TRAVEL_MODE_LABELS } from "../../utils/travelConstants";
import ItineraryRow from "../molecules/ItineraryRow";
import styles from "../../styles/TravelForm.module.css";

interface Props {
  formState: TravelFormState;
  onChange: (changes: Partial<TravelFormState>) => void;
  readonly?: boolean;
}

const TRAVEL_TYPES: TravelType[] = ["LOCAL", "DOMESTIC", "INTERNATIONAL"];

const TravelRequestForm: React.FC<Props> = ({ formState, onChange, readonly }) => {
  const allowedModes = formState.travelType
    ? ALLOWED_MODES_BY_TYPE[formState.travelType]
    : [];

  return (
    <Form layout="vertical" component="div">
      <div className={styles.formSection}>
        <div className={styles.sectionTitle}>Travel Type</div>
        <Radio.Group
          value={formState.travelType}
          onChange={(e) => onChange({ travelType: e.target.value, travelMode: null })}
          disabled={readonly}
        >
          {TRAVEL_TYPES.map((t) => (
            <Radio key={t} value={t}>
              {t.charAt(0) + t.slice(1).toLowerCase()}
            </Radio>
          ))}
        </Radio.Group>
      </div>

      <div className={styles.formSection}>
        <Form.Item label="Purpose" required>
          <Input.TextArea
            placeholder="Official purpose description (max 500 characters)"
            maxLength={500}
            showCount
            rows={3}
            value={formState.purpose}
            onChange={(e) => onChange({ purpose: e.target.value })}
            disabled={readonly}
          />
        </Form.Item>
      </div>

      <div className={styles.formSection}>
        <div className={styles.sectionTitle}>Destination</div>
        <div className={styles.fieldRow}>
          <Form.Item label="City" required>
            <Input
              placeholder="City"
              value={formState.destinationCity}
              onChange={(e) => onChange({ destinationCity: e.target.value })}
              disabled={readonly}
            />
          </Form.Item>
          {(formState.travelType === "DOMESTIC" || formState.travelType === "INTERNATIONAL") && (
            <Form.Item label="State">
              <Input
                placeholder="State"
                value={formState.destinationState}
                onChange={(e) => onChange({ destinationState: e.target.value })}
                disabled={readonly}
              />
            </Form.Item>
          )}
          {formState.travelType === "INTERNATIONAL" && (
            <Form.Item label="Country">
              <Input
                placeholder="Country"
                value={formState.destinationCountry}
                onChange={(e) => onChange({ destinationCountry: e.target.value })}
                disabled={readonly}
              />
            </Form.Item>
          )}
        </div>
      </div>

      {formState.travelType && (
        <div className={styles.formSection}>
          <div className={styles.sectionTitle}>Schedule</div>
          <ItineraryRow
            travelType={formState.travelType}
            value={formState}
            onChange={(field, value) => onChange({ [field]: value } as Partial<TravelFormState>)}
            readonly={readonly}
          />
        </div>
      )}

      {allowedModes.length > 0 && (
        <div className={styles.formSection}>
          <div className={styles.sectionTitle}>Travel Mode</div>
          <div className={styles.modeGroup}>
            {allowedModes.map((mode: TravelMode) => (
              <Button
                key={mode}
                type={formState.travelMode === mode ? "primary" : "default"}
                onClick={() => !readonly && onChange({ travelMode: mode })}
                disabled={readonly}
                className={styles.modeButton}
              >
                {TRAVEL_MODE_LABELS[mode]}
              </Button>
            ))}
          </div>
        </div>
      )}

      <div className={styles.formSection}>
        <Form.Item label="Remarks">
          <Input.TextArea
            placeholder="Optional remarks..."
            rows={2}
            value={formState.remarks}
            onChange={(e) => onChange({ remarks: e.target.value })}
            disabled={readonly}
          />
        </Form.Item>
      </div>
    </Form>
  );
};

export default TravelRequestForm;
