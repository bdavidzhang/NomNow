export interface CampusConfig {
  /** Short unique identifier, e.g. 'uiuc' */
  id: string
  /** Full school name */
  name: string
  /** Email domain that maps to this campus */
  emailDomain: string
  /** Longitude of campus center */
  lng: number
  /** Latitude of campus center */
  lat: number
  /** Default map zoom level */
  zoom: number
}

/**
 * Central campus registry — add new schools here.
 * Everything about a campus lives in this one list.
 */
const CAMPUSES: CampusConfig[] = [
  {
    id: 'uiuc',
    name: 'University of Illinois Urbana-Champaign',
    emailDomain: 'illinois.edu',
    lng: -88.2272,
    lat: 40.102,
    zoom: 15,
  },
  // To add a new school, copy the block above and fill in the values:
  // {
  //   id: 'ucb',
  //   name: 'UC Berkeley',
  //   emailDomain: 'berkeley.edu',
  //   lng: -122.2585,
  //   lat: 37.8719,
  //   zoom: 15,
  // },
]

// Derived lookup maps (built once at startup)
const byDomain = new Map(CAMPUSES.map((c) => [c.emailDomain, c]))
const byId = new Map(CAMPUSES.map((c) => [c.id, c]))

/** Get all registered campuses. */
export function getAllCampuses(): CampusConfig[] {
  return CAMPUSES
}

/** Look up campus config by its short id (e.g. 'uiuc'). */
export function getCampusById(id: string): CampusConfig | undefined {
  return byId.get(id)
}

/** Derive campus config from an email address. Returns undefined for unrecognized domains. */
export function getCampusFromEmail(email: string): CampusConfig | undefined {
  const domain = email.split('@')[1]?.toLowerCase()
  return domain ? byDomain.get(domain) : undefined
}
