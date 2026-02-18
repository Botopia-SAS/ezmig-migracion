/**
 * Complete USCIS Form I-131 (Application for Travel Document) Schema
 *
 * Based on the official USCIS I-131 form structure.
 * Each field includes a pdfField mapping to the AcroForm field name.
 * conditionalDisplay is used for fields that only appear based on prior answers.
 */

const US_STATES = [
  { value: 'AL', label: 'Alabama' }, { value: 'AK', label: 'Alaska' },
  { value: 'AZ', label: 'Arizona' }, { value: 'AR', label: 'Arkansas' },
  { value: 'CA', label: 'California' }, { value: 'CO', label: 'Colorado' },
  { value: 'CT', label: 'Connecticut' }, { value: 'DE', label: 'Delaware' },
  { value: 'FL', label: 'Florida' }, { value: 'GA', label: 'Georgia' },
  { value: 'HI', label: 'Hawaii' }, { value: 'ID', label: 'Idaho' },
  { value: 'IL', label: 'Illinois' }, { value: 'IN', label: 'Indiana' },
  { value: 'IA', label: 'Iowa' }, { value: 'KS', label: 'Kansas' },
  { value: 'KY', label: 'Kentucky' }, { value: 'LA', label: 'Louisiana' },
  { value: 'ME', label: 'Maine' }, { value: 'MD', label: 'Maryland' },
  { value: 'MA', label: 'Massachusetts' }, { value: 'MI', label: 'Michigan' },
  { value: 'MN', label: 'Minnesota' }, { value: 'MS', label: 'Mississippi' },
  { value: 'MO', label: 'Missouri' }, { value: 'MT', label: 'Montana' },
  { value: 'NE', label: 'Nebraska' }, { value: 'NV', label: 'Nevada' },
  { value: 'NH', label: 'New Hampshire' }, { value: 'NJ', label: 'New Jersey' },
  { value: 'NM', label: 'New Mexico' }, { value: 'NY', label: 'New York' },
  { value: 'NC', label: 'North Carolina' }, { value: 'ND', label: 'North Dakota' },
  { value: 'OH', label: 'Ohio' }, { value: 'OK', label: 'Oklahoma' },
  { value: 'OR', label: 'Oregon' }, { value: 'PA', label: 'Pennsylvania' },
  { value: 'RI', label: 'Rhode Island' }, { value: 'SC', label: 'South Carolina' },
  { value: 'SD', label: 'South Dakota' }, { value: 'TN', label: 'Tennessee' },
  { value: 'TX', label: 'Texas' }, { value: 'UT', label: 'Utah' },
  { value: 'VT', label: 'Vermont' }, { value: 'VA', label: 'Virginia' },
  { value: 'WA', label: 'Washington' }, { value: 'WV', label: 'West Virginia' },
  { value: 'WI', label: 'Wisconsin' }, { value: 'WY', label: 'Wyoming' },
  { value: 'DC', label: 'District of Columbia' },
];

export const I131_SCHEMA = {
  formCode: 'I-131',
  parts: [
    // =============================================
    // PART 1: Application Type
    // =============================================
    {
      id: 'part1',
      title: 'Part 1. Application Type',
      sections: [
        {
          id: 'applicationType',
          title: 'Application Type',
          description: 'Select the type of travel document you are applying for.',
          fields: [
            {
              id: 'g28Attached',
              type: 'checkbox',
              label: 'I am filing Form G-28 with this application.',
              required: false,
              pdfField: 'form1[0].P1[0].G28_Attached[0]',
            },
            {
              id: 'documentType',
              type: 'radio',
              label: 'I am applying for:',
              required: true,
              options: [
                { value: 'reentryPermit', label: '1.a. Reentry Permit (I am a lawful permanent resident or conditional permanent resident)' },
                { value: 'refugeeTravelDoc', label: '2. Refugee Travel Document (I have refugee or asylee status)' },
                { value: 'tpsTravel', label: '3. TPS Travel Authorization (I am a Temporary Protected Status beneficiary)' },
                { value: 'advanceParole', label: '4. Advance Parole Document (I have a pending I-485 or other qualifying application)' },
                { value: 'paroleDocument', label: '5. Parole into the United States (initial parole or re-parole)' },
              ],
              pdfField: 'Part1_DocumentType',
              subFields: [
                { value: 'reentryPermit', pdfField: 'form1[0].P1[0].CB_AppType[0]' },
                { value: 'refugeeTravelDoc', pdfField: 'form1[0].P2[0].CB_AppType[0]' },
                { value: 'tpsTravel', pdfField: 'form1[0].P2[0].CB_AppType[3]' },
                { value: 'advanceParole', pdfField: 'form1[0].P2[0].CB_AppType[5]' },
                { value: 'paroleDocument', pdfField: 'form1[0].P2[0].CB_AppType[7]' },
              ],
            },
            {
              id: 'reentryPermitType',
              type: 'radio',
              label: 'Reentry Permit Type',
              required: false,
              options: [
                { value: 'initial', label: '1.a. Initial Reentry Permit' },
                { value: 'replacement', label: '1.b. Replacement Reentry Permit (lost, stolen, or damaged)' },
                { value: 'renewal', label: '1.c. Renewal of Reentry Permit' },
              ],
              pdfField: 'Part1_ReentryPermitType',
              subFields: [
                { value: 'initial', pdfField: 'form1[0].P1[0].CB_AppType[0]' },
                { value: 'replacement', pdfField: 'form1[0].P1[0].CB_AppType[1]' },
                { value: 'renewal', pdfField: 'form1[0].P1[0].CB_AppType[2]' },
              ],
              conditionalDisplay: {
                field: 'part1.applicationType.documentType',
                value: 'reentryPermit',
              },
            },
            {
              id: 'refugeeDocType',
              type: 'radio',
              label: 'Refugee Travel Document Type',
              required: false,
              options: [
                { value: 'initial', label: '2.a. Initial Refugee Travel Document' },
                { value: 'replacement', label: '2.b. Replacement (lost, stolen, or damaged)' },
                { value: 'renewal', label: '2.c. Renewal' },
              ],
              pdfField: 'Part1_RefugeeDocType',
              subFields: [
                { value: 'initial', pdfField: 'form1[0].P2[0].CB_AppType[0]' },
                { value: 'replacement', pdfField: 'form1[0].P2[0].CB_AppType[1]' },
                { value: 'renewal', pdfField: 'form1[0].P2[0].CB_AppType[2]' },
              ],
              conditionalDisplay: {
                field: 'part1.applicationType.documentType',
                value: 'refugeeTravelDoc',
              },
            },
            {
              id: 'tpsTravelType',
              type: 'radio',
              label: 'TPS Travel Authorization Type',
              required: false,
              options: [
                { value: 'initial', label: '3.a. Initial TPS Travel Authorization' },
                { value: 'replacement', label: '3.b. Replacement (lost, stolen, or damaged)' },
              ],
              pdfField: 'Part1_TpsTravelType',
              subFields: [
                { value: 'initial', pdfField: 'form1[0].P2[0].CB_AppType[3]' },
                { value: 'replacement', pdfField: 'form1[0].P2[0].CB_AppType[4]' },
              ],
              conditionalDisplay: {
                field: 'part1.applicationType.documentType',
                value: 'tpsTravel',
              },
            },
            {
              id: 'advanceParoleType',
              type: 'radio',
              label: 'Advance Parole Type',
              required: false,
              options: [
                { value: 'i485Pending', label: '4.a. Advance Parole (I-485 pending)' },
                { value: 'otherBasis', label: '5. Advance Parole (other basis)' },
                { value: 'initialReplace', label: '4.b. Replacement (lost, stolen, or damaged)' },
              ],
              pdfField: 'Part1_AdvanceParoleType',
              subFields: [
                { value: 'i485Pending', pdfField: 'form1[0].P2[0].CB_AppType[5]' },
                { value: 'otherBasis', pdfField: 'form1[0].P2[0].CB_AppType[7]' },
                { value: 'initialReplace', pdfField: 'form1[0].P2[0].CB_AppType[6]' },
              ],
              conditionalDisplay: {
                field: 'part1.applicationType.documentType',
                value: 'advanceParole',
              },
            },
            {
              id: 'paroleType',
              type: 'radio',
              label: 'Parole Type',
              required: false,
              options: [
                { value: 'initialParole', label: '6. Initial Parole' },
                { value: 'reParole', label: '7. Re-Parole' },
                { value: 'paroleLostDamaged', label: '8. Replacement (lost, stolen, or damaged)' },
              ],
              pdfField: 'Part1_ParoleType',
              subFields: [
                { value: 'initialParole', pdfField: 'form1[0].P2[0].CB_AppType[8]' },
                { value: 'reParole', pdfField: 'form1[0].P2[0].CB_AppType[9]' },
                { value: 'paroleLostDamaged', pdfField: 'form1[0].P2[0].CB_AppType[10]' },
              ],
              conditionalDisplay: {
                field: 'part1.applicationType.documentType',
                value: 'paroleDocument',
              },
            },
            {
              id: 'previouslyDenied',
              type: 'radio',
              label: '13. Have you EVER before been issued a Reentry Permit, Refugee Travel Document, or Advance Parole Document?',
              required: true,
              options: [
                { value: 'yes', label: 'Yes' },
                { value: 'no', label: 'No' },
              ],
              pdfField: 'Part1_Line13_PreviouslyDenied',
              subFields: [
                { value: 'yes', pdfField: 'form1[0].P4[0].P1_Line13_YesNo[0]' },
                { value: 'no', pdfField: 'form1[0].P4[0].P1_Line13_YesNo[1]' },
              ],
            },
          ],
        },
      ],
    },

    // =============================================
    // PART 2: Information About You
    // =============================================
    {
      id: 'part2',
      title: 'Part 2. Information About You',
      sections: [
        {
          id: 'names',
          title: 'Your Full Legal Name',
          fields: [
            {
              id: 'familyName',
              type: 'text',
              label: 'Family Name (Last Name)',
              required: true,
              maxLength: 33,
              pdfField: 'form1[0].P4[0].Part2_Line1_FamilyName[0]',
            },
            {
              id: 'givenName',
              type: 'text',
              label: 'Given Name (First Name)',
              required: true,
              maxLength: 33,
              pdfField: 'form1[0].P4[0].Part2_Line1_GivenName[0]',
            },
            {
              id: 'middleName',
              type: 'text',
              label: 'Middle Name',
              required: false,
              maxLength: 33,
              pdfField: 'form1[0].P4[0].Part2_Line1_MiddleName[0]',
            },
          ],
        },
        {
          id: 'otherNames',
          title: 'Other Names Used',
          description: 'Provide all other names you have ever used, including aliases, maiden name, and nicknames.',
          fields: [
            {
              id: 'otherFamilyName1',
              type: 'text',
              label: 'Other Family Name 1 (Last Name)',
              required: false,
              maxLength: 33,
              pdfField: 'form1[0].P5[0].Part2_Line2_FamilyName1[0]',
            },
            {
              id: 'otherGivenName1',
              type: 'text',
              label: 'Other Given Name 1 (First Name)',
              required: false,
              maxLength: 33,
              pdfField: 'form1[0].P5[0].Part2_Line2_GivenName1[0]',
            },
            {
              id: 'otherMiddleName1',
              type: 'text',
              label: 'Other Middle Name 1',
              required: false,
              maxLength: 33,
              pdfField: 'form1[0].P5[0].Part2_Line2_MiddleName1[0]',
            },
            {
              id: 'otherFamilyName2',
              type: 'text',
              label: 'Other Family Name 2 (Last Name)',
              required: false,
              maxLength: 33,
              pdfField: 'form1[0].P5[0].Part2_Line2_FamilyName2[0]',
            },
            {
              id: 'otherGivenName2',
              type: 'text',
              label: 'Other Given Name 2 (First Name)',
              required: false,
              maxLength: 33,
              pdfField: 'form1[0].P5[0].Part2_Line2_GivenName2[0]',
            },
            {
              id: 'otherMiddleName2',
              type: 'text',
              label: 'Other Middle Name 2',
              required: false,
              maxLength: 33,
              pdfField: 'form1[0].P5[0].Part2_Line2_MiddleName2[0]',
            },
            {
              id: 'otherFamilyName3',
              type: 'text',
              label: 'Other Family Name 3 (Last Name)',
              required: false,
              maxLength: 33,
              pdfField: 'form1[0].P5[0].Part2_Line2_FamilyName3[0]',
            },
            {
              id: 'otherGivenName3',
              type: 'text',
              label: 'Other Given Name 3 (First Name)',
              required: false,
              maxLength: 33,
              pdfField: 'form1[0].P5[0].Part2_Line2_GivenName3[0]',
            },
            {
              id: 'otherMiddleName3',
              type: 'text',
              label: 'Other Middle Name 3',
              required: false,
              maxLength: 33,
              pdfField: 'form1[0].P5[0].Part2_Line2_MiddleName3[0]',
            },
          ],
        },
        {
          id: 'mailingAddress',
          title: 'U.S. Mailing Address',
          fields: [
            {
              id: 'inCareOf',
              type: 'text',
              label: 'In Care Of Name',
              required: false,
              maxLength: 34,
              pdfField: 'form1[0].P5[0].Part2_Line3_InCareofName[0]',
            },
            {
              id: 'streetNumber',
              type: 'text',
              label: 'Street Number and Name',
              required: true,
              maxLength: 34,
              pdfField: 'form1[0].P5[0].Part2_Line3_StreetNumberName[0]',
            },
            {
              id: 'aptType',
              type: 'radio',
              label: 'Apt/Ste/Flr',
              required: false,
              options: [
                { value: 'apt', label: 'Apt.' },
                { value: 'ste', label: 'Ste.' },
                { value: 'flr', label: 'Flr.' },
              ],
              pdfField: 'Part2_Line3_Unit',
              subFields: [
                { value: 'apt', pdfField: 'form1[0].P5[0].Part2_Line3_Unit[0]' },
                { value: 'ste', pdfField: 'form1[0].P5[0].Part2_Line3_Unit[1]' },
                { value: 'flr', pdfField: 'form1[0].P5[0].Part2_Line3_Unit[2]' },
              ],
            },
            {
              id: 'aptNumber',
              type: 'text',
              label: 'Number',
              required: false,
              maxLength: 6,
              pdfField: 'form1[0].P5[0].Part2_Line3_AptSteFlrNumber[0]',
            },
            {
              id: 'city',
              type: 'text',
              label: 'City or Town',
              required: true,
              maxLength: 20,
              pdfField: 'form1[0].P5[0].Part2_Line3_CityTown[0]',
            },
            {
              id: 'state',
              type: 'select',
              label: 'State',
              required: false,
              options: US_STATES,
              pdfField: 'form1[0].P5[0].Part2_Line3_State[0]',
            },
            {
              id: 'zipCode',
              type: 'text',
              label: 'ZIP Code',
              required: false,
              maxLength: 5,
              pdfField: 'form1[0].P5[0].Part2_Line3_ZipCode[0]',
            },
            {
              id: 'province',
              type: 'text',
              label: 'Province',
              required: false,
              maxLength: 20,
              pdfField: 'form1[0].P5[0].Part2_Line3_Province[0]',
            },
            {
              id: 'postalCode',
              type: 'text',
              label: 'Postal Code',
              required: false,
              maxLength: 9,
              pdfField: 'form1[0].P5[0].Part2_Line3_PostalCode[0]',
            },
            {
              id: 'country',
              type: 'text',
              label: 'Country',
              required: true,
              maxLength: 30,
              pdfField: 'form1[0].P5[0].Part2_Line3_Country[0]',
            },
          ],
        },
        {
          id: 'physicalAddress',
          title: 'Physical Address',
          description: 'Provide your physical address if different from your mailing address.',
          fields: [
            {
              id: 'physInCareOf',
              type: 'text',
              label: 'In Care Of Name',
              required: false,
              maxLength: 34,
              pdfField: 'form1[0].P5[0].Part2_Line4_InCareofName[0]',
            },
            {
              id: 'physStreetNumber',
              type: 'text',
              label: 'Street Number and Name',
              required: false,
              maxLength: 34,
              pdfField: 'form1[0].P5[0].Part2_Line4_StreetNumberName[0]',
            },
            {
              id: 'physAptType',
              type: 'radio',
              label: 'Apt/Ste/Flr',
              required: false,
              options: [
                { value: 'apt', label: 'Apt.' },
                { value: 'ste', label: 'Ste.' },
                { value: 'flr', label: 'Flr.' },
              ],
              pdfField: 'Part2_Line4_Unit',
              subFields: [
                { value: 'apt', pdfField: 'form1[0].P5[0].Part2_Line4_Unit[0]' },
                { value: 'ste', pdfField: 'form1[0].P5[0].Part2_Line4_Unit[1]' },
                { value: 'flr', pdfField: 'form1[0].P5[0].Part2_Line4_Unit[2]' },
              ],
            },
            {
              id: 'physAptNumber',
              type: 'text',
              label: 'Number',
              required: false,
              maxLength: 6,
              pdfField: 'form1[0].P5[0].Part2_Line4_AptSteFlrNumber[0]',
            },
            {
              id: 'physCity',
              type: 'text',
              label: 'City or Town',
              required: false,
              maxLength: 20,
              pdfField: 'form1[0].P5[0].Part2_Line4_CityTown[0]',
            },
            {
              id: 'physState',
              type: 'select',
              label: 'State',
              required: false,
              options: US_STATES,
              pdfField: 'form1[0].P5[0].Part2_Line4_State[0]',
            },
            {
              id: 'physZipCode',
              type: 'text',
              label: 'ZIP Code',
              required: false,
              maxLength: 5,
              pdfField: 'form1[0].P5[0].Part2_Line4_ZipCode[0]',
            },
            {
              id: 'physProvince',
              type: 'text',
              label: 'Province',
              required: false,
              maxLength: 20,
              pdfField: 'form1[0].P5[0].Part2_Line4_Province[0]',
            },
            {
              id: 'physPostalCode',
              type: 'text',
              label: 'Postal Code',
              required: false,
              maxLength: 9,
              pdfField: 'form1[0].P5[0].Part2_Line4_PostalCode[0]',
            },
            {
              id: 'physCountry',
              type: 'text',
              label: 'Country',
              required: false,
              maxLength: 30,
              pdfField: 'form1[0].P5[0].Part2_Line4_Country[0]',
            },
          ],
        },
        {
          id: 'personalInfo',
          title: 'Other Personal Information',
          fields: [
            {
              id: 'alienNumber',
              type: 'alien_number',
              label: 'Alien Registration Number (A-Number)',
              required: false,
              helpText: 'If you have an A-Number, enter it here. This is a 7 to 9-digit number.',
              pdfField: 'form1[0].P5[0].#area[0].Part2_Line5_AlienNumber[0]',
            },
            {
              id: 'countryOfBirth',
              type: 'text',
              label: 'Country of Birth',
              required: true,
              pdfField: 'form1[0].P5[0].Part2_Line6_CountryOfBirth[0]',
            },
            {
              id: 'citizenship',
              type: 'text',
              label: 'Country of Citizenship or Nationality',
              required: true,
              pdfField: 'form1[0].P5[0].Part2_Line7_CountryOfCitizenshiporNationality[0]',
            },
            {
              id: 'gender',
              type: 'radio',
              label: 'Gender',
              required: true,
              options: [
                { value: 'male', label: 'Male' },
                { value: 'female', label: 'Female' },
              ],
              pdfField: 'Part2_Line8_Gender',
              subFields: [
                { value: 'male', pdfField: 'form1[0].P5[0].Part2_Line8_Gender[0]' },
                { value: 'female', pdfField: 'form1[0].P5[0].Part2_Line8_Gender[1]' },
              ],
            },
            {
              id: 'dateOfBirth',
              type: 'date',
              label: 'Date of Birth',
              required: true,
              pdfField: 'form1[0].P5[0].Part2_Line9_DateOfBirth[0]',
            },
            {
              id: 'ssn',
              type: 'ssn',
              label: 'U.S. Social Security Number',
              required: false,
              pdfField: 'form1[0].P5[0].#area[1].Part2_Line10_SSN[0]',
            },
            {
              id: 'uscisAccountNumber',
              type: 'text',
              label: 'USCIS Online Account Number',
              required: false,
              maxLength: 12,
              helpText: 'If you have previously filed an application or petition with USCIS online.',
              pdfField: 'form1[0].P5[0].Part2_Line11_USCISOnlineAcctNumber[0]',
            },
            {
              id: 'classOfAdmission',
              type: 'text',
              label: 'Class of Admission',
              required: false,
              helpText: 'e.g., IR1, F2A, RE (refugee), AS (asylee)',
              pdfField: 'form1[0].P5[0].Part2_Line12_ClassofAdmission[0]',
            },
            {
              id: 'i94RecordNumber',
              type: 'text',
              label: 'I-94 Arrival-Departure Record Number',
              required: false,
              maxLength: 11,
              pdfField: 'form1[0].P5[0].Part2_Line13_I94RecordNo[0]',
            },
          ],
        },
        {
          id: 'additionalInfo',
          title: 'Additional Information',
          fields: [
            {
              id: 'i94ExpirationDate',
              type: 'date',
              label: 'Expiration Date of Authorized Stay (if any)',
              required: false,
              pdfField: 'form1[0].P6[0].Part2_Line14_I94ExpDate[0]',
            },
            {
              id: 'eMedicalParoleeId',
              type: 'text',
              label: 'eMedical Parolee ID (if applicable)',
              required: false,
              pdfField: 'form1[0].P6[0].Par2_Line15_eMedicalParoleeID[0]',
            },
            {
              id: 'currentImmigrationJudgeFamilyName',
              type: 'text',
              label: 'Current Immigration Judge Family Name (Last Name)',
              required: false,
              maxLength: 33,
              pdfField: 'form1[0].P6[0].P2_Line16_FamilyName[0]',
            },
            {
              id: 'currentImmigrationJudgeGivenName',
              type: 'text',
              label: 'Current Immigration Judge Given Name (First Name)',
              required: false,
              maxLength: 33,
              pdfField: 'form1[0].P6[0].P2_Line16_GivenName[0]',
            },
            {
              id: 'currentImmigrationJudgeMiddleName',
              type: 'text',
              label: 'Current Immigration Judge Middle Name',
              required: false,
              maxLength: 33,
              pdfField: 'form1[0].P6[0].P2_Line16_MiddleName[0]',
            },
          ],
        },
      ],
    },

    // =============================================
    // PART 3: Biographic Information
    // =============================================
    {
      id: 'part3',
      title: 'Part 3. Biographic Information',
      sections: [
        {
          id: 'biographic',
          title: 'Biographic Information',
          description: 'Provide the following information about yourself.',
          fields: [
            {
              id: 'ethnicity',
              type: 'radio',
              label: 'Ethnicity (Select one)',
              required: true,
              options: [
                { value: 'hispanic_latino', label: 'Hispanic or Latino' },
                { value: 'not_hispanic_latino', label: 'Not Hispanic or Latino' },
              ],
              pdfField: 'P3_Line1_Ethnicity',
              subFields: [
                { value: 'hispanic_latino', pdfField: 'form1[0].P7[0].P3_Line1_Ethnicity[0]' },
                { value: 'not_hispanic_latino', pdfField: 'form1[0].P7[0].P3_Line1_Ethnicity[1]' },
              ],
            },
            {
              id: 'race',
              type: 'checkbox_group',
              label: 'Race (Select all applicable)',
              required: true,
              options: [
                { value: 'white', label: 'White' },
                { value: 'asian', label: 'Asian' },
                { value: 'black', label: 'Black or African American' },
                { value: 'american_indian', label: 'American Indian or Alaska Native' },
                { value: 'native_hawaiian', label: 'Native Hawaiian or Other Pacific Islander' },
              ],
              pdfField: 'P3_Line2_Race',
              subFields: [
                { value: 'white', pdfField: 'form1[0].P7[0].P3_Line2_Race_White[0]' },
                { value: 'asian', pdfField: 'form1[0].P7[0].P3_Line2_Race_Asian[0]' },
                { value: 'black', pdfField: 'form1[0].P7[0].P3_Line2_Race_Black[0]' },
                { value: 'american_indian', pdfField: 'form1[0].P7[0].P3_Line2_Race_American[0]' },
                { value: 'native_hawaiian', pdfField: 'form1[0].P7[0].P3_Line2_Race_Hawaiian[0]' },
              ],
            },
            {
              id: 'heightFeet',
              type: 'select',
              label: 'Height (Feet)',
              required: true,
              options: [
                { value: '2', label: '2' }, { value: '3', label: '3' },
                { value: '4', label: '4' }, { value: '5', label: '5' },
                { value: '6', label: '6' }, { value: '7', label: '7' },
                { value: '8', label: '8' },
              ],
              pdfField: 'form1[0].P7[0].P3_Line3_HeightFeet[0]',
            },
            {
              id: 'heightInches',
              type: 'select',
              label: 'Height (Inches)',
              required: true,
              options: [
                { value: '0', label: '0' }, { value: '1', label: '1' },
                { value: '2', label: '2' }, { value: '3', label: '3' },
                { value: '4', label: '4' }, { value: '5', label: '5' },
                { value: '6', label: '6' }, { value: '7', label: '7' },
                { value: '8', label: '8' }, { value: '9', label: '9' },
                { value: '10', label: '10' }, { value: '11', label: '11' },
              ],
              pdfField: 'form1[0].P7[0].P3_Line3_HeightInches[0]',
            },
            {
              id: 'weightPounds1',
              type: 'text',
              label: 'Weight - Hundreds digit',
              required: false,
              maxLength: 1,
              helpText: 'Enter the hundreds digit of your weight (e.g., 1 for 185 lbs).',
              pdfField: 'form1[0].P7[0].P3_Line4_Pound1[0]',
            },
            {
              id: 'weightPounds2',
              type: 'text',
              label: 'Weight - Tens digit',
              required: true,
              maxLength: 1,
              helpText: 'Enter the tens digit of your weight (e.g., 8 for 185 lbs).',
              pdfField: 'form1[0].P7[0].P3_Line4_Pound2[0]',
            },
            {
              id: 'weightPounds3',
              type: 'text',
              label: 'Weight - Ones digit',
              required: true,
              maxLength: 1,
              helpText: 'Enter the ones digit of your weight (e.g., 5 for 185 lbs).',
              pdfField: 'form1[0].P7[0].P3_Line4_Pound3[0]',
            },
            {
              id: 'eyeColor',
              type: 'radio',
              label: 'Eye Color (Select one)',
              required: true,
              options: [
                { value: 'black', label: 'Black' },
                { value: 'blue', label: 'Blue' },
                { value: 'brown', label: 'Brown' },
                { value: 'gray', label: 'Gray' },
                { value: 'green', label: 'Green' },
                { value: 'hazel', label: 'Hazel' },
                { value: 'maroon', label: 'Maroon' },
                { value: 'pink', label: 'Pink' },
                { value: 'unknown', label: 'Unknown/Other' },
              ],
              pdfField: 'P3_Line5_EyeColor',
              subFields: [
                { value: 'black', pdfField: 'form1[0].P7[0].P3_Line5_EyeColor[0]' },
                { value: 'blue', pdfField: 'form1[0].P7[0].P3_Line5_EyeColor[1]' },
                { value: 'brown', pdfField: 'form1[0].P7[0].P3_Line5_EyeColor[2]' },
                { value: 'gray', pdfField: 'form1[0].P7[0].P3_Line5_EyeColor[3]' },
                { value: 'green', pdfField: 'form1[0].P7[0].P3_Line5_EyeColor[4]' },
                { value: 'hazel', pdfField: 'form1[0].P7[0].P3_Line5_EyeColor[5]' },
                { value: 'maroon', pdfField: 'form1[0].P7[0].P3_Line5_EyeColor[6]' },
                { value: 'pink', pdfField: 'form1[0].P7[0].P3_Line5_EyeColor[7]' },
                { value: 'unknown', pdfField: 'form1[0].P7[0].P3_Line5_EyeColor[8]' },
              ],
            },
            {
              id: 'hairColor',
              type: 'radio',
              label: 'Hair Color (Select one)',
              required: true,
              options: [
                { value: 'bald', label: 'Bald (No hair)' },
                { value: 'blond', label: 'Blond' },
                { value: 'gray', label: 'Gray' },
                { value: 'sandy', label: 'Sandy' },
                { value: 'unknown', label: 'Unknown/Other' },
                { value: 'white', label: 'White' },
                { value: 'red', label: 'Red' },
                { value: 'brown', label: 'Brown' },
                { value: 'black', label: 'Black' },
              ],
              pdfField: 'P3_Line6_HairColor',
              subFields: [
                { value: 'bald', pdfField: 'form1[0].P7[0].P3_Line6_HairColor[0]' },
                { value: 'blond', pdfField: 'form1[0].P7[0].P3_Line6_HairColor[1]' },
                { value: 'gray', pdfField: 'form1[0].P7[0].P3_Line6_HairColor[2]' },
                { value: 'sandy', pdfField: 'form1[0].P7[0].P3_Line6_HairColor[3]' },
                { value: 'unknown', pdfField: 'form1[0].P7[0].P3_Line6_HairColor[4]' },
                { value: 'white', pdfField: 'form1[0].P7[0].P3_Line6_HairColor[5]' },
                { value: 'red', pdfField: 'form1[0].P7[0].P3_Line6_HairColor[6]' },
                { value: 'brown', pdfField: 'form1[0].P7[0].P3_Line6_HairColor[7]' },
                { value: 'black', pdfField: 'form1[0].P7[0].P3_Line6_HairColor[8]' },
              ],
            },
          ],
        },
      ],
    },

    // =============================================
    // PART 4: Processing Information
    // =============================================
    {
      id: 'part4',
      title: 'Part 4. Processing Information',
      sections: [
        {
          id: 'processingQuestions',
          title: 'Processing Information',
          description: 'Answer the following questions about your travel document history and processing.',
          fields: [
            {
              id: 'inProceedings',
              type: 'radio',
              label: '1. Are you in removal, exclusion, deportation, or rescission proceedings?',
              required: true,
              options: [
                { value: 'yes', label: 'Yes' },
                { value: 'no', label: 'No' },
              ],
              pdfField: 'P4_Line1_YesNo',
              subFields: [
                { value: 'yes', pdfField: 'form1[0].P7[0].P4_Line1_YesNo[0]' },
                { value: 'no', pdfField: 'form1[0].P7[0].P4_Line1_YesNo[1]' },
              ],
            },
            {
              id: 'previousReentryPermit',
              type: 'radio',
              label: '2.a. Have you ever before been issued a Reentry Permit?',
              required: true,
              options: [
                { value: 'yes', label: 'Yes' },
                { value: 'no', label: 'No' },
              ],
              pdfField: 'P4_Line2a_YesNo',
              subFields: [
                { value: 'yes', pdfField: 'form1[0].P7[0].P4_Line2a_YesNo[0]' },
                { value: 'no', pdfField: 'form1[0].P7[0].P4_Line2a_YesNo[1]' },
              ],
            },
            {
              id: 'previousRefugeeTravelDoc',
              type: 'radio',
              label: '3.a. Have you ever before been issued a Refugee Travel Document?',
              required: true,
              options: [
                { value: 'yes', label: 'Yes' },
                { value: 'no', label: 'No' },
              ],
              pdfField: 'P4_Line3a_YesNo',
              subFields: [
                { value: 'yes', pdfField: 'form1[0].P7[0].P4_Line3a_YesNo[0]' },
                { value: 'no', pdfField: 'form1[0].P7[0].P4_Line3a_YesNo[1]' },
              ],
            },
            {
              id: 'replacementRequested',
              type: 'radio',
              label: '4. Are you requesting a replacement travel document (your previous document was lost, stolen, or damaged)?',
              required: true,
              options: [
                { value: 'yes', label: 'Yes' },
                { value: 'no', label: 'No' },
              ],
              pdfField: 'P4_Line4_YesNo',
              subFields: [
                { value: 'yes', pdfField: 'form1[0].P7[0].P4_Line4_YesNo[0]' },
                { value: 'no', pdfField: 'form1[0].P7[0].P4_Line4_YesNo[1]' },
              ],
            },
          ],
        },
        {
          id: 'reentryPermitDetails',
          title: 'Reentry Permit Trip Details',
          description: 'If applying for a Reentry Permit, provide the expected length of your trip.',
          fields: [
            {
              id: 'tripLength',
              type: 'radio',
              label: '5. Expected length of trip (for Reentry Permit applicants)',
              required: false,
              options: [
                { value: 'lessThan6Months', label: 'Less than 6 months' },
                { value: '6months', label: '6 months to 1 year' },
                { value: '1to2years', label: '1 to 2 years' },
                { value: '2to3years', label: '2 to 3 years' },
                { value: '3to4years', label: '3 to 4 years' },
                { value: 'moreThan4years', label: 'More than 4 years' },
              ],
              pdfField: 'P5_Line1_TripLength',
              subFields: [
                { value: 'lessThan6Months', pdfField: 'form1[0].#subform[8].P5_Line1_Lessthan6[0]' },
                { value: '6months', pdfField: 'form1[0].#subform[8].P5_Line1_6months[0]' },
                { value: '1to2years', pdfField: 'form1[0].#subform[8].P5_Line1_1to2[0]' },
                { value: '2to3years', pdfField: 'form1[0].#subform[8].P5_Line1_2to3[0]' },
                { value: '3to4years', pdfField: 'form1[0].#subform[8].P5_Line1_3to4[0]' },
                { value: 'moreThan4years', pdfField: 'form1[0].#subform[8].P5_Line1_morethan[0]' },
              ],
              conditionalDisplay: {
                field: 'part1.applicationType.documentType',
                value: 'reentryPermit',
              },
            },
          ],
        },
        {
          id: 'receivingInfo',
          title: 'Travel Document Delivery',
          fields: [
            {
              id: 'receiveInUS',
              type: 'radio',
              label: '7.a. Do you want to receive your travel document at a U.S. address?',
              required: true,
              options: [
                { value: 'yes', label: 'Yes' },
                { value: 'no', label: 'No' },
              ],
              pdfField: 'P4_Line7a_ReceiveInUS',
              subFields: [
                { value: 'yes', pdfField: 'form1[0].#subform[7].P4_Line7a[0]' },
                { value: 'no', pdfField: 'form1[0].#subform[7].P4_Line7a[1]' },
              ],
            },
            {
              id: 'sameAddressForDelivery',
              type: 'radio',
              label: '8. Is the address for delivery the same as your mailing address in Part 2?',
              required: false,
              options: [
                { value: 'yes', label: 'Yes' },
                { value: 'no', label: 'No' },
              ],
              pdfField: 'P4_Line8_SameAddress',
              subFields: [
                { value: 'yes', pdfField: 'form1[0].#subform[8].P4_Line8_CB[0]' },
                { value: 'no', pdfField: 'form1[0].#subform[8].P4_Line8_CB[1]' },
              ],
            },
          ],
        },
        {
          id: 'contactInfo',
          title: 'Contact Information for Processing',
          fields: [
            {
              id: 'daytimePhone',
              type: 'phone',
              label: 'Daytime Telephone Number',
              required: false,
              maxLength: 15,
              pdfField: 'form1[0].#subform[8].P4_Line9b_Email[0]',
            },
            {
              id: 'emailAddress',
              type: 'email',
              label: 'Email Address',
              required: false,
              pdfField: 'form1[0].#subform[8].P4_Line9c_Email[0]',
            },
          ],
        },
      ],
    },

    // =============================================
    // PART 5: For Refugees/Asylees Only
    // =============================================
    {
      id: 'part5',
      title: 'Part 5. Information for Refugees/Asylees',
      sections: [
        {
          id: 'refugeeInfo',
          title: 'Refugee/Asylee Information',
          description: 'Complete this part only if you are applying for a Refugee Travel Document.',
          fields: [
            {
              id: 'countryOfRefugee',
              type: 'text',
              label: '1. Country from which you are a refugee or asylee',
              required: false,
              pdfField: 'form1[0].#subform[8].P6_Line1_CountryRefugee[0]',
              conditionalDisplay: {
                field: 'part1.applicationType.documentType',
                value: 'refugeeTravelDoc',
              },
            },
            {
              id: 'returnedToCountry',
              type: 'radio',
              label: '2. Have you returned to the country listed above since you were granted refugee/asylee status?',
              required: false,
              options: [
                { value: 'yes', label: 'Yes' },
                { value: 'no', label: 'No' },
              ],
              pdfField: 'P6_Line2_ReturnedToCountry',
              subFields: [
                { value: 'yes', pdfField: 'form1[0].#subform[8].P6_Line2_YesNo[0]' },
                { value: 'no', pdfField: 'form1[0].#subform[8].P6_Line2_YesNo[1]' },
              ],
              conditionalDisplay: {
                field: 'part1.applicationType.documentType',
                value: 'refugeeTravelDoc',
              },
            },
            {
              id: 'appliedForNationality',
              type: 'radio',
              label: '3.a. Since you were granted refugee/asylee status, have you, by any legal procedure or voluntary act, reacquired the nationality of the country named above?',
              required: false,
              options: [
                { value: 'yes', label: 'Yes' },
                { value: 'no', label: 'No' },
              ],
              pdfField: 'P6_Line3a_AppliedForNationality',
              subFields: [
                { value: 'yes', pdfField: 'form1[0].#subform[8].P6_Line3a_YesNo[0]' },
                { value: 'no', pdfField: 'form1[0].#subform[8].P6_Line3a_YesNo[1]' },
              ],
              conditionalDisplay: {
                field: 'part1.applicationType.documentType',
                value: 'refugeeTravelDoc',
              },
            },
            {
              id: 'acquiredNewNationality',
              type: 'radio',
              label: '3.b. Have you acquired a new nationality?',
              required: false,
              options: [
                { value: 'yes', label: 'Yes' },
                { value: 'no', label: 'No' },
              ],
              pdfField: 'P6_Line3b_AcquiredNewNationality',
              subFields: [
                { value: 'yes', pdfField: 'form1[0].#subform[8].P6_Line3b_YesNo[0]' },
                { value: 'no', pdfField: 'form1[0].#subform[8].P6_Line3b_YesNo[1]' },
              ],
              conditionalDisplay: {
                field: 'part1.applicationType.documentType',
                value: 'refugeeTravelDoc',
              },
            },
            {
              id: 'grantedAsylumInOtherCountry',
              type: 'radio',
              label: '3.c. Have you been granted permanent residence or citizenship by any other country?',
              required: false,
              options: [
                { value: 'yes', label: 'Yes' },
                { value: 'no', label: 'No' },
              ],
              pdfField: 'P6_Line3c_GrantedAsylumOther',
              subFields: [
                { value: 'yes', pdfField: 'form1[0].#subform[8].P6_Line3c_YesNo[0]' },
                { value: 'no', pdfField: 'form1[0].#subform[8].P6_Line3c_YesNo[1]' },
              ],
              conditionalDisplay: {
                field: 'part1.applicationType.documentType',
                value: 'refugeeTravelDoc',
              },
            },
            {
              id: 'appliedForReacquireCitizenship',
              type: 'radio',
              label: '4.a. Since being granted refugee/asylee status, have you applied for and/or obtained a national passport, travel document, or any benefit from such country?',
              required: false,
              options: [
                { value: 'yes', label: 'Yes' },
                { value: 'no', label: 'No' },
              ],
              pdfField: 'P6_Line4a_AppliedReacquire',
              subFields: [
                { value: 'yes', pdfField: 'form1[0].#subform[9].P6_Line4a_YesNo[0]' },
                { value: 'no', pdfField: 'form1[0].#subform[9].P6_Line4a_YesNo[1]' },
              ],
              conditionalDisplay: {
                field: 'part1.applicationType.documentType',
                value: 'refugeeTravelDoc',
              },
            },
            {
              id: 'reEstablishedInCountry',
              type: 'radio',
              label: '4.b. Since being granted refugee/asylee status, have you voluntarily re-established yourself in the country named above?',
              required: false,
              options: [
                { value: 'yes', label: 'Yes' },
                { value: 'no', label: 'No' },
              ],
              pdfField: 'P6_Line4b_ReEstablished',
              subFields: [
                { value: 'yes', pdfField: 'form1[0].#subform[9].P6_Line4b_YesNo[0]' },
                { value: 'no', pdfField: 'form1[0].#subform[9].P6_Line4b_YesNo[1]' },
              ],
              conditionalDisplay: {
                field: 'part1.applicationType.documentType',
                value: 'refugeeTravelDoc',
              },
            },
            {
              id: 'filedI256',
              type: 'radio',
              label: '5. Have you filed Form I-256, Application for Cancellation or Suspension of Deportation?',
              required: false,
              options: [
                { value: 'yes', label: 'Yes' },
                { value: 'no', label: 'No' },
              ],
              pdfField: 'P6_Line5_FiledI256',
              subFields: [
                { value: 'yes', pdfField: 'form1[0].#subform[9].P6_Line5_YesNo[0]' },
                { value: 'no', pdfField: 'form1[0].#subform[9].P6_Line5_YesNo[1]' },
              ],
              conditionalDisplay: {
                field: 'part1.applicationType.documentType',
                value: 'refugeeTravelDoc',
              },
            },
          ],
        },
      ],
    },

    // =============================================
    // PART 6: Complete for Advance Parole
    // =============================================
    {
      id: 'part6',
      title: 'Part 6. Information for Advance Parole Applicants',
      sections: [
        {
          id: 'advanceParoleInfo',
          title: 'Advance Parole Travel Details',
          description: 'Complete this part only if you are applying for Advance Parole.',
          fields: [
            {
              id: 'dateOfDeparture',
              type: 'date',
              label: '1. Date of intended departure',
              required: false,
              pdfField: 'form1[0].#subform[9].P7_Line1_DateOfDeparture[0]',
              conditionalDisplay: {
                field: 'part1.applicationType.documentType',
                value: 'advanceParole',
              },
            },
            {
              id: 'purposeOfTrip',
              type: 'text',
              label: '2. Purpose of trip',
              required: false,
              pdfField: 'form1[0].#subform[9].P7_Line2_Purpose[0]',
              conditionalDisplay: {
                field: 'part1.applicationType.documentType',
                value: 'advanceParole',
              },
            },
            {
              id: 'countriesToVisit',
              type: 'text',
              label: '3. List the countries you intend to visit',
              required: false,
              pdfField: 'form1[0].#subform[9].P7_Line3_ListCountries[0]',
              conditionalDisplay: {
                field: 'part1.applicationType.documentType',
                value: 'advanceParole',
              },
            },
            {
              id: 'usedAdvanceParoleBefore',
              type: 'radio',
              label: '4. Have you ever previously used an Advance Parole Document to return to the United States?',
              required: false,
              options: [
                { value: 'yes', label: 'Yes' },
                { value: 'no', label: 'No' },
              ],
              pdfField: 'P7_Line4_UsedBefore',
              subFields: [
                { value: 'yes', pdfField: 'form1[0].#subform[9].P7_Line4_CB[0]' },
                { value: 'no', pdfField: 'form1[0].#subform[9].P7_Line4_CB[1]' },
              ],
              conditionalDisplay: {
                field: 'part1.applicationType.documentType',
                value: 'advanceParole',
              },
            },
            {
              id: 'wereYouAdmitted',
              type: 'radio',
              label: '4.c. Were you admitted to the United States when you used the Advance Parole Document?',
              required: false,
              options: [
                { value: 'yes', label: 'Yes' },
                { value: 'no', label: 'No' },
              ],
              pdfField: 'P7_Line4c_Admitted',
              subFields: [
                { value: 'yes', pdfField: 'form1[0].#subform[9].Line4c_Yes[0]' },
                { value: 'no', pdfField: 'form1[0].#subform[9].Line4c_No[0]' },
              ],
              conditionalDisplay: {
                field: 'part1.applicationType.documentType',
                value: 'advanceParole',
              },
            },
            {
              id: 'expectedLengthOfTrip',
              type: 'text',
              label: '5. Expected length of trip',
              required: false,
              pdfField: 'form1[0].#subform[9].P7_Line5_ExpectedLengthTrip[0]',
              conditionalDisplay: {
                field: 'part1.applicationType.documentType',
                value: 'advanceParole',
              },
            },
          ],
        },
      ],
    },

    // =============================================
    // PART 7: Complete for Parole/Re-Parole
    // =============================================
    {
      id: 'part7',
      title: 'Part 7. Information for Parole/Re-Parole',
      sections: [
        {
          id: 'paroleInfo',
          title: 'Parole/Re-Parole Details',
          description: 'Complete this part only if you are applying for initial parole or re-parole into the United States.',
          fields: [
            {
              id: 'explanation',
              type: 'textarea',
              label: '1. Explain how you qualify for parole and your reasons for requesting parole',
              required: false,
              pdfField: 'form1[0].#subform[10].P8_Line1_Explain[0]',
              conditionalDisplay: {
                field: 'part1.applicationType.documentType',
                value: 'paroleDocument',
              },
            },
            {
              id: 'expectedLengthInUS',
              type: 'text',
              label: '2. Expected length of time you will remain in the United States',
              required: false,
              maxLength: 30,
              pdfField: 'form1[0].#subform[10].P8_Line2_ExpectedLengthTripinUS[0]',
              conditionalDisplay: {
                field: 'part1.applicationType.documentType',
                value: 'paroleDocument',
              },
            },
            {
              id: 'dateOfIntendedArrival',
              type: 'date',
              label: '3.a. Date of intended arrival',
              required: false,
              pdfField: 'form1[0].#subform[10].P8_Line3a_DateOfIntendedArrival[0]',
              conditionalDisplay: {
                field: 'part1.applicationType.documentType',
                value: 'paroleDocument',
              },
            },
            {
              id: 'arrivalCity',
              type: 'text',
              label: '3.b. City or Town of intended arrival',
              required: false,
              maxLength: 20,
              pdfField: 'form1[0].#subform[10].P8_Line3b_CityOrTown[0]',
              conditionalDisplay: {
                field: 'part1.applicationType.documentType',
                value: 'paroleDocument',
              },
            },
            {
              id: 'arrivalCountry',
              type: 'text',
              label: '3.b. Country of departure',
              required: false,
              pdfField: 'form1[0].#subform[10].P8_Line3b_Country[0]',
              conditionalDisplay: {
                field: 'part1.applicationType.documentType',
                value: 'paroleDocument',
              },
            },
          ],
        },
      ],
    },

    // =============================================
    // PART 8: Employment Authorization (EAD)
    // =============================================
    {
      id: 'part8',
      title: 'Part 8. Employment Authorization',
      sections: [
        {
          id: 'ead',
          title: 'Request for Employment Authorization Document (EAD)',
          fields: [
            {
              id: 'requestEAD',
              type: 'checkbox',
              label: 'I am requesting an Employment Authorization Document (EAD) based on my pending asylum application.',
              required: false,
              pdfField: 'form1[0].#subform[10].P9_Line1_EAD[0]',
            },
          ],
        },
      ],
    },

    // =============================================
    // PART 9: Applicant's Contact & Signature
    // =============================================
    {
      id: 'part9',
      title: 'Part 9. Applicant\'s Contact Information & Signature',
      sections: [
        {
          id: 'contactSignature',
          title: 'Contact Information and Signature',
          description: 'Provide your contact information and sign the application.',
          fields: [
            {
              id: 'daytimePhone',
              type: 'phone',
              label: 'Applicant\'s Daytime Telephone Number',
              required: true,
              maxLength: 10,
              pdfField: 'form1[0].#subform[10].Part10_Line1_DayPhone[0]',
            },
            {
              id: 'mobilePhone',
              type: 'phone',
              label: 'Applicant\'s Mobile Telephone Number',
              required: false,
              maxLength: 10,
              pdfField: 'form1[0].#subform[10].Part10_Line2_MobilePhone[0]',
            },
            {
              id: 'email',
              type: 'email',
              label: 'Applicant\'s Email Address',
              required: false,
              pdfField: 'form1[0].#subform[10].Part10_Line3_Email[0]',
            },
            {
              id: 'signatureDate',
              type: 'date',
              label: 'Date of Signature',
              required: true,
              pdfField: 'form1[0].#subform[10].Part10_Line4_DateofSignature[0]',
            },
          ],
        },
      ],
    },

    // =============================================
    // PART 10: Interpreter's Information
    // =============================================
    {
      id: 'part10',
      title: 'Part 10. Interpreter\'s Information',
      sections: [
        {
          id: 'interpreter',
          title: 'Interpreter\'s Contact Information',
          description: 'Complete this section only if an interpreter assisted the applicant.',
          fields: [
            {
              id: 'interpreterFamilyName',
              type: 'text',
              label: 'Interpreter\'s Family Name (Last Name)',
              required: false,
              maxLength: 33,
              pdfField: 'form1[0].#subform[11].Part11_Line1_InterpreterFamilyName[0]',
            },
            {
              id: 'interpreterGivenName',
              type: 'text',
              label: 'Interpreter\'s Given Name (First Name)',
              required: false,
              maxLength: 33,
              pdfField: 'form1[0].#subform[11].Part11_Line1_InterpreterGivenName[0]',
            },
            {
              id: 'interpreterBusinessName',
              type: 'text',
              label: 'Name of Business or Organization',
              required: false,
              maxLength: 34,
              pdfField: 'form1[0].#subform[11].Part11_Line2_NameofBusinessorOrgName[0]',
            },
            {
              id: 'interpreterLanguage',
              type: 'text',
              label: 'Language Interpreted',
              required: false,
              maxLength: 18,
              pdfField: 'form1[0].#subform[11].P11_Language[0]',
            },
            {
              id: 'interpreterDaytimePhone',
              type: 'phone',
              label: 'Interpreter\'s Daytime Telephone Number',
              required: false,
              maxLength: 10,
              pdfField: 'form1[0].#subform[11].Part11_Line3_DayPhone[0]',
            },
            {
              id: 'interpreterMobilePhone',
              type: 'phone',
              label: 'Interpreter\'s Mobile Telephone Number',
              required: false,
              maxLength: 10,
              pdfField: 'form1[0].#subform[11].Part11_Line4_MobilePhone[0]',
            },
            {
              id: 'interpreterEmail',
              type: 'email',
              label: 'Interpreter\'s Email Address',
              required: false,
              pdfField: 'form1[0].#subform[11].Part11_Line5_Email[0]',
            },
            {
              id: 'interpreterSignatureDate',
              type: 'date',
              label: 'Date of Signature',
              required: false,
              pdfField: 'form1[0].#subform[11].Part11_Line6_DateofSignature[0]',
            },
          ],
        },
      ],
    },

    // =============================================
    // PART 11: Preparer's Information
    // =============================================
    {
      id: 'part11',
      title: 'Part 11. Preparer\'s Information',
      sections: [
        {
          id: 'preparer',
          title: 'Preparer\'s Contact Information',
          description: 'Complete this section only if someone other than the applicant prepared this application.',
          fields: [
            {
              id: 'preparerFamilyName',
              type: 'text',
              label: 'Preparer\'s Family Name (Last Name)',
              required: false,
              maxLength: 33,
              pdfField: 'form1[0].#subform[12].Part12_Line1_FamilyName[0]',
            },
            {
              id: 'preparerGivenName',
              type: 'text',
              label: 'Preparer\'s Given Name (First Name)',
              required: false,
              maxLength: 33,
              pdfField: 'form1[0].#subform[12].Part12_Line1_GivenName[0]',
            },
            {
              id: 'preparerBusinessName',
              type: 'text',
              label: 'Name of Business or Organization',
              required: false,
              maxLength: 34,
              pdfField: 'form1[0].#subform[12].Part12_Line2_NameofBusinessorOrgName[0]',
            },
            {
              id: 'preparerDaytimePhone',
              type: 'phone',
              label: 'Preparer\'s Daytime Telephone Number',
              required: false,
              maxLength: 10,
              pdfField: 'form1[0].#subform[12].Part12_Line3_DayPhone[0]',
            },
            {
              id: 'preparerMobilePhone',
              type: 'phone',
              label: 'Preparer\'s Mobile Telephone Number',
              required: false,
              maxLength: 10,
              pdfField: 'form1[0].#subform[12].Part12_Line4_MobilePhone[0]',
            },
            {
              id: 'preparerEmail',
              type: 'email',
              label: 'Preparer\'s Email Address',
              required: false,
              pdfField: 'form1[0].#subform[12].Part12_Line5_Email[0]',
            },
            {
              id: 'preparerSignatureDate',
              type: 'date',
              label: 'Date of Signature',
              required: false,
              pdfField: 'form1[0].#subform[12].Part12_Line6_DateofSignature[0]',
            },
          ],
        },
      ],
    },

    // =============================================
    // PART 12: Additional Information
    // =============================================
    {
      id: 'part12',
      title: 'Part 12. Additional Information',
      sections: [
        {
          id: 'additionalInfo',
          title: 'Additional Information',
          description: 'If you need extra space to provide any additional information, use this section.',
          fields: [
            {
              id: 'pageNumber1',
              type: 'text',
              label: 'Page Number (Row 1)',
              required: false,
              pdfField: 'form1[0].#subform[13].Part13_Line1_PageNumber1[0]',
            },
            {
              id: 'partNumber1',
              type: 'text',
              label: 'Part Number (Row 1)',
              required: false,
              pdfField: 'form1[0].#subform[13].Part13_Line1_PartNumber1[0]',
            },
            {
              id: 'itemNumber1',
              type: 'text',
              label: 'Item Number (Row 1)',
              required: false,
              pdfField: 'form1[0].#subform[13].Part13_Line1_ItemNumber1[0]',
            },
            {
              id: 'additionalInfo1',
              type: 'textarea',
              label: 'Additional Information (Row 1)',
              required: false,
              pdfField: 'form1[0].#subform[13].Part13_Line1_AdditionalInfo1[0]',
            },
            {
              id: 'pageNumber2',
              type: 'text',
              label: 'Page Number (Row 2)',
              required: false,
              pdfField: 'form1[0].#subform[13].Part13_Line1_PageNumber2[0]',
            },
            {
              id: 'partNumber2',
              type: 'text',
              label: 'Part Number (Row 2)',
              required: false,
              pdfField: 'form1[0].#subform[13].Part13_Line1_PartNumber2[0]',
            },
            {
              id: 'itemNumber2',
              type: 'text',
              label: 'Item Number (Row 2)',
              required: false,
              pdfField: 'form1[0].#subform[13].Part13_Line1_ItemNumber2[0]',
            },
            {
              id: 'additionalInfo2',
              type: 'textarea',
              label: 'Additional Information (Row 2)',
              required: false,
              pdfField: 'form1[0].#subform[13].Part13_Line1_AdditionalInfo2[0]',
            },
            {
              id: 'pageNumber3',
              type: 'text',
              label: 'Page Number (Row 3)',
              required: false,
              pdfField: 'form1[0].#subform[13].Part13_Line1_PageNumber3[0]',
            },
            {
              id: 'partNumber3',
              type: 'text',
              label: 'Part Number (Row 3)',
              required: false,
              pdfField: 'form1[0].#subform[13].Part13_Line1_PartNumber3[0]',
            },
            {
              id: 'itemNumber3',
              type: 'text',
              label: 'Item Number (Row 3)',
              required: false,
              pdfField: 'form1[0].#subform[13].Part13_Line1_ItemNumber3[0]',
            },
            {
              id: 'additionalInfo3',
              type: 'textarea',
              label: 'Additional Information (Row 3)',
              required: false,
              pdfField: 'form1[0].#subform[13].Part13_Line1_AdditionalInfo3[0]',
            },
            {
              id: 'pageNumber4',
              type: 'text',
              label: 'Page Number (Row 4)',
              required: false,
              pdfField: 'form1[0].#subform[13].Part13_Line1_PageNumber4[0]',
            },
            {
              id: 'partNumber4',
              type: 'text',
              label: 'Part Number (Row 4)',
              required: false,
              pdfField: 'form1[0].#subform[13].Part13_Line1_PartNumber4[0]',
            },
            {
              id: 'itemNumber4',
              type: 'text',
              label: 'Item Number (Row 4)',
              required: false,
              pdfField: 'form1[0].#subform[13].Part13_Line1_ItemNumber4[0]',
            },
            {
              id: 'additionalInfo4',
              type: 'textarea',
              label: 'Additional Information (Row 4)',
              required: false,
              pdfField: 'form1[0].#subform[13].Part13_Line1_AdditionalInfo4[0]',
            },
            {
              id: 'pageNumber5',
              type: 'text',
              label: 'Page Number (Row 5)',
              required: false,
              pdfField: 'form1[0].#subform[13].Part13_Line1_PageNumber5[0]',
            },
            {
              id: 'partNumber5',
              type: 'text',
              label: 'Part Number (Row 5)',
              required: false,
              pdfField: 'form1[0].#subform[13].Part13_Line1_PartNumber5[0]',
            },
            {
              id: 'itemNumber5',
              type: 'text',
              label: 'Item Number (Row 5)',
              required: false,
              pdfField: 'form1[0].#subform[13].Part13_Line1_ItemNumber5[0]',
            },
            {
              id: 'additionalInfo5',
              type: 'textarea',
              label: 'Additional Information (Row 5)',
              required: false,
              pdfField: 'form1[0].#subform[13].Part13_Line1_AdditionalInfo5[0]',
            },
          ],
        },
      ],
    },
  ],
};
