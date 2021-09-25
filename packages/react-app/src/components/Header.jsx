import { PageHeader } from "antd";
import React from "react";

// displays a page header

export default function Header() {
  return (
    <a href="https://kernel.community" target="_blank" rel="noopener noreferrer">
      <PageHeader
        title="🌱 Playtime"
        subTitle="⏳ Time Traveller"
        style={{ cursor: "pointer" }}
      />
    </a>
  );
}
