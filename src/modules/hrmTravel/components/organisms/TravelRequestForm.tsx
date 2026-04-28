"use client";

import React, { useMemo } from "react";
import { Form, Input, Radio, Button, Select } from "antd";
import type { TravelType, TravelMode } from "../../types/domain.types";
import type { TravelFormState } from "../../types/ui.types";
import type { TravelFormErrors } from "../../utils/travelValidations";
import { ALLOWED_MODES_BY_TYPE, TRAVEL_MODE_LABELS } from "../../utils/travelConstants";
import { COUNTRY_OPTIONS, COUNTRY_STATES } from "../../../hrmOrganization/utils/constants";
import { STATE_CITIES } from "../../../hrmOrganization/utils/locationSearch";
import ItineraryRow from "../molecules/ItineraryRow";
import styles from "../../styles/TravelForm.module.css";

interface Props {
  formState: TravelFormState;
  onChange: (changes: Partial<TravelFormState>) => void;
  readonly?: boolean;
  errors?: TravelFormErrors;
}

const TRAVEL_TYPES: TravelType[] = ["LOCAL", "DOMESTIC", "INTERNATIONAL"];

const TravelRequestForm: React.FC<Props> = ({ formState, onChange, readonly, errors = {} }) => {
  const allowedModes = formState.travelType
    ? ALLOWED_MODES_BY_TYPE[formState.travelType]
    : [];

  // For DOMESTIC, country is implicitly India and hidden from the UI.
  // For INTERNATIONAL, the user selects one of COUNTRY_OPTIONS.
  const effectiveCountry =
    formState.travelType === "INTERNATIONAL"
      ? formState.destinationCountry || ""
      : formState.travelType === "DOMESTIC"
      ? "India"
      : "";

  const stateOptions = useMemo(() => {
    if (!effectiveCountry) return [];
    return (COUNTRY_STATES[effectiveCountry] || []).map((s) => ({ label: s, value: s }));
  }, [effectiveCountry]);

  const cityOptions = useMemo(() => {
    const state = formState.destinationState || "";
    if (!state) return [];
    return (STATE_CITIES[state] || []).map((c) => ({ label: c, value: c }));
  }, [formState.destinationState]);

  return (
    <Form layout="vertical" component="div">
      <div className={styles.formSection}>
        <div className={styles.sectionTitle}>Travel Type</div>
        <Form.Item
          validateStatus={errors.travelType ? "error" : undefined}
          help={errors.travelType}
          style={{ marginBottom: 0 }}
        >
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
        </Form.Item>
      </div>

      <div className={styles.formSection}>
        <Form.Item
          label="Purpose"
          required
          validateStatus={errors.purpose ? "error" : undefined}
          help={errors.purpose}
        >
          <Input.TextArea
            placeholder="Official purpose description (max 500 characters)"
            maxLength={500}
            rows={2}
            value={formState.purpose}
            onChange={(e) => onChange({ purpose: e.target.value })}
            disabled={readonly}
          />
        </Form.Item>
      </div>

      <div className={styles.formSection}>
        <div className={styles.sectionTitle}>Destination</div>
        <div className={styles.fieldRow}>
          {formState.travelType === "INTERNATIONAL" && (
            <Form.Item
              label="Country"
              required
              validateStatus={errors.destinationCountry ? "error" : undefined}
              help={errors.destinationCountry}
            >
              <Select
                placeholder="Select country"
                value={formState.destinationCountry || undefined}
                onChange={(val) =>
                  onChange({
                    destinationCountry: val ?? "",
                    destinationState: "",
                    destinationCity: "",
                  })
                }
                options={[...COUNTRY_OPTIONS]}
                showSearch
                allowClear
                optionFilterProp="label"
                disabled={readonly}
                style={{ width: "100%" }}
              />
            </Form.Item>
          )}
          {(formState.travelType === "DOMESTIC" || formState.travelType === "INTERNATIONAL") && (
            <Form.Item
              label="State"
              required
              validateStatus={errors.destinationState ? "error" : undefined}
              help={errors.destinationState}
            >
              <Select
                placeholder={
                  formState.travelType === "INTERNATIONAL" && !formState.destinationCountry
                    ? "Select country first"
                    : "Select state"
                }
                value={formState.destinationState || undefined}
                onChange={(val) =>
                  onChange({ destinationState: val ?? "", destinationCity: "" })
                }
                options={stateOptions}
                showSearch
                allowClear
                optionFilterProp="label"
                disabled={
                  readonly ||
                  (formState.travelType === "INTERNATIONAL" && !formState.destinationCountry)
                }
                style={{ width: "100%" }}
              />
            </Form.Item>
          )}
          <Form.Item
            label="City"
            required
            validateStatus={errors.destinationCity ? "error" : undefined}
            help={errors.destinationCity}
          >
            {formState.travelType === "LOCAL" ? (
              <Input
                placeholder="City"
                value={formState.destinationCity}
                onChange={(e) => onChange({ destinationCity: e.target.value })}
                disabled={readonly}
              />
            ) : (
              <Select
                placeholder={
                  formState.destinationState ? "Select city" : "Select state first"
                }
                value={formState.destinationCity || undefined}
                onChange={(val) => onChange({ destinationCity: val ?? "" })}
                options={cityOptions}
                showSearch
                allowClear
                optionFilterProp="label"
                disabled={readonly || !formState.destinationState}
                style={{ width: "100%" }}
                popupRender={(menu) => (
                  <>
                    {menu}
                    {formState.destinationState && (
                      <div style={{ borderTop: "1px solid #f0f0f0", padding: "6px 10px" }}>
                        <Input
                          size="small"
                          placeholder="Can't find it? Type a custom city + press Enter"
                          onPressEnter={(e) => {
                            const val = (e.target as HTMLInputElement).value.trim();
                            if (val) onChange({ destinationCity: val });
                          }}
                        />
                      </div>
                    )}
                  </>
                )}
              />
            )}
          </Form.Item>
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
            errors={{
              travelDate: errors.travelDate,
              startHour: errors.startHour,
              endHour: errors.endHour,
              startDate: errors.startDate,
              endDate: errors.endDate,
            }}
          />
        </div>
      )}

      {allowedModes.length > 0 && (
        <div className={styles.formSection}>
          <div className={styles.sectionTitle}>Travel Mode</div>
          <Form.Item
            validateStatus={errors.travelMode ? "error" : undefined}
            help={errors.travelMode}
            style={{ marginBottom: 0 }}
          >
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
          </Form.Item>
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
