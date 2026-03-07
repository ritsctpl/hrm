// app/LoadingWrapper.tsx
"use client";

import { ReactNode, useEffect, useState } from "react";
import Box from "@mui/material/Box";
import { Spin } from "antd";

interface LoadingWrapperProps {
  children: ReactNode;
  isLoading?: boolean;
}

const LoadingWrapper = ({
  children,
  isLoading = false,
}: LoadingWrapperProps) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Show loading during initial mount or when isLoading is true
  if (!mounted || isLoading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          width: "100%",
          position: "fixed",
          top: 0,
          left: 0,
          backgroundColor: "white",
          zIndex: 9999,
        }}
      >
        <Spin size="large" />
      </Box>
    );
  }

  return <>{children}</>;
};

export default LoadingWrapper;
