'use client';
import { useEffect } from 'react';
import {
  analyticsCommands,
  analyticsEnabled,
  deferAnalytics,
} from '@/lib/analytics';
import { siteUrl, analyticsId } from '@/lib/site-config';

const measurementId = analyticsId;
let started = false;
let queued = false;

export function Analytics() {
  useEffect(() => {
    if (
      started ||
      !analyticsEnabled(measurementId, siteUrl, window.location, navigator)
    )
      return;
    if (!queued) {
      queued = true;
      const target = window as Window & {
        dataLayer?: unknown[];
        gtag?: (...args: unknown[]) => void;
      };
      target.dataLayer ||= [];
      target.gtag = function () {
        // eslint-disable-next-line prefer-rest-params -- Google's command queue uses its standard arguments object.
        target.dataLayer!.push(arguments);
      };
      for (const command of analyticsCommands(
        measurementId,
        siteUrl,
        document.title,
      ))
        target.gtag(...command);
    }
    return deferAnalytics(() => {
      if (started) return;
      started = true;
      const script = document.createElement('script');
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
      document.head.append(script);
    });
  }, []);
  return null;
}
