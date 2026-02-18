import 'dotenv/config';
import { db } from './drizzle';
import { formTypes, evidenceRules } from './schema';
import { I130_SCHEMA } from './schemas/i-130';
import { I131_SCHEMA } from './schemas/i-131';

const I485_SCHEMA = {
  formCode: 'I-485',
  parts: [
    {
      id: 'part1',
      title: 'Information About You',
      sections: [
        {
          id: 'personal',
          title: 'Full Name',
          fields: [
            {
              id: 'familyName',
              type: 'text',
              label: 'Family Name (Last Name)',
              required: true,
              maxLength: 33,
            },
            {
              id: 'givenName',
              type: 'text',
              label: 'Given Name (First Name)',
              required: true,
              maxLength: 33,
            },
            {
              id: 'middleName',
              type: 'text',
              label: 'Middle Name',
              required: false,
              maxLength: 33,
            },
          ],
        },
      ],
    },
  ],
};

const I765_SCHEMA = {
  formCode: 'I-765',
  parts: [
    {
      id: 'part1',
      title: 'Reason for Applying',
      sections: [
        {
          id: 'eligibility',
          title: 'Eligibility Category',
          fields: [
            {
              id: 'category',
              type: 'select',
              label: 'I am applying for',
              required: true,
              options: [
                { value: 'initial', label: 'Initial permission to accept employment' },
                { value: 'replacement', label: 'Replacement of lost/stolen/damaged EAD' },
                { value: 'renewal', label: 'Renewal of my permission to accept employment' },
              ],
            },
          ],
        },
      ],
    },
  ],
};

// I131_SCHEMA imported from ./schemas/i-131

// Form types to seed
const formTypesData = [
  {
    code: 'I-130',
    name: 'Petition for Alien Relative',
    description: 'Used by a U.S. citizen or lawful permanent resident to establish a relationship to certain alien relatives who wish to immigrate to the United States.',
    formSchema: I130_SCHEMA,
    validationRules: {
      rules: [
        {
          id: 'petitioner-age',
          message: 'Petitioner must be at least 18 years old',
          condition: 'calculateAge(part2.personalInfo.dateOfBirth) >= 18',
        },
      ],
    },
    estimatedTimeMinutes: 60,
    category: 'family',
    uscisEdition: '03/22/2023',
    version: 1,
    isActive: true,
  },
  {
    code: 'I-485',
    name: 'Application to Register Permanent Residence or Adjust Status',
    description: 'Used to apply for lawful permanent resident status (Green Card) while in the United States.',
    formSchema: I485_SCHEMA,
    validationRules: { rules: [] },
    estimatedTimeMinutes: 90,
    category: 'family',
    uscisEdition: '07/01/2024',
    version: 1,
    isActive: true,
  },
  {
    code: 'I-765',
    name: 'Application for Employment Authorization',
    description: 'Used to request an Employment Authorization Document (EAD).',
    formSchema: I765_SCHEMA,
    validationRules: { rules: [] },
    estimatedTimeMinutes: 45,
    category: 'employment',
    uscisEdition: '02/14/2022',
    version: 1,
    isActive: true,
  },
  {
    code: 'I-131',
    name: 'Application for Travel Document',
    description: 'Used to apply for a reentry permit, refugee travel document, or advance parole.',
    formSchema: I131_SCHEMA,
    validationRules: { rules: [] },
    estimatedTimeMinutes: 30,
    category: 'travel',
    uscisEdition: '11/14/2023',
    version: 1,
    isActive: true,
  },
  {
    code: 'I-864',
    name: 'Affidavit of Support Under Section 213A of the INA',
    description: 'Used to show that an immigrant has adequate means of financial support.',
    formSchema: { formCode: 'I-864', parts: [] },
    validationRules: { rules: [] },
    estimatedTimeMinutes: 45,
    category: 'family',
    uscisEdition: '03/06/2024',
    version: 1,
    isActive: true,
  },
  {
    code: 'N-400',
    name: 'Application for Naturalization',
    description: 'Used to apply for U.S. citizenship (naturalization).',
    formSchema: { formCode: 'N-400', parts: [] },
    validationRules: { rules: [] },
    estimatedTimeMinutes: 90,
    category: 'naturalization',
    uscisEdition: '04/01/2024',
    version: 1,
    isActive: true,
  },
  {
    code: 'I-589',
    name: 'Application for Asylum and for Withholding of Removal',
    description: 'Used to apply for asylum in the United States and for withholding of removal.',
    formSchema: { formCode: 'I-589', parts: [] },
    validationRules: { rules: [] },
    estimatedTimeMinutes: 120,
    category: 'humanitarian',
    uscisEdition: '10/31/2023',
    version: 1,
    isActive: true,
  },
];

// Evidence rules to seed
const evidenceRulesData = [
  // I-130 evidence rules
  { formTypeCode: 'I-130', category: 'identity', subcategory: 'petitioner_id', isRequired: true, description: 'Copy of petitioner\'s birth certificate, passport, or naturalization certificate' },
  { formTypeCode: 'I-130', category: 'identity', subcategory: 'beneficiary_id', isRequired: true, description: 'Copy of beneficiary\'s birth certificate and passport bio page' },
  { formTypeCode: 'I-130', category: 'relationship', subcategory: 'marriage_certificate', isRequired: true, description: 'Marriage certificate (for spouse petitions)', caseType: 'family_based' },
  { formTypeCode: 'I-130', category: 'relationship', subcategory: 'proof_of_relationship', isRequired: true, description: 'Evidence of bona fide relationship (photos, joint accounts, correspondence)' },
  { formTypeCode: 'I-130', category: 'financial', subcategory: 'passport_photos', isRequired: true, description: 'Two passport-style photos of petitioner and beneficiary' },

  // I-485 evidence rules
  { formTypeCode: 'I-485', category: 'identity', subcategory: 'birth_certificate', isRequired: true, description: 'Birth certificate with English translation' },
  { formTypeCode: 'I-485', category: 'identity', subcategory: 'passport', isRequired: true, description: 'Valid passport' },
  { formTypeCode: 'I-485', category: 'medical', subcategory: 'i693', isRequired: true, description: 'Form I-693 Medical Examination' },
  { formTypeCode: 'I-485', category: 'financial', subcategory: 'i864', isRequired: true, description: 'Form I-864 Affidavit of Support' },

  // I-765 evidence rules
  { formTypeCode: 'I-765', category: 'identity', subcategory: 'photos', isRequired: true, description: 'Two passport-style photos' },
  { formTypeCode: 'I-765', category: 'eligibility', subcategory: 'i94', isRequired: true, description: 'Copy of I-94 or evidence of immigration status' },
];

export async function seedFormTypes() {
  console.log('🌱 Seeding form types...');

  for (const formType of formTypesData) {
    try {
      await db
        .insert(formTypes)
        .values({
          code: formType.code,
          name: formType.name,
          description: formType.description,
          formSchema: formType.formSchema,
          validationRules: formType.validationRules,
          estimatedTimeMinutes: formType.estimatedTimeMinutes,
          category: formType.category,
          uscisEdition: formType.uscisEdition,
          version: formType.version,
          isActive: formType.isActive,
        })
        .onConflictDoUpdate({
          target: formTypes.code,
          set: {
            formSchema: formType.formSchema,
            validationRules: formType.validationRules,
            uscisEdition: formType.uscisEdition,
            version: formType.version,
            updatedAt: new Date(),
          },
        });

      console.log(`  ✅ ${formType.code}: ${formType.name}`);
    } catch (error) {
      console.log(`  ⚠️ ${formType.code}: Already exists or error`);
    }
  }

  console.log('✅ Form types seeded successfully!');
}

export async function seedEvidenceRules() {
  console.log('🌱 Seeding evidence rules...');

  // Get form type IDs
  const formTypeRecords = await db.select().from(formTypes);
  const formTypeMap = new Map(formTypeRecords.map((ft) => [ft.code, ft.id]));

  for (const rule of evidenceRulesData) {
    const formTypeId = formTypeMap.get(rule.formTypeCode);
    if (!formTypeId) {
      console.log(`  ⚠️ Form type ${rule.formTypeCode} not found, skipping rule`);
      continue;
    }

    try {
      await db.insert(evidenceRules).values({
        formTypeId,
        caseType: rule.caseType as any,
        category: rule.category,
        subcategory: rule.subcategory,
        isRequired: rule.isRequired,
        description: rule.description,
      });
      console.log(`  ✅ ${rule.formTypeCode} - ${rule.category}/${rule.subcategory}`);
    } catch (error) {
      console.log(`  ⚠️ Rule already exists or error: ${rule.category}/${rule.subcategory}`);
    }
  }

  console.log('✅ Evidence rules seeded successfully!');
}

// Main function to run all seeders
async function main() {
  try {
    await seedFormTypes();
    await seedEvidenceRules();
    console.log('\n🎉 All seeders completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

// Run if called directly
main();
