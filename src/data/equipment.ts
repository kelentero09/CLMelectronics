export interface EquipmentGroup {
  id: string;
  brand: string;
  label: string;
  description: string;
  models: string[];
}

export const equipmentGroups: EquipmentGroup[] = [
  {
    id: "asm-wire-bonder",
    brand: "ASM",
    label: "Wire Bonder Equipment",
    description:
      "Equipment CLM has experience servicing. Displayed as serviced equipment, not an official affiliation.",
    models: [
      "Eagle 60",
      "E60AP",
      "Eagle Xtreme",
      "Xpress",
      "iHawk",
      "AERO",
      "TWIN Eagle",
      "Harrier",
      "Extreme",
      "Extreme Gocu",
      "Express",
    ],
  },
  {
    id: "asm-die-bonder",
    brand: "ASM",
    label: "Automatic Die Bonder Equipment",
    description:
      "Equipment CLM has experience servicing. Displayed as serviced equipment, not an official affiliation.",
    models: ["AD828", "AD830", "AD889", "AD898", "AD8912", "AD838", "AD832i", "AD8312"],
  },
  {
    id: "kns",
    brand: "K&S / KNS",
    label: "Wire Bonder Equipment",
    description:
      "Equipment CLM has experience servicing. Displayed as serviced equipment, not an official affiliation.",
    models: [
      "Maxum Ultra",
      "Maxum Elite",
      "Maxum Plus",
      "IConnX",
      "IConn STD/LA",
      "IConn Plus",
      "RAPID Pro",
    ],
  },
  {
    id: "esec",
    brand: "ESEC",
    label: "Die Attach Equipment",
    description:
      "Equipment CLM has experience servicing. Displayed as serviced equipment, not an official affiliation.",
    models: [
      "ESEC 2007",
      "ESEC 2008",
      "ESEC 2008HS",
      "ESEC 2008HS3",
      "ESEC 2009",
      "ESEC 2100 STD",
      "ESEC 2100 HS",
      "ESEC 2100 Plus",
      "ESEC 2100 XL",
      "ESEC 2100 XP",
    ],
  },
  {
    id: "dicing",
    brand: "Dicing / Saw",
    label: "Dicing, Saw & Back Grinding Equipment",
    description: "Saw and back grinding equipment based on CLM capability.",
    models: ["DAD3221", "DAD3350", "DFD6362", "DFD651", "DFD640", "DFD6560", "DFD6450"],
  },
  {
    id: "wedge-bonders",
    brand: "Aluminum Wedge Bonding",
    label: "Aluminum Wedge Bonding Equipment",
    description: "Wedge bonding equipment CLM supports, plus other brands based on capability and resources.",
    models: ["Orthodyne M360", "Orthodyne 7200", "KNS Orthodyne Asterion"],
  },
];

export interface PartsSourcingGroup {
  brand: string;
  models: string[];
}

export const partsSourcing: PartsSourcingGroup[] = [
  {
    brand: "ASM",
    models: ["E60", "Twin Eagle", "Harrier / iHawk", "Extreme", "Extreme Gocu", "Express", "AERO"],
  },
  {
    brand: "KNS",
    models: ["Maxum", "Maxum Ultra", "Maxum Plus", "IConnX", "IConn Plus", "IConn LA", "Rapid Pro"],
  },
  {
    brand: "ESEC",
    models: ["ESEC 2007", "ESEC 2008", "ESEC 2008XP", "ESEC 2008HS3", "ESEC 2100", "ESEC 2100XL / XP"],
  },
  {
    brand: "Dicing / Saw",
    models: ["DAD3321", "DAD3350", "DFD6362", "DFD640", "DFD651", "DFD6560", "DFD6450"],
  },
];
