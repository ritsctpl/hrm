"use client";

// TECH-DEBT: Polyfill required because Web Crypto API (crypto.subtle) is unavailable
// on HTTP (non-secure context). Needed for keycloak-js v26 PKCE on http://192.168.147.129.
// Fix: deploy FENTAMES over HTTPS — polyfill becomes a no-op and can be removed.
// Tracking: upgrade_gap.md §6.3
if (typeof globalThis !== 'undefined' && typeof globalThis.crypto !== 'undefined') {
  if (typeof globalThis.crypto.randomUUID === 'undefined') {
    (globalThis.crypto as any).randomUUID = () => {
      const bytes = globalThis.crypto.getRandomValues(new Uint8Array(16));
      bytes[6] = (bytes[6] & 0x0f) | 0x40;
      bytes[8] = (bytes[8] & 0x3f) | 0x80;
      const hex = Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
      return `${hex.slice(0,8)}-${hex.slice(8,12)}-${hex.slice(12,16)}-${hex.slice(16,20)}-${hex.slice(20)}`;
    };
  }
  if (typeof globalThis.crypto.subtle === 'undefined') {
    // Minimal SHA-256 polyfill for keycloak-js PKCE challenge generation
    const sha256 = async (data: ArrayBuffer): Promise<ArrayBuffer> => {
      const bytes = new Uint8Array(data);
      const K = new Uint32Array([
        0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,
        0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,
        0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,
        0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,
        0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,
        0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,
        0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,
        0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2
      ]);
      const rotr = (n: number, x: number) => (x >>> n) | (x << (32 - n));
      const len = bytes.length;
      const bitLen = len * 8;
      const padLen = len % 64 < 56 ? 56 - len % 64 : 120 - len % 64;
      const padded = new Uint8Array(len + padLen + 8);
      padded.set(bytes);
      padded[len] = 0x80;
      const view = new DataView(padded.buffer);
      view.setUint32(padded.length - 4, bitLen, false);
      let [h0,h1,h2,h3,h4,h5,h6,h7] = [0x6a09e667,0xbb67ae85,0x3c6ef372,0xa54ff53a,0x510e527f,0x9b05688c,0x1f83d9ab,0x5be0cd19];
      for (let i = 0; i < padded.length; i += 64) {
        const w = new Uint32Array(64);
        for (let t = 0; t < 16; t++) w[t] = view.getUint32(i + t * 4, false);
        for (let t = 16; t < 64; t++) {
          const s0 = rotr(7, w[t-15]) ^ rotr(18, w[t-15]) ^ (w[t-15] >>> 3);
          const s1 = rotr(17, w[t-2]) ^ rotr(19, w[t-2]) ^ (w[t-2] >>> 10);
          w[t] = (w[t-16] + s0 + w[t-7] + s1) >>> 0;
        }
        let [a,b,c,d,e,f,g,h] = [h0,h1,h2,h3,h4,h5,h6,h7];
        for (let t = 0; t < 64; t++) {
          const S1 = rotr(6,e) ^ rotr(11,e) ^ rotr(25,e);
          const ch = (e & f) ^ (~e & g);
          const temp1 = (h + S1 + ch + K[t] + w[t]) >>> 0;
          const S0 = rotr(2,a) ^ rotr(13,a) ^ rotr(22,a);
          const maj = (a & b) ^ (a & c) ^ (b & c);
          const temp2 = (S0 + maj) >>> 0;
          h=g; g=f; f=e; e=(d+temp1)>>>0; d=c; c=b; b=a; a=(temp1+temp2)>>>0;
        }
        h0=(h0+a)>>>0; h1=(h1+b)>>>0; h2=(h2+c)>>>0; h3=(h3+d)>>>0;
        h4=(h4+e)>>>0; h5=(h5+f)>>>0; h6=(h6+g)>>>0; h7=(h7+h)>>>0;
      }
      const result = new ArrayBuffer(32);
      const rv = new DataView(result);
      [h0,h1,h2,h3,h4,h5,h6,h7].forEach((v, i) => rv.setUint32(i * 4, v, false));
      return result;
    };
    (globalThis.crypto as any).subtle = { digest: (_algo: string, data: ArrayBuffer) => sha256(data) };
  }
}

import '@ant-design/v5-patch-for-react-19';
import "./globals.css";
import { ReactNode, useEffect } from "react";
import { AuthProvider } from "../context/AuthContext";
import "@/utils/i18n";
import LoadingWrapper from "@components/LoadingWrapper";
import { ThemeProviderComponent } from "@components/ThemeContext";
import RbacProvider from "@components/RbacProvider";
import AppSidebar from "@components/AppSidebar";
import AppFooter from "@components/AppFooter";
import himalayaLogo from "../../public/ico/himalaya.ico";
import ritsLogo from "../../public/ico/rits.ico";
import exideLogo from "../../public/ico/exide.ico";
import tempicon from "./favicon.ico";
import { parseCookies } from "nookies";
import { fetchSiteAll } from "@services/siteServices";

export default function RootLayout({ children }: { children: ReactNode }) {
  useEffect(() => {
    const loadConfig = async () => {
      // console.log("before Loading layout tsx window runtime config:", window.runtimeConfig);
      if (!window.runtimeConfig) {
        const basePath = '/hrm';
        const response = await fetch(`${basePath}/api/config`);
        const config = await response.json();
        window.runtimeConfig = config;
      }
    };

    const setFavicon = async () => {
      const favicon = document.querySelector(
        "link[rel='icon']"
      ) as HTMLLinkElement;
      const cookies = parseCookies();
      const currentSite = cookies.site;

      let iconPath = tempicon.src;

      if (currentSite) {
        try {
          const siteDetails = await fetchSiteAll(currentSite);
          if (siteDetails?.theme?.logo) {
            const imageMap = {
              "/images/rits-logo.png": ritsLogo.src,
              "/images/image1.png": himalayaLogo.src,
              "/images/EXIDE-logo.png": exideLogo.src,
            };
            iconPath =
              imageMap[siteDetails.theme.logo] || siteDetails.theme.logo;
          }
        } catch (error) {
          iconPath = tempicon.src;
          console.error("Error fetching site details:", error);
        }
      }

      if (!favicon) {
        const newFavicon = document.createElement("link");
        newFavicon.rel = "icon";
        newFavicon.href = iconPath;
        document.head.appendChild(newFavicon);
      } else {
        favicon.href = iconPath;
      }
    };

    loadConfig();
    setFavicon();
  }, []);

  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <RbacProvider>
            <ThemeProviderComponent>
              <LoadingWrapper>
                <div style={{ display: 'flex', minHeight: '100vh' }}>
                  <AppSidebar />
                  <div style={{ flex: 1, marginLeft: 56, paddingBottom: 32, minHeight: 0, display: 'flex', flexDirection: 'column' as const }}>
                    {children}
                  </div>
                </div>
                <AppFooter />
              </LoadingWrapper>
            </ThemeProviderComponent>
          </RbacProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
