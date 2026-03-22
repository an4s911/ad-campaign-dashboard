"use client";

import { use } from "react";
import CampaignForm from "@/components/CampaignForm";

export default function EditCampaignPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <CampaignForm campaignId={id} />;
}
