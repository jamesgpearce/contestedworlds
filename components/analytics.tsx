'use client';
import { useEffect } from 'react';
import { analyticsCommands, analyticsEnabled } from '@/lib/analytics';
import { siteUrl, analyticsId } from '@/lib/site-config';

const measurementId = analyticsId;
let started = false;

export function Analytics() {
  useEffect(() => {
    if (
      started ||
      !analyticsEnabled(measurementId, siteUrl, window.location, navigator)
    )
      return;
    // Let the atlas hydrate and paint before requesting optional measurement code.
    const timer = setTimeout(() => {
      if (started) return;
      started = true;
      const target = window as Window & {
        dataLayer?: unknown[];
        gtag?: (...args: unknown[]) => void;
      };
      target.dataLayer ||= [];
      target.gtag = function () {
        // oxlint-disable-next-line prefer-rest-params -- Google's command queue uses its standard arguments object.
        target.dataLayer!.push(arguments);
      };
      for (const command of analyticsCommands(
        measurementId,
        siteUrl,
        document.title,
      ))
        target.gtag(...command);
      const script = document.createElement('script');
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
      document.head.append(script);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);
  return null;
}
