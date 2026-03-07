"use client";

import React, { useEffect } from "react";
import { Button, Typography } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { parseCookies } from "nookies";
import CommonAppBar from "@/components/CommonAppBar";
import { useHrmExpenseStore } from "./stores/hrmExpenseStore";
import { useExpenseData } from "./hooks/useExpenseData";
import ExpenseSearchBar from "./components/molecules/ExpenseSearchBar";
import ExpenseListTable from "./components/organisms/ExpenseListTable";
import ExpenseMasterDetailTemplate from "./components/templates/ExpenseMasterDetailTemplate";
import ExpenseScreenHeader from "./components/organisms/ExpenseScreenHeader";
import HrmExpenseScreen from "./HrmExpenseScreen";
import styles from "./styles/Expense.module.css";

const { Text } = Typography;

const HrmExpenseLanding: React.FC = () => {
  const cookies = parseCookies();
  const site = cookies.site ?? "";

  const {
    myExpenses,
    listLoading,
    selectedExpense,
    screenMode,
    setSelectedExpense,
    setScreenMode,
    resetFormState,
  } = useHrmExpenseStore();

  const { loadMyExpenses, loadCategories, loadMileageConfig } = useExpenseData();

  useEffect(() => {
    loadMyExpenses();
    loadCategories();
    loadMileageConfig();
  }, [site]);

  const handleNewExpense = () => {
    setSelectedExpense(null);
    resetFormState();
    setScreenMode("create");
  };

  const handleRowClick = (expense: typeof myExpenses[0]) => {
    setSelectedExpense(expense);
    setScreenMode("view");
  };

  const handleBack = () => {
    setScreenMode("list");
    setSelectedExpense(null);
  };

  const handleActionComplete = () => {
    loadMyExpenses();
    setSelectedExpense(null);
    setScreenMode("list");
  };

  const detailPanel =
    screenMode === "create" || (screenMode !== "list" && selectedExpense) ? (
      <HrmExpenseScreen
        expense={selectedExpense}
        mode={screenMode === "create" ? "create" : "view"}
        onBack={handleBack}
        onActionComplete={handleActionComplete}
      />
    ) : (
      <div className={styles.emptyState}>
        <div style={{ fontSize: 48, opacity: 0.3 }}>📋</div>
        <Text type="secondary">Select a report to view details</Text>
      </div>
    );

  return (
    <div className={styles.landing}>
      <CommonAppBar appTitle="Expense Reports" />
      <ExpenseScreenHeader
        title="My Expense Reports"
        actions={
          <Button type="primary" icon={<PlusOutlined />} onClick={handleNewExpense}>
            New Expense
          </Button>
        }
      />
      <ExpenseSearchBar onSearch={loadMyExpenses} />
      <ExpenseMasterDetailTemplate
        listPanel={
          <ExpenseListTable
            expenses={myExpenses}
            loading={listLoading}
            selectedHandle={selectedExpense?.handle}
            onRowClick={handleRowClick}
            onNewExpense={handleNewExpense}
          />
        }
        detailPanel={detailPanel}
      />
    </div>
  );
};

export default HrmExpenseLanding;
