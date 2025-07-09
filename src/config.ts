import type { Config } from "./types/types/types";

export const config: Config = {
  formLayerId: "155f0425df84404eb3a9b67cfcbece15",
  webMapId: "394c56c8b4dc4cbdb55d8f78a2e97253",
  adminFormLayerId: "f922bf8d5c8d442ba4355c9499e69f02",
  streetNamesTableId: "1e97845fd3434bf493097f9aa7390811",
  allowedStreetTypes: [
    "Street",
    "Avenue",
    "Drive",
    "Lane",
    "Road",
    "Circle",
    "Court",
    "Place",
    "Way",
    "Alley",
    "Trail",
    "Path",
    "Crecent",
    "Loop",
    "Parkway",
    "Boulevard",
  ],
  streetTypes: [
    {
      types: "Parkway (Pkwy)",
      description: `Major highways or arterials through the City, often with limited access and multiple travel lanes in each direction.`,
    },
    {
      types: "Boulevard (Blvd)",
      description: `A major road with a median reflecting the boulevard character implied in the name.`,
    },
    {
      types: "Avenue (Ave), Street (St), Road (Rd)",
      description: `Major roads within more urbanized areas and neighborhoods.`,
    },
    {
      types: "Drive (Dr), Lane (Ln), Path, Trail (Trl), Way",
      description: `Neighborhood roads, more than one segment in length, connected at both ends to another street.`,
    },
    {
      types: "Court (Ct), Place (Pl)",
      description: `Cul-de-sacs and other roads with only one end connected to another street and no other intersections with other cross streets along its length. Should not be used for a street that is expected to be extended and connected with other streets in the future.`,
    },
    {
      types: "Circle (Cir), Crescent (Cres), Loop",
      description: `Short roads that connect at both ends with a segment of the same street.`,
    },

    {
      types: "Alley",
      description: `a service road that runs between, and generally parallel to, two streets. An alley is often narrower than a public street and is not intended for heavy traffic.`,
    },
  ],
  fields: {
    contact: [
      {
        name: "contact",
        value: "test",
        required: true,
        status: "idle",
      },
      {
        name: "organization",
        value: "",
        required: false,
        status: "idle",
      },
      {
        name: "email",
        pattern: "[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+.[a-zA-Z]{2,}",
        patternMessage: "not a valid email address",
        value: "test@test.com",
        required: true,
        status: "idle",
        type: "email",
      },
      {
        name: "phone",
        value: "",
        required: true,
        status: "idle",
        type: "tel",
      },
    ],
    details: [
      {
        name: "projectname",
        value: "",
        required: false,
        status: "idle",
      },
      {
        name: "plannumber",
        value: "",
        pattern: "^[A-Za-z]+-\\d{4}-20\\d{2}$",
        patternMessage:
          "Must match the format of City of Raleigh Projects (ex ASR-0001-2025, SUB-0001-2025)",
        required: false,
        status: "idle",
      },
      {
        name: "pinnum",
        value: "",
        pattern: "\\d{10}",
        patternMessage: "Must be 10 digit number",
        required: true,
        status: "idle",
      },
      {
        name: "address",
        value: "",
        required: true,
        status: "idle",
      },
      {
        name: "zipcode",
        value: "",
        pattern: "\\d{5}",
        patternMessage: "Must be five digit format",
        required: true,
        status: "idle",
      },
      {
        name: "streetnamesneeded",
        value: "2",
        required: true,
        status: "idle",
      },
    ],
  },
  geocodeUrl:
    "https://maps.raleighnc.gov/arcgis/rest/services/Locators/Locator/GeocodeServer",
  wakeCountySite:
    "https://www.wake.gov/departments-government/geographic-information-services-gis/addresses-road-names-and-street-signs/road-name-approval-guide",
  flows: {
    submitted:
      "https://prod-20.usgovtexas.logic.azure.us:443/workflows/8d354faf40f84b9c8ab5ff6c8e2dd838/triggers/manual/paths/invoke?api-version=2016-06-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=bigzFdFFOClGPt-teIbB9Rtia5odkVrR9-nL40hnC0E",
    cityApproved:
      "https://prod-41.usgovtexas.logic.azure.us:443/workflows/dc71d6403e704c6aa3f0d49020950bd4/triggers/manual/paths/invoke?api-version=2016-06-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=H14QpGSfuXihcfBmSsHvGBZ1EgNTgFe9VW8wR2g5QaM",
    streetNamesAdded:
      "https://prod-10.usgovtexas.logic.azure.us:443/workflows/c9b66e4addaa420eb99dfa548d199b93/triggers/manual/paths/invoke?api-version=2016-06-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=rXkHNMZpi54eRKYEhho2J_UzwJ8muEiq502vFxvODHA",
    countyApproved:
      "https://prod-50.usgovtexas.logic.azure.us:443/workflows/6d972c4a8579457b91ab1eb1b6b4264e/triggers/manual/paths/invoke?api-version=2016-06-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=pPjpp3obhs89htO73P-_pb2may4jPSeD6c2ZHcdgI-A",
    rejected:
      "https://prod-01.usgovtexas.logic.azure.us:443/workflows/ad6d95784fcd4a06aab213e34dc8d171/triggers/manual/paths/invoke?api-version=2016-06-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=UaQYaCsg5ie-kKL4vqxp4dR1HXx49-SBe4j1N6AFAfE",
  },
  rules: [
    "Street names shall not contain more than 20 characters, including the directional (if any).",
    "No street name shall have less than 3 characters. Existing streets that consist of less than 3 characters may remain.",
    "Street names shall not contain punctuation or special characters including apostrophes, commas, hyphens, periods, or other similar characters.",
    "Street names shall not exceed two words, excluding the directional and street type.",
    "Street names shall not contain directional words or street type words. Existing streets that consist of these words may remain.",
    "New street names shall not duplicate any existing street name in Wake County. The street name, for purposes of evaluating whether a duplicate exists, does not include the street type. For example, Aspen Lane and Aspen Drive are duplicates under this definition. North Main Street and South Main Street are considered a single road with directionals.",
    "Street names that sound like an existing street name, or another proposed name, or that create difficulties in pronunciation are prohibited.",
    "The use of corporate or institutional names for streets is not permitted.",
    "The use of a person’s name for a street is permitted only if the person has been deceased for a minimum of 5 years, and shall have been a person of local historical, cultural or social importance, and made significant contributions to the City of Raleigh, State of North Carolina or the United States. Such names should preferably not include titles (Dr., Mr., Ms., etc.), or middle initials. Biographical information must be submitted in support of such naming. When naming a street for an individual, consideration should be given to putting the name on a major thoroughfare.",
    "Street names that are deemed offensive, obscene, lewd, profane, offensive, or derogatory of any class, race, religion, ethnic group, gender, age or other group are prohibited. An obscene term is a word or phrase that refers to or describes sexual conduct as defined by G.S. § 14-190.1.",
    "Street names shall not contain numerals. For example, Second Street is not permitted to be named as “2nd Street”, where the official name is “2nd”.",
    "Spelling of words in street names shall conform to the spelling found in standard dictionaries of the English language, US usage. Words that are taken from a foreign language, or that are difficult to spell or pronounce shall not be permitted.",
    "Street names should not use non-standard spelling (such as “Olde” for “Old”). Existing street names containing these types of words can remain.",
    "The words “Old” and “New” should not be used to designate a section of road unless the section so designated runs parallel or near a road with the same name and is connected to the road of the same name.",
    "The naming of streets after landmarks, such as a subdivision name, shopping center or apartment complex, is strongly discouraged.",
    "In selecting names for streets or in renaming streets, consideration should be given to the use of names that are historically, culturally, or environmentally significant to the immediate area.",
    "Street names shall be consistent as the street crosses municipal and County boundaries to the greatest extent possible.",
  ],
};
