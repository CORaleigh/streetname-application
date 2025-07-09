
export type StreetName = {
  streetname: string;
  streettype: string;
  status: "invalid" | "valid" | "idle";
  message: string;
  nameValid: boolean;
  typeValid: boolean;
  order: number;
  id: `${string}-${string}-${string}-${string}-${string}`;
};

export type Validity = {
  status: "invalid" | "valid" | "idle";
  message: string;
  nameValid: boolean;
  typeValid: boolean;
};

export type Status = "invalid" | "valid" | "idle";
export type FormField = {
  name: string;
  pattern?: string | undefined;
  patternMessage?: string | undefined;
  value: string;
  required: boolean;
  status: Status;
  field?: __esri.Field | undefined;
  message?: string;
  type?: "tel" | "email";
};
export type Config = {
  formLayerId: string;
  webMapId: string;
  adminFormLayerId: string;
  streetNamesTableId: string;
  allowedStreetTypes: string[];
  streetTypes: {
    types: string;
    description: string;
  }[];
  fields: {
    contact: FormField[];
    details: FormField[];
  };
  geocodeUrl: string;
  wakeCountySite: string;
  flows: Flows;
  rules: string[];
};

export type Flows = {
  submitted: string;
  cityApproved: string;
  streetNamesAdded: string;
  countyApproved: string;
  rejected: string;
};

export type Notice = {
  kind: "success" | "danger" | "warning" | "info" | "brand" | undefined;
  heading: string;
  message: string;
  action?:
    | "Approve"
    | "Request More Names"
    | "Send to County"
    | "Submit Additional Streets";
};

export type Dialog = {
  open: boolean;
  heading: string;
  message: string;
};

export type JurisdictionLink = {
  name: string;
  href: string;
}