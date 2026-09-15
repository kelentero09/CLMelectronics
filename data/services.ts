export interface ServiceCategory {
  id: string;
  title: string;
  summary: string;
  items: string[];
}

export const serviceCategories: ServiceCategory[] = [
  {
    id: "technical-support",
    title: "Technical Support & Equipment Repair",
    summary:
      "Diagnostics, troubleshooting, and repair services to restore equipment performance and minimize downtime.",
    items: [
      "Minor and major equipment repair",
      "Technical assessment",
      "Technical support",
      "Machine troubleshooting",
      "Parts installation",
      "Calibration",
      "Process support",
      "Equipment qualification",
    ],
  },
  {
    id: "preventive-maintenance",
    title: "Preventive & Predictive Maintenance",
    summary:
      "Scheduled maintenance programs designed to sustain machine condition and identify potential issues early.",
    items: [
      "13-week / quarterly preventive maintenance",
      "26-week / semi-annual preventive maintenance",
      "52-week / annual preventive maintenance",
      "Predictive maintenance",
      "Machine inspection and assessment",
    ],
  },
  {
    id: "rebuild",
    title: "Machine & Sub-Assembly Rebuild",
    summary:
      "Overhaul and rebuilding services to restore machines and critical sub-assemblies to serviceable condition.",
    items: [
      "Machine overhaul",
      "Machine rehabilitation",
      "Sub-assembly rebuilding",
      "Bond head assembly rebuild",
      "X and Y table assembly rebuild",
      "Workholder assembly rebuild",
    ],
  },
  {
    id: "baselining",
    title: "Machine Baselining & A1 Conditioning",
    summary:
      "High-level machine conditioning services performed according to equipment requirements and customer needs.",
    items: ["Machine baselining", "Machine A1 conditioning"],
  },
  {
    id: "parts-calibration",
    title: "Parts Replacement & Calibration",
    summary:
      "Component replacement and calibration supported by technical assessment where applicable.",
    items: [
      "Minor and major parts replacement",
      "Parts installation",
      "Calibration",
      "Replacement of machine components",
      "Technical assessment before replacement where applicable",
    ],
  },
  {
    id: "training",
    title: "Technical Training",
    summary:
      "Practical, equipment-focused training capabilities based on CLM's service experience.",
    items: [
      "Basic operation training — Level 1",
      "Setup and minor repair training — Level 2",
      "Preventive maintenance and calibration training — Level 3",
      "Sub-assembly rebuild / equipment overhaul training — Level 5",
    ],
  },
  {
    id: "spare-parts",
    title: "Spare Parts Sourcing & Installation",
    summary:
      "We source machine spare parts according to customer requirements and equipment needs.",
    items: [
      "Main boards",
      "Power supplies",
      "Transducer assemblies",
      "Wire clamp assemblies",
      "Wire tensioner assemblies",
      "Temperature controllers",
      "Bond head driver boards",
      "Bond head assemblies",
      "XY table assemblies",
      "XY driver boards",
      "Indexer driver boards",
      "Servo drivers",
      "Motors",
      "CPU boards",
      "Logic boards",
      "Vision cameras",
      "Other parts based on customer requirements",
    ],
  },
  {
    id: "board-repair",
    title: "Board Repair",
    summary:
      "Repair capability for control, driver, power supply, interface, and electronic boards. Detailed repair capability can be provided upon request.",
    items: [
      "Driver boards",
      "Power supply boards",
      "Main boards",
      "CPU boards",
      "Motor interface boards",
      "Motor I/O boards",
      "Input/output boards",
      "PRS boards",
      "Logic boards",
      "HiPEC boards",
      "Other electronic boards based on repair capability",
    ],
  },
  {
    id: "wedge-bonding",
    title: "Aluminum Wedge Bonding Consumables",
    summary:
      "Consumable items for aluminum wedge bonding equipment, sourced according to customer requirements.",
    items: ["Bond tools", "Wire cutters", "Wire guides"],
  },
];

export const wedgeBrands = ["Orthodyne Electronics", "FNK / Delvo Technology"];
