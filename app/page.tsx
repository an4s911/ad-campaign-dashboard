"use client";

import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import ProductsTab from "@/components/ProductsTab";
import CampaignsTab from "@/components/CampaignsTab";

type Tab = "products" | "campaigns";

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<Tab>("products");

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
      <main className="flex-1 overflow-y-auto bg-gray-50 p-8">
        {activeTab === "products" && <ProductsTab />}
        {activeTab === "campaigns" && <CampaignsTab />}
      </main>
    </div>
  );
}
