import type { Metadata } from "next";
import "../globals.css";

export const metadata: Metadata = {
  title: "Sustainability Map",
  description: "Embedded sustainability map viewer.",
};

/** Minimal layout for embed — no extra chrome */
export default function EmbedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link
          rel="stylesheet"
          href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
          integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
          crossOrigin=""
        />
      </head>
      <body className="m-0 p-0 overflow-hidden">{children}</body>
    </html>
  );
}
