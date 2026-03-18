"use client";

import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import ProductsTab from "@/components/ProductsTab";

type Tab = "products" | "campaigns";

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<Tab>("products");

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
      <main className="flex-1 overflow-y-auto bg-gray-50 p-8">
        {activeTab === "products" && <ProductsTab />}
        {activeTab === "campaigns" && (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-200">
                <svg className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.34 15.84c-.688-.06-1.386-.09-2.09-.09H7.5a4.5 4.5 0 1 1 0-9h.75c.704 0 1.402-.03 2.09-.09m0 9.18c.253.962.584 1.892.985 2.783.247.55.06 1.21-.463 1.511l-.657.38a.75.75 0 0 1-1.021-.27 18.566 18.566 0 0 1-2.414-5.904m5.57-5.504c-.253-.962-.584-1.892-.985-2.783a1.125 1.125 0 0 1 .463-1.511l.657-.38a.75.75 0 0 1 1.021.27 18.566 18.566 0 0 1 2.414 5.904m-5.57 5.504a18.583 18.583 0 0 0 5.57-5.504m-5.57 5.504V18a.75.75 0 0 0 .75.75h.75" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-600">Campaigns coming soon</h2>
              <p className="mt-2 text-sm text-gray-400">Campaign management will be available here.</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
