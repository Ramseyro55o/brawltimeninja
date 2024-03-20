import { App, InjectionKey } from "vue"
import { Router } from "vue-router"
import * as Sentry from '@sentry/vue'
import {
  httpClientIntegration,
  captureConsoleIntegration,
  extraErrorDataIntegration,
  reportingObserverIntegration,
  rewriteFramesIntegration,
} from '@sentry/integrations'

export const SentryInjectionKey = Symbol('sentry') as InjectionKey<typeof Sentry>

export function initSentry(dsn: string, app: App<Element>, router?: Router) {
  Sentry.init({
    app,
    dsn,
    debug: import.meta.env.DEV,
    autoSessionTracking: true,
    integrations: [
      extraErrorDataIntegration(),
      reportingObserverIntegration(),
      rewriteFramesIntegration(),
      captureConsoleIntegration({
        levels: ['error', 'assert']
      }),
      httpClientIntegration(),
      Sentry.browserTracingIntegration({
        router,
        tracePropagationTargets: ['localhost', /^https?:\/\/brawltime\.ninja/],
        enableInp: true,
      }),
      Sentry.browserProfilingIntegration(),
      Sentry.replayIntegration({
        maskAllText: false,
        maskAllInputs: false,
        blockAllMedia: false,
      }),
    ],
    ignoreErrors: [
      // ignore common errors triggered by ads
      'ReportingObserver [deprecation]',
      '[GPT] ',
      'SYNC.JS',
      'ox_esp',
      'Tyche blocked',
    ],
    allowUrls: [/https?:\/\/brawltime\.ninja/],
    replaysSessionSampleRate: 0.0005,
    replaysOnErrorSampleRate: 0.01,
    tracesSampleRate: 0.01,
    profilesSampleRate: 0.25, // relative to tracesSampleRate
    trackComponents: true,
    beforeSend(event, hint) {
      const error = hint.originalException as any

      if (error && error.name == 'Error' && error.message.length == 0) {
        // cube.js RequestError, ignore
        // FIXME import it from cubejs and match the class
        return null
      }

      if (error == 'Hydration completed but contains mismatches.') {
        // ignore hydration mismatches when the page is auto-translated
        const isAutoTranslated = !!document.querySelector('html.translated-ltr, head.translated-rtl, ya-tr-span, *[_msttexthash]')

        if (isAutoTranslated) {
          return null
        }
      }

      return event
    },
  })

  app.provide(SentryInjectionKey, Sentry)
}