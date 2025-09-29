import { ScrollViewStyleReset } from "expo-router/html";
import type { PropsWithChildren } from "react";
import { Colors } from "../constants/Colors";

// This file is web-only and used to configure the root HTML for every
// web page during static rendering.
// The contents of this function only run in Node.js environments and
// do not have access to the DOM or browser APIs.
export default function Root({ children }: PropsWithChildren<Record<string, unknown>>) {
    return (
        <html lang="pt-AO">
            <head>
                <meta charSet="utf-8" />
                <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
                <meta
                    name="viewport"
                    content="width=device-width, initial-scale=1, shrink-to-fit=no"
                />
                {/* Recommended PWA meta tags: use project colors for light/dark */}
                <meta
                    name="theme-color"
                    content={Colors.light.tint}
                    media="(prefers-color-scheme: light)"
                />
                <meta
                    name="theme-color"
                    content={Colors.dark.background}
                    media="(prefers-color-scheme: dark)"
                />
                <meta name="apple-mobile-web-app-capable" content="yes" />
                <meta name="apple-mobile-web-app-status-bar-style" content="default" />
                <meta name="msapplication-TileColor" content="#000000" />
                <meta name="autor" content="António Teca e António Sebastião" />
                <meta
                    name="description"
                    content="Check Cadet uma aplicação criada para facilitar a gestão de refeições e eventos no campus da 42."
                />
                <meta
                    name="keywords"
                    content="Check Cadet, 42, refeições, eventos, gestão, campus"
                />
                <meta name="robots" content="index, follow" />
                <meta name="googlebot" content="index, follow" />
                <title>Check Cadet</title>

                {/* Link the PWA manifest file. */}
                <link rel="manifest" href="/manifest.json" />

                {/* Icons for PWA and various devices */}
                <link
                    rel="icon"
                    href="/android-chrome-192x192.png"
                    sizes="192x192"
                />
                <link
                    rel="icon"
                    href="/android-chrome-512x512.png"
                    sizes="512x512"
                />
                <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
                <link rel="icon" href="/favicon-16x16.png" sizes="16x16" />
                <link rel="icon" href="/favicon-32x32.png" sizes="32x32" />
                <link rel="shortcut icon" href="/favicon.ico" />

                {/*
          Disable body scrolling on web. This makes ScrollView components work closer to how they do on native.
          However, body scrolling is often nice to have for mobile web. If you want to enable it, remove this line.
        */}
                <ScrollViewStyleReset />

                {/* Add any additional <head> elements that you want globally available on web... */}
            </head>
            <body>{children}</body>
        </html>
    );
}
