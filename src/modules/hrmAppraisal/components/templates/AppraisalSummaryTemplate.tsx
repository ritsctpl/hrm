'use client';

import React, { useEffect, useState } from "react";
import { Button, Card, Statistic, Tag, Typography } from "antd";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import PrintIcon from "@mui/icons-material/Print";
import RatingHistoryChart from "../organisms/RatingHistoryChart";
import BellCurveChart from "../organisms/BellCurveChart";
import { useHrmAppraisalStore } from "../../stores/hrmAppraisalStore";
import { HrmAppraisalService } from "../../services/hrmAppraisalService";
import { RATING_LABELS } from "../../utils/appraisalConstants";
import { parseCookies } from "nookies";
import { getOrganizationId } from '@/utils/cookieUtils';
import type { AppraisalHistory } from "../../types/domain.types";
import styles from "../../styles/AppraisalSummary.module.css";

const AppraisalSummaryTemplate: React.FC = () => {
  const { myReview, activeCycle, ratingDistribution, fetchRatingDistribution } =
    useHrmAppraisalStore();
  const [history, setHistory] = useState<Array<{ cycleLabel: string; rating: number }>>([]);

  useEffect(() => {
    const organizationId = getOrganizationId();
    const employeeId = parseCookies().employeeId ?? "";

    if (activeCycle?.cycleId) {
      fetchRatingDistribution(activeCycle.cycleId, myReview?.department ?? "");
    }

    if (employeeId) {
      HrmAppraisalService.getAppraisalHistory(organizationId, employeeId).then((history: AppraisalHistory) => {
        const points = history.reviews
          .filter((r) => r.finalRating > 0)
          .map((r) => ({
            cycleLabel: r.cycleId,
            rating: r.finalRating,
          }));
        setHistory(points);
      }).catch(() => {
        // silently fail
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCycle?.cycleId]);

  const finalRating = myReview?.finalRating ?? 0;
  const finalLabel = myReview?.finalRatingLabel ?? RATING_LABELS[Math.round(finalRating)] ?? "";
  const goalScore = myReview?.selfAssessment?.overallRating ?? 0;
  const competencyScore =
    myReview?.selfAssessment?.competencyRatings?.length
      ? myReview.selfAssessment.competencyRatings.reduce((s, c) => s + c.rating, 0) /
        myReview.selfAssessment.competencyRatings.length
      : 0;
  const peerAvg =
    myReview?.peerFeedback?.length
      ? myReview.peerFeedback.reduce((s, p) => {
          const avg =
            p.ratings.length > 0
              ? p.ratings.reduce((rs, r) => rs + r.rating, 0) / p.ratings.length
              : 0;
          return s + avg;
        }, 0) / myReview.peerFeedback.length
      : 0;

  const signOff = myReview?.signOff;

  return (
    <div className={styles.summaryRoot}>
      {/* Score Card */}
      <div className={styles.scoreCard}>
        <div className={styles.scoreRow}>
          <div className={styles.employeePhoto}>
            {(myReview?.employeeName ?? "?").charAt(0).toUpperCase()}
          </div>
          <div>
            <div className={styles.finalRating}>
              {finalRating.toFixed(1)} / 5.0
            </div>
            <Typography.Text strong>{finalLabel}</Typography.Text>
            <div>
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                {myReview?.employeeName} | {myReview?.department} | {myReview?.designation}
              </Typography.Text>
            </div>
            <div>
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                Manager: {myReview?.reportingManagerName} | {myReview?.reviewId}
              </Typography.Text>
            </div>
          </div>
        </div>

        <div className={styles.scoreBreakdown}>
          <Statistic
            title={`Goals Score (${activeCycle?.goalWeightPercentage ?? 70}% weight)`}
            value={goalScore.toFixed(1)}
            suffix="/ 5.0"
          />
          <Statistic
            title={`Competency Score (${activeCycle?.competencyWeightPercentage ?? 30}% weight)`}
            value={competencyScore.toFixed(1)}
            suffix="/ 5.0"
          />
          <Statistic
            title="Peer Avg Score (informational)"
            value={peerAvg.toFixed(1)}
            suffix="/ 5.0"
          />
        </div>
      </div>

      {/* Rating History */}
      {history.length > 0 && (
        <div className={styles.chartContainer}>
          <Typography.Text strong>Rating History</Typography.Text>
          <RatingHistoryChart history={history} />
        </div>
      )}

      {/* Bell Curve */}
      {ratingDistribution && (
        <div className={styles.chartContainer}>
          <Typography.Text strong>Department Distribution</Typography.Text>
          <BellCurveChart
            distribution={ratingDistribution}
            highlightEmployeeRating={Math.round(finalRating)}
          />
        </div>
      )}

      {/* Sign-Off + PIP */}
      <div className={styles.signOffPanel}>
        <Card size="small" title="Sign-Off Status">
          <div>
            Employee:{" "}
            {signOff?.employeeAcknowledged ? (
              <Tag color="green">Acknowledged {signOff.employeeAcknowledgedDate}</Tag>
            ) : (
              <Tag color="orange">Pending</Tag>
            )}
          </div>
          <div style={{ marginTop: 8 }}>
            Manager:{" "}
            {signOff?.managerSignedOff ? (
              <Tag color="green">Signed Off {signOff.managerSignOffDate}</Tag>
            ) : (
              <Tag color="orange">Pending</Tag>
            )}
          </div>
          <div style={{ marginTop: 8 }}>
            HR:{" "}
            {signOff?.hrSignedOff ? (
              <Tag color="green">Signed Off {signOff.hrSignOffDate}</Tag>
            ) : (
              <Tag color="orange">Pending</Tag>
            )}
          </div>
        </Card>

        <Card size="small" title="PIP Status">
          {finalRating >= 3 ? (
            <Typography.Text type="success">
              Not Applicable (Rating {finalRating.toFixed(1)} is 3 or above)
            </Typography.Text>
          ) : (
            <Typography.Text type="warning">
              May be subject to Performance Improvement Plan
            </Typography.Text>
          )}
        </Card>
      </div>

      {/* Download / Print */}
      <div className={styles.downloadBar}>
        <Button icon={<FileDownloadIcon fontSize="small" />}>Download PDF Report</Button>
        <Button icon={<PrintIcon fontSize="small" />}>Print</Button>
      </div>
    </div>
  );
};

export default AppraisalSummaryTemplate;
