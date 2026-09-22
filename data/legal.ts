export interface LegalDocument {
  id: string;
  title: string;
  issuer: string;
  abbr: string;
}

export const legalDocuments: LegalDocument[] = [
  {
    id: "dti-registration",
    title: "Certificate of Business Name Registration",
    issuer: "Department of Trade and Industry",
    abbr: "DTI",
  },
  {
    id: "bir-cor",
    title: "BIR Certificate of Registration",
    issuer: "Bureau of Internal Revenue",
    abbr: "BIR",
  },
  {
    id: "mayors-permit",
    title: "Business Permit",
    issuer: "City Government of Muntinlupa",
    abbr: "LGU",
  },
];
