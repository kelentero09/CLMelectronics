import { ProfilePageHero } from "@/components/profile/profile-ui";
import BoardRepairBrowser from "@/components/profile/board-repair-browser";

export const metadata = {
  title: "Board Repair Capability",
  description:
    "Documented board repair capability for semiconductor and manufacturing equipment — die attach and auto mold boards with listed repair rates.",
};

export default function BoardRepairPage() {
  return (
    <>
      <ProfilePageHero
        eyebrow="Board repair"
        title="Board Repair Capability"
        description="CLM Electronics Engineering Services provides board repair capabilities for semiconductor and manufacturing equipment. Our repair services cover a range of control, driver, power supply, interface, and electronic boards based on our technical capabilities and available resources."
      />
      <BoardRepairBrowser />
    </>
  );
}
