import {
  userRoleEnum,
  tenantRoleEnum,
  transactionTypeEnum,
  caseTypeEnum,
  caseStatusEnum,
  casePriorityEnum,
  formStatusEnum,
  validationStatusEnum,
  notificationTypeEnum,
} from './schema';

// Strict enum types inferred from Drizzle schema
export type UserRole = (typeof userRoleEnum.enumValues)[number];
export type TenantRole = (typeof tenantRoleEnum.enumValues)[number];
export type TransactionType = (typeof transactionTypeEnum.enumValues)[number];
export type CaseType = (typeof caseTypeEnum.enumValues)[number];
export type CaseStatus = (typeof caseStatusEnum.enumValues)[number];
export type CasePriority = (typeof casePriorityEnum.enumValues)[number];
export type FormStatus = (typeof formStatusEnum.enumValues)[number];
export type ValidationStatus = (typeof validationStatusEnum.enumValues)[number];
export type NotificationType = (typeof notificationTypeEnum.enumValues)[number];
