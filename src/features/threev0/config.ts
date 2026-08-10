export const THREE_V0_SPREADSHEET_ID =
  "1uwXWof_FhQ9_doKuxdtfXyI7hijaoTwXQeldzKw5jzA";

export const THREE_V0_GID = "0";

export const THREE_V0_SPREADSHEET_URL =
  `https://docs.google.com/spreadsheets/d/${THREE_V0_SPREADSHEET_ID}/edit?gid=${THREE_V0_GID}#gid=${THREE_V0_GID}`;

export const THREE_V0_PUBLISHED_CSV_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vQroyvbiNE1b6wB95hWj0ohNVkzIOgGXQIQ4tyJbkoCvtsOqBi-nHvTnSqekpVmAd_Q3NwbBHbbqax_/pub?output=csv";

export const THREE_V0_PAGE_SIZE = 25;

export const THREE_V0_SELECTED_INDEX = {
  upt: 0,
  ultg: 1,
  gi: 2,
  bay: 3,
  sbefModel: 4,
  analogStatus: 5,
  analogTarget: 6,
  analogRealization: 7,
  alarmStatus: 8,
  alarmTarget: 9,
  alarmRealization: 10,
  sbefConfiguration: 11,
} as const;

export const THREE_V0_FULL_INDEX = {
  upt: 1, // B
  ultg: 2, // C
  gi: 3, // D
  bay: 4, // E
  sbefModel: 40, // AO
  analogStatus: 41, // AP
  analogTarget: 42, // AQ
  analogRealization: 43, // AR
  alarmStatus: 44, // AS
  alarmTarget: 45, // AT
  alarmRealization: 46, // AU
  sbefConfiguration: 47, // AV
} as const;
