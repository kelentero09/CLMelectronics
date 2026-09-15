export interface LegalDocument {
  id: string;
  title: string;
  issuer: string;
  detail: string;
  image: string;
  alt: string;
}

export const legalDocuments: LegalDocument[] = [
  {
    id: "dti-registration",
    title: "Certificate of Business Name Registration",
    issuer: "Department of Trade and Industry",
    detail: "Business Name No. 4412787 · Valid January 9, 2023 – January 9, 2028",
    image: "/legal4.jpg",
    alt: "DTI Certificate of Business Name Registration for CLM Electronics Engineering Services",
  },
  {
    id: "bir-cor-1",
    title: "Certificate of Registration — Page 1",
    issuer: "Bureau of Internal Revenue (Form 2303)",
    detail: "Trade name registered January 11, 2023 · RDO No. 53B, Muntinlupa City",
    image: "/legal2.jpg",
    alt: "BIR Certificate of Registration, page 1, for CLM Electronics Engineering Services",
  },
  {
    id: "bir-cor-2",
    title: "Certificate of Registration — Page 2",
    issuer: "Bureau of Internal Revenue (Form 2303)",
    detail: "RDO No. 53B — Muntinlupa City · OCN generated August 14, 2024",
    image: "/legal1.jpg",
    alt: "BIR Certificate of Registration, page 2, for CLM Electronics Engineering Services",
  },
  {
    id: "mayors-permit-2026",
    title: "2026 Business License and Mayor's Permit",
    issuer: "City Government of Muntinlupa (BPLO)",
    detail: "Engineering services · Issued July 20, 2026",
    image: "/legal3.jpg",
    alt: "2026 Business License and Mayor's Permit issued by the City Government of Muntinlupa",
  },
];
