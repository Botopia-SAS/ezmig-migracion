import { and, eq, isNull, isNotNull } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import {
  caseRelationships,
  clients,
  relationshipTypeEnum,
} from '@/lib/db/schema';

// Types
export interface CaseRelationship {
  id: number;
  caseId: number;
  petitionerId: number;
  beneficiaryId: number | null;
  relationshipType: typeof relationshipTypeEnum.enumValues[number];
  relationshipDetails: string | null;
  isPrimaryRelationship: boolean;
  marriageDate: Date | null;
  divorceDate: Date | null;
  petitioner?: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  };
  beneficiary?: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  } | null;
}

export interface CreateRelationshipData {
  caseId: number;
  petitionerId: number;
  beneficiaryId?: number | null;
  relationshipType: typeof relationshipTypeEnum.enumValues[number];
  relationshipDetails?: string | null;
  isPrimaryRelationship?: boolean;
  marriageDate?: Date | string | null;
  divorceDate?: Date | string | null;
}

export interface FormContext {
  petitioner: {
    firstName: string;
    lastName: string;
    fullName: string;
  } | null;
  beneficiary: {
    firstName: string;
    lastName: string;
    fullName: string;
  } | null;
  relationship: typeof relationshipTypeEnum.enumValues[number] | null;
  relationshipLabel: string | null;
}

// Create a new relationship
export async function createCaseRelationship(
  data: CreateRelationshipData,
  createdBy: number
): Promise<CaseRelationship> {
  const [relationship] = await db
    .insert(caseRelationships)
    .values({
      ...data,
      marriageDate: data.marriageDate ? new Date(data.marriageDate) : null,
      divorceDate: data.divorceDate ? new Date(data.divorceDate) : null,
      createdBy,
    })
    .returning();

  return getCaseRelationshipById(relationship.id);
}

// Get relationship by ID with client details
export async function getCaseRelationshipById(
  relationshipId: number
): Promise<CaseRelationship> {
  const [result] = await db
    .select({
      relationship: caseRelationships,
      petitioner: {
        id: clients.id,
        firstName: clients.firstName,
        lastName: clients.lastName,
        email: clients.email,
      },
      beneficiary: {
        id: clients.id,
        firstName: clients.firstName,
        lastName: clients.lastName,
        email: clients.email,
      },
    })
    .from(caseRelationships)
    .innerJoin(clients, eq(caseRelationships.petitionerId, clients.id))
    .leftJoin(
      clients as typeof clients,
      eq(caseRelationships.beneficiaryId, clients.id)
    )
    .where(eq(caseRelationships.id, relationshipId));

  if (!result) {
    throw new Error('Relationship not found');
  }

  return {
    ...result.relationship,
    petitioner: result.petitioner,
    beneficiary: result.beneficiary,
  };
}

// Get all relationships for a case
export async function getCaseRelationships(
  caseId: number
): Promise<CaseRelationship[]> {
  const results = await db
    .select({
      relationship: caseRelationships,
      petitioner: {
        id: clients.id,
        firstName: clients.firstName,
        lastName: clients.lastName,
        email: clients.email,
      },
    })
    .from(caseRelationships)
    .innerJoin(
      clients,
      eq(caseRelationships.petitionerId, clients.id)
    )
    .where(eq(caseRelationships.caseId, caseId));

  // Get beneficiaries in separate query to handle the leftJoin properly
  const relationshipIds = results.map(r => r.relationship.id);
  const beneficiaries = await db
    .select({
      relationshipId: caseRelationships.id,
      beneficiary: {
        id: clients.id,
        firstName: clients.firstName,
        lastName: clients.lastName,
        email: clients.email,
      },
    })
    .from(caseRelationships)
    .innerJoin(clients, eq(caseRelationships.beneficiaryId, clients.id))
    .where(
      and(
        eq(caseRelationships.caseId, caseId),
        isNotNull(caseRelationships.beneficiaryId)
      )
    );

  const beneficiaryMap = new Map(
    beneficiaries.map(b => [b.relationshipId, b.beneficiary])
  );

  return results.map(r => ({
    ...r.relationship,
    petitioner: r.petitioner,
    beneficiary: beneficiaryMap.get(r.relationship.id) || null,
  }));
}

// Get primary relationship for a case (usually for form context)
export async function getPrimaryCaseRelationship(
  caseId: number
): Promise<CaseRelationship | null> {
  const relationships = await getCaseRelationships(caseId);
  return relationships.find(r => r.isPrimaryRelationship) || relationships[0] || null;
}

// Get form context from a case relationship
export async function getFormContext(
  caseId: number
): Promise<FormContext> {
  const relationship = await getPrimaryCaseRelationship(caseId);

  if (!relationship) {
    return {
      petitioner: null,
      beneficiary: null,
      relationship: null,
      relationshipLabel: null,
    };
  }

  const relationshipLabels: Record<string, string> = {
    spouse: 'Spouse',
    parent: 'Parent',
    child: 'Child',
    sibling: 'Sibling',
    grandparent: 'Grandparent',
    grandchild: 'Grandchild',
    stepparent: 'Stepparent',
    stepchild: 'Stepchild',
    employer: 'Employer',
    employee: 'Employee',
    self: 'Self',
    other: relationship.relationshipDetails || 'Other',
  };

  return {
    petitioner: relationship.petitioner ? {
      firstName: relationship.petitioner.firstName,
      lastName: relationship.petitioner.lastName,
      fullName: `${relationship.petitioner.firstName} ${relationship.petitioner.lastName}`.trim(),
    } : null,
    beneficiary: relationship.beneficiary ? {
      firstName: relationship.beneficiary.firstName,
      lastName: relationship.beneficiary.lastName,
      fullName: `${relationship.beneficiary.firstName} ${relationship.beneficiary.lastName}`.trim(),
    } : null,
    relationship: relationship.relationshipType,
    relationshipLabel: relationshipLabels[relationship.relationshipType] || 'Other',
  };
}

// Update a relationship
export async function updateCaseRelationship(
  relationshipId: number,
  data: Partial<CreateRelationshipData>
): Promise<CaseRelationship> {
  await db
    .update(caseRelationships)
    .set({
      ...data,
      marriageDate: data.marriageDate ? new Date(data.marriageDate) : undefined,
      divorceDate: data.divorceDate ? new Date(data.divorceDate) : undefined,
      updatedAt: new Date(),
    })
    .where(eq(caseRelationships.id, relationshipId));

  return getCaseRelationshipById(relationshipId);
}

// Delete a relationship
export async function deleteCaseRelationship(
  relationshipId: number
): Promise<void> {
  await db
    .delete(caseRelationships)
    .where(eq(caseRelationships.id, relationshipId));
}

// Check if a case has relationships configured
export async function caseHasRelationships(caseId: number): Promise<boolean> {
  const [result] = await db
    .select({ count: caseRelationships.id })
    .from(caseRelationships)
    .where(eq(caseRelationships.caseId, caseId))
    .limit(1);

  return !!result;
}