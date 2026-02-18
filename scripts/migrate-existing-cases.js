/**
 * Migration script to populate relationships for existing cases
 * This script will:
 * 1. Find cases without relationships
 * 2. Create default relationships based on case client data
 * 3. Allow manual configuration later through UI
 */

const { db } = require('../lib/db/drizzle');
const { cases, clients, caseRelationships } = require('../lib/db/schema');
const { eq, isNull, and } = require('drizzle-orm');

async function migrateExistingCases() {
  console.log('🔄 Starting migration of existing cases...');

  try {
    // Find cases without relationships
    const casesWithoutRelationships = await db
      .select({
        case: cases,
        client: clients,
      })
      .from(cases)
      .innerJoin(clients, eq(cases.clientId, clients.id))
      .leftJoin(caseRelationships, eq(caseRelationships.caseId, cases.id))
      .where(and(
        isNull(cases.deletedAt),
        isNull(caseRelationships.id) // No existing relationship
      ));

    console.log(`📊 Found ${casesWithoutRelationships.length} cases without relationships`);

    if (casesWithoutRelationships.length === 0) {
      console.log('✅ All cases already have relationships configured');
      return;
    }

    // Create default relationships
    const newRelationships = [];

    for (const { case: caseData, client } of casesWithoutRelationships) {
      // Create a self-relationship as default
      // The client is both petitioner and (temporarily) beneficiary
      // until they configure the actual beneficiary
      const relationship = {
        caseId: caseData.id,
        petitionerId: client.id,
        beneficiaryId: null, // Will be configured later
        relationshipType: 'self', // Default relationship type
        relationshipDetails: 'To be configured',
        isPrimaryRelationship: true,
        marriageDate: null,
        divorceDate: null,
        createdBy: 1, // System user ID
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      newRelationships.push(relationship);
    }

    // Insert new relationships
    if (newRelationships.length > 0) {
      await db.insert(caseRelationships).values(newRelationships);
      console.log(`✅ Created ${newRelationships.length} default relationships`);
    }

    console.log('🎉 Migration completed successfully!');
    console.log('📝 Next steps:');
    console.log('  1. Users should configure actual beneficiary information');
    console.log('  2. Update relationship types from "self" to actual relationships');
    console.log('  3. Forms will now show personalized labels');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

// Run migration if called directly
if (require.main === module) {
  migrateExistingCases()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = { migrateExistingCases };