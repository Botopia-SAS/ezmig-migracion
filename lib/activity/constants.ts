/**
 * Fields tracked for change detection in activity logs.
 * Used with detectChanges() to record what fields changed during updates.
 */

export const TRACKABLE_CLIENT_FIELDS = [
  'firstName', 'lastName', 'email', 'phone', 'dateOfBirth',
  'countryOfBirth', 'nationality', 'alienNumber', 'uscisOnlineAccount',
  'currentStatus', 'addressLine1', 'addressLine2', 'city', 'state',
  'zipCode', 'country', 'notes',
] as const;

export const TRACKABLE_CASE_FIELDS = [
  'caseType', 'status', 'priority', 'filingDeadline',
  'assignedTo', 'uscisReceiptNumber', 'internalNotes',
] as const;
