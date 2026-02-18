export interface ProfileCompletionResult {
  isComplete: boolean;
  percentage: number;
  missingFields: string[];
  profileType: 'agency' | 'team_member' | 'freelancer' | null;
}

// Agency owner: 9 tracked fields per PDF spec
const AGENCY_TRACKED_FIELDS = [
  'legalBusinessName',
  'businessEmail',
  'businessPhone',
  'address',
  'city',
  'state',
  'zipCode',
  'ownerFullName',
  'ownerEmail',
] as const;

// Team member: key profile fields
const TEAM_MEMBER_TRACKED_FIELDS = [
  'fullName',
  'email',
  'phone',
  'role',
] as const;

// Freelancer: key profile fields
const FREELANCER_TRACKED_FIELDS = [
  'fullName',
  'email',
  'phone',
  'professionalType',
] as const;

function computeCompletion(
  data: Record<string, unknown>,
  trackedFields: readonly string[],
  profileType: 'agency' | 'team_member' | 'freelancer',
): ProfileCompletionResult {
  const missingFields: string[] = [];

  for (const field of trackedFields) {
    const value = data[field];
    if (value === null || value === undefined || value === '') {
      missingFields.push(field);
    }
  }

  const filled = trackedFields.length - missingFields.length;
  const percentage = Math.round((filled / trackedFields.length) * 100);

  return {
    isComplete: missingFields.length === 0,
    percentage,
    missingFields,
    profileType,
  };
}

export function getAgencyCompletion(
  teamData: Record<string, unknown>,
): ProfileCompletionResult {
  return computeCompletion(teamData, AGENCY_TRACKED_FIELDS, 'agency');
}

export function getTeamMemberCompletion(
  profileData: Record<string, unknown>,
): ProfileCompletionResult {
  return computeCompletion(profileData, TEAM_MEMBER_TRACKED_FIELDS, 'team_member');
}

export function getFreelancerCompletion(
  profileData: Record<string, unknown>,
): ProfileCompletionResult {
  return computeCompletion(profileData, FREELANCER_TRACKED_FIELDS, 'freelancer');
}

export function getNoProfileCompletion(): ProfileCompletionResult {
  return {
    isComplete: false,
    percentage: 0,
    missingFields: [],
    profileType: null,
  };
}
