"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  Package,
  FolderTree,
  Wrench,
  FileText,
  Inbox,
  LayoutDashboard,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  Image,
  Search,
  Eye,
  EyeOff,
  Trash2,
  ArrowUpDown,
  Pencil,
} from "lucide-react";

type Section = {
  id: string;
  icon: React.ElementType;
  title: string;
  steps: { title: string; details: string }[];
  tips?: string[];
};

const sections: Section[] = [
  {
    id: "dashboard",
    icon: LayoutDashboard,
    title: "Dashboard Overview",
    steps: [
      {
        title: "What you see on the Dashboard",
        details:
          "The dashboard shows 6 stat cards: Products, Published, Categories, Board Repairs, Website Content, and New Inquiries. Each card shows a count and links to the relevant page.",
      },
      {
        title: "Recently Updated Products",
        details:
          "Below the stats, you'll see the 5 most recently updated products with an Edit button for quick access.",
      },
    ],
    tips: [
      "Click any stat card to go directly to that section.",
      "The Dashboard updates automatically — no need to refresh.",
    ],
  },
  {
    id: "add-product",
    icon: Package,
    title: "How to Add a Product",
    steps: [
      {
        title: "Step 1: Go to Add Product",
        details:
          'Click "Add Product" in the sidebar menu, or go to Products > click the "+ Add Product" button.',
      },
      {
        title: "Step 2: Fill in the Product Name",
        details:
          'Enter the product name in the "Name" field. This is required and will be displayed on the website. Example: "DISCO DAD 321 Automatic Die Bonder".',
      },
      {
        title: "Step 3: Set the Slug",
        details:
          'The slug is auto-generated from the name (used in the URL). You can change it if needed. Example: "disco-dad-321-automatic-die-bonder".',
      },
      {
        title: "Step 4: Enter Reference Code",
        details:
          'Enter a unique reference code for internal tracking. Example: "CLM-0001". This is required.',
      },
      {
        title: "Step 5: Select a Category",
        details:
          'Choose a category from the dropdown. If no category fits, create one first under Categories in the sidebar.',
      },
      {
        title: "Step 6: Fill in Manufacturer, Model, Part Number",
        details:
          "These are optional but help customers find the product. Fill in what applies.",
      },
      {
        title: "Step 7: Add Descriptions",
        details:
          'Short description: A one-line teaser shown on product cards (max 300 characters).\nFull description: Detailed product info shown on the product page (max 10,000 characters).',
      },
      {
        title: "Step 8: Set Condition and Availability",
        details:
          "Condition: NEW, USED, REFURBISHED, SURPLUS, or FOR_PARTS.\nAvailability: IN_STOCK, LOW_STOCK, RESERVED, SOLD, or UNAVAILABLE.",
      },
      {
        title: "Step 9: Add Specifications (optional)",
        details:
          'Click "+ Add specification" to add key-value pairs. Example: Key = "Voltage", Value = "24V DC". You can add up to 50 specifications.',
      },
      {
        title: "Step 10: Upload Images",
        details:
          'Click the image upload area or drag and drop. Accepted formats: JPEG, PNG, WebP, AVIF. Max 5 MB per image, up to 8 images total. Images are converted to WebP automatically.',
      },
      {
        title: "Step 11: Set Published and Featured",
        details:
          "Published: Check this to make the product visible on the website.\nFeatured: Check this to highlight the product on the homepage.",
      },
      {
        title: "Step 12: Save",
        details:
          'Click "Create Product". You\'ll be redirected to the product list with a success message.',
      },
    ],
    tips: [
      "Always fill in the Reference Code — it helps you and customers identify the product.",
      "Upload at least one image for better visibility on the website.",
      "Start with Published unchecked, then preview the product before publishing.",
    ],
  },
  {
    id: "edit-product",
    icon: Pencil,
    title: "How to Edit a Product",
    steps: [
      {
        title: "Step 1: Go to Products",
        details: 'Click "Products" in the sidebar to see the product list.',
      },
      {
        title: "Step 2: Find the Product",
        details:
          "Use the search box or category/availability filters to find the product you want to edit.",
      },
      {
        title: "Step 3: Click Edit",
        details:
          'Click the "Edit" button next to the product. This opens the same form as "Add Product" but pre-filled with existing data.',
      },
      {
        title: "Step 4: Make Changes",
        details:
          "Update any fields you need. All fields work the same way as when creating a product.",
      },
      {
        title: "Step 5: Manage Images",
        details:
          "In edit mode, you can see existing images. To add more, use the image upload. To delete an image, check the delete checkbox on the image.",
      },
      {
        title: "Step 6: Save Changes",
        details: 'Click "Save Changes" to update the product.',
      },
    ],
    tips: [
      "You can quickly toggle Published on/off from the product list without opening the edit form.",
      "Products can be moved to Trash instead of permanently deleted.",
    ],
  },
  {
    id: "categories",
    icon: FolderTree,
    title: "How to Manage Categories",
    steps: [
      {
        title: "Step 1: Go to Categories",
        details: 'Click "Categories" in the sidebar.',
      },
      {
        title: "Step 2: Create a New Category",
        details:
          'Click "+ New Category". Enter a Name (required) and a Slug (auto-generated, used in URLs). Add a Description if needed. Set the Sort Order to control where it appears in the list. Check "Active" to make it visible. Click "Create".',
      },
      {
        title: "Step 3: Edit a Category",
        details:
          'Click "Edit" on any category card. Change the name, slug, description, or sort order. Click "Save".',
      },
      {
        title: "Step 4: Activate / Deactivate",
        details:
          'Click "Deactivate" to hide a category from the website (products remain but the category filter disappears). Click "Activate" to bring it back.',
      },
      {
        title: "Step 5: Delete a Category",
        details:
          'Click "Delete" on a category. You can only delete categories that have 0 products. If products still use it, deactivate it instead.',
      },
    ],
    tips: [
      "Create categories first before adding products — products need categories for filtering.",
      "Use Sort Order to control the display order (lower numbers appear first).",
    ],
  },
  {
    id: "board-repairs",
    icon: Wrench,
    title: "How to Manage Board Repairs",
    steps: [
      {
        title: "Step 1: Go to Board Repairs",
        details: 'Click "Board Repairs" in the sidebar.',
      },
      {
        title: "Step 2: Add a New Repair Record",
        details:
          'Click "+ Add Record". Fill in:\n• Station / Process — e.g., WIREBOND, DIE BOND\n• Equipment / Model Type — e.g., DISCO, SHINKAWA\n• Board Description — e.g., Pack Driver D2590\n• Problem — describe the issue\n• Repair Rate (%) — success rate percentage (0-100)\n• Sort Order — for display ordering\n• Photo — optional image of the board\n• Show on website — check to make it visible\nClick "Add Record" to save.',
      },
      {
        title: "Step 3: Edit a Repair Record",
        details:
          'Click "Edit" on any repair row. Update the fields and click "Save Changes".',
      },
      {
        title: "Step 4: Delete a Repair Record",
        details:
          'Click "Delete" on the repair row and confirm.',
      },
    ],
    tips: [
      "The Station field has autocomplete — start typing to see previous entries.",
      "Repair Rate is shown as a percentage on the website to demonstrate capability.",
      "Upload a photo of the board to make the record more informative.",
    ],
  },
  {
    id: "website-content",
    icon: FileText,
    title: "How to Edit Website Content",
    steps: [
      {
        title: "Step 1: Go to Website Content",
        details: 'Click "Website Content" in the sidebar.',
      },
      {
        title: "Step 2: Understand the Groups",
        details:
          "Content is organized into tabs:\n• Company & Contact — name, address, phones, email, mission, vision\n• Homepage — hero text, profile, capability cards, Why CLM, CTA\n• About page — hero title, intro, registration section\n• Services — hero text, wedge brands, service categories\n• Equipment — hero text, equipment groups, parts sourcing\n• Contact & Board Repair — contact title, board repair hero copy",
      },
      {
        title: "Step 3: Edit a Text Field",
        details:
          "Click on a content group tab. Each field shows its current value. Edit the text directly. A yellow \"Unsaved\" badge appears when you make changes. Click \"Save\" to apply. The website updates instantly.",
      },
      {
        title: "Step 4: Edit Card Fields (Capabilities, Why CLM)",
        details:
          "Some fields are card-based (title + description pairs). You can:\n• Edit existing cards inline\n• Click \"+ Add card\" to add a new one\n• Click \"Remove\" to delete a card\nClick \"Save cards\" when done.",
      },
      {
        title: "Step 5: Edit Service Categories",
        details:
          "Click on a service category to expand it. Edit the title, summary, and bullet items (one per line). Click \"+ Add category\" for new ones. Click \"Save services\" when done.",
      },
      {
        title: "Step 6: Edit Equipment Groups",
        details:
          "Click on an equipment group to expand it. Edit brand, label, description, and models (one per line). Click \"+ Add group\" for new ones. Click \"Save equipment\" when done.",
      },
    ],
    tips: [
      "Changes take effect immediately on the website — no need to republish.",
      "Use the tab buttons at the top to switch between content groups.",
      "For bullet lists (phones, profile points, board types), enter one item per line.",
    ],
  },
  {
    id: "inquiries",
    icon: Inbox,
    title: "How to Handle Customer Inquiries",
    steps: [
      {
        title: "Step 1: Go to Inquiries",
        details: 'Click "Inquiries" in the sidebar.',
      },
      {
        title: "Step 2: View Inquiries",
        details:
          "Inquiries are shown in a list. Each shows the customer's name, email, phone, company, message, and which product they asked about (if any).",
      },
      {
        title: "Step 3: Filter by Status",
        details:
          "Use the tabs at the top to filter:\n• All — show everything\n• NEW — unhandled inquiries\n• CONTACTED — you've reached out\n• COMPLETED — inquiry resolved",
      },
      {
        title: "Step 4: Update Status",
        details:
          'Use the dropdown next to each inquiry to change its status:\n• NEW → CONTACTED (when you reply)\n• CONTACTED → COMPLETED (when resolved)',
      },
    ],
    tips: [
      "Check inquiries regularly — customers expect a quick response.",
      "The product reference shown helps you understand what the customer is interested in.",
      "General inquiries (no product) appear as \"General inquiry\" in the Product column.",
    ],
  },
];

function GuideSection({ section, defaultOpen }: { section: Section; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen ?? false);
  const Icon = section.icon;

  return (
    <Card>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-3 px-5 py-4 text-left"
      >
        <Icon className="h-5 w-5 shrink-0 text-steel-500" />
        <span className="flex-1 text-sm font-bold text-navy-900">{section.title}</span>
        {open ? (
          <ChevronDown className="h-4 w-4 shrink-0 text-slate-400" />
        ) : (
          <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" />
        )}
      </button>
      {open && (
        <CardContent className="border-t border-slate-100 pt-4">
          <ol className="space-y-4">
            {section.steps.map((step, i) => (
              <li key={i} className="flex gap-3">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                <div>
                  <p className="text-sm font-semibold text-navy-900">{step.title}</p>
                  <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-slate-600">
                    {step.details}
                  </p>
                </div>
              </li>
            ))}
          </ol>
          {section.tips && section.tips.length > 0 && (
            <div className="mt-5 rounded-lg bg-amber-50 border border-amber-200 p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-amber-700">Tips</p>
              <ul className="mt-2 space-y-1">
                {section.tips.map((tip, i) => (
                  <li key={i} className="flex gap-2 text-sm text-amber-800">
                    <span>•</span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}

export function HelpGuide() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-navy-900">Help Guide</h1>
        <p className="mt-1 text-sm text-slate-500">
          Step-by-step instructions for managing your CLM website. Click any section to expand.
        </p>
      </div>

      <div className="space-y-3">
        {sections.map((section, i) => (
          <GuideSection key={section.id} section={section} defaultOpen={i === 0} />
        ))}
      </div>

      <div className="mt-8 rounded-lg border border-slate-200 bg-slate-50 p-5">
        <h2 className="text-sm font-bold text-navy-900">Quick Reference</h2>
        <div className="mt-3 grid gap-4 text-sm text-slate-600 sm:grid-cols-2">
          <div>
            <p className="font-semibold text-navy-900">Image Requirements</p>
            <ul className="mt-1 space-y-1">
              <li>• Formats: JPEG, PNG, WebP, AVIF</li>
              <li>• Max size: 5 MB per image</li>
              <li>• Max images per product: 8</li>
              <li>• Images are auto-converted to WebP</li>
            </ul>
          </div>
          <div>
            <p className="font-semibold text-navy-900">Availability Statuses</p>
            <ul className="mt-1 space-y-1">
              <li>• IN_STOCK — Available for inquiry</li>
              <li>• LOW_STOCK — Limited availability</li>
              <li>• RESERVED — Held for a customer</li>
              <li>• SOLD — No longer available</li>
              <li>• UNAVAILABLE — Not currently offered</li>
            </ul>
          </div>
          <div>
            <p className="font-semibold text-navy-900">Product Conditions</p>
            <ul className="mt-1 space-y-1">
              <li>• NEW — Brand new, unused</li>
              <li>• USED — Previously used</li>
              <li>• REFURBISHED — Restored to working condition</li>
              <li>• SURPLUS — Excess stock</li>
              <li>• FOR_PARTS — Sold for parts only</li>
            </ul>
          </div>
          <div>
            <p className="font-semibold text-navy-900">Inquiry Statuses</p>
            <ul className="mt-1 space-y-1">
              <li>• NEW — Not yet responded to</li>
              <li>• CONTACTED — You have replied</li>
              <li>• COMPLETED — Inquiry resolved</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
