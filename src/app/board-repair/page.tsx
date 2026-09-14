import type { Metadata } from "next";
import { PageHero } from "../../components/ui/primitives";
import BoardRepairClient from "../../components/sections/BoardRepairClient";

export const metadata: Metadata = {
  title: "Board Repair Capability | CLM Electronics Engineering Services",
  description:
    "Documented board repair capability for semiconductor and manufacturing equipment — die attach and auto mold boards with listed repair rates.",
};

export default function BoardRepairPage() {
  return (
    <>
      <PageHero
        eyebrow="Board repair"
        title="Board Repair Capability"
        description="CLM Electronics Engineering Services provides board repair capabilities for semiconductor and manufacturing equipment. Our repair services cover a range of control, driver, power supply, interface, and electronic boards based on our technical capabilities and available resources."
      />
      <BoardRepairClient />
    </>
  );
}
