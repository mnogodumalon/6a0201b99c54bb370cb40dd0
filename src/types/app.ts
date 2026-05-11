// AUTOMATICALLY GENERATED TYPES - DO NOT EDIT

export type LookupValue = { key: string; label: string };
export type GeoLocation = { lat: number; long: number; info?: string };

export interface BdbddbErfassung {
  record_id: string;
  createdat: string;
  updatedat: string | null;
  fields: {
    titel?: string;
    beschreibung?: string;
    datum?: string; // Format: YYYY-MM-DD oder ISO String
    status?: LookupValue;
    anmerkungen?: string;
  };
}

export const APP_IDS = {
  BDBDDB_ERFASSUNG: '6a0201afdd540315c0f597ed',
} as const;


export const LOOKUP_OPTIONS: Record<string, Record<string, {key: string, label: string}[]>> = {
  'bdbddb_erfassung': {
    status: [{ key: "offen", label: "Offen" }, { key: "in_bearbeitung", label: "In Bearbeitung" }, { key: "abgeschlossen", label: "Abgeschlossen" }],
  },
};

export const FIELD_TYPES: Record<string, Record<string, string>> = {
  'bdbddb_erfassung': {
    'titel': 'string/text',
    'beschreibung': 'string/textarea',
    'datum': 'date/date',
    'status': 'lookup/select',
    'anmerkungen': 'string/textarea',
  },
};

type StripLookup<T> = {
  [K in keyof T]: T[K] extends LookupValue | undefined ? string | LookupValue | undefined
    : T[K] extends LookupValue[] | undefined ? string[] | LookupValue[] | undefined
    : T[K];
};

// Helper Types for creating new records (lookup fields as plain strings for API)
export type CreateBdbddbErfassung = StripLookup<BdbddbErfassung['fields']>;