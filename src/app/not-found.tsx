"use client";
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Spin } from 'antd';
import { HomeOutlined } from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';
import NotFoundPng from '../images/page-not-found.jpg';

const NotFoundPage = () => {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [secondsLeft, setSecondsLeft] = useState(5);

  // During the Keycloak login round-trip the app can momentarily resolve to an
  // unmatched URL (the OAuth callback) before authentication settles, which
  // would otherwise flash this 404 screen for ~5 seconds. While auth is still
  // resolving, skip the 404 UI entirely: show a spinner and send the user
  // straight to the home page.
  const isAuthTransition = !isAuthenticated;

  const handleGoHome = () => {
    router.push('/');
  };

  useEffect(() => {
    if (isAuthTransition) {
      router.replace('/');
    }
  }, [isAuthTransition, router]);

  // Only run the visible countdown for a genuine 404 (authenticated user who
  // navigated to a missing route).
  useEffect(() => {
    if (isAuthTransition) return;
    const timer = setInterval(() => {
      setSecondsLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          router.push('/');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isAuthTransition, router]);

  if (isAuthTransition) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        textAlign: 'center',
      }}
    >
      <img
        src={NotFoundPng.src}
        alt="404 Page Not Found"
        style={{ maxWidth: '400px', marginBottom: '20px', display: 'block' }}
      />
      <h1>404 - Page Not Found</h1>
      <p>The page you are looking for does not exist.</p>
      <Button
        onClick={handleGoHome}
        style={{ padding: '10px 20px', fontSize: '16px', marginTop: '20px' }}
        icon={<HomeOutlined />}
      >
        Go to Home
      </Button>
      <p style={{ marginTop: '20px' }}>
        Redirecting to home in {secondsLeft} second{secondsLeft !== 1 ? 's' : ''}...
      </p>
    </div>
  );
};

export default NotFoundPage;
