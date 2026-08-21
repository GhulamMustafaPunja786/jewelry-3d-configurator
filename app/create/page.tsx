import type { Metadata } from "next";
import { CreateClient } from "./CreateClient";

export const metadata: Metadata = {
  title: "Create Your Jewelry",
  description:
    "Describe your jewelry, generate an AI 3D visualization, and request an atelier estimate.",
};

export default function CreatePage() {
  return <CreateClient />;
}
