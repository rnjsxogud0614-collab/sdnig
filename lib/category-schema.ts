// 업종별 category_data zod 스키마 생성기 (기획서 7절 — JSON 컬럼 정합성 검증)
// lib/category-fields.ts 의 필드 정의를 기준으로 스키마를 만들어
// 클라이언트/서버 양쪽에서 동일한 검증을 수행합니다.

import { z } from 'zod';
import { CATEGORY_FIELDS, type CategoryField, type RepeatItemField } from './category-fields';
import type { CategoryCode } from './constants';

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

const optionalTrimmed = z
  .string()
  .transform((v) => v.trim())
  .optional();

const optionalNumber = z.number().finite().optional();

function repeatItemSchema(fields: RepeatItemField[]) {
  const shape: Record<string, z.ZodTypeAny> = {};
  for (const f of fields) {
    switch (f.type) {
      case 'number':
        shape[f.key] = optionalNumber;
        break;
      case 'time':
        shape[f.key] = z.string().regex(TIME_RE, '시간 형식(HH:MM)이 아닙니다').optional();
        break;
      case 'select':
        shape[f.key] = f.options ? z.enum(f.options as [string, ...string[]]).optional() : optionalTrimmed;
        break;
      default:
        shape[f.key] = optionalTrimmed;
    }
  }
  return z.object(shape);
}

function fieldSchemaEntries(field: CategoryField): [string, z.ZodTypeAny][] {
  switch (field.type) {
    case 'text':
    case 'textarea':
      return [[field.key, optionalTrimmed]];
    case 'number':
      return [[field.key, optionalNumber]];
    case 'number_range':
      return [
        [field.keyMin, optionalNumber],
        [field.keyMax, optionalNumber],
      ];
    case 'multiselect':
      return [[field.key, z.array(z.string().trim().min(1)).optional()]];
    case 'time_range':
      return [
        [field.keyStart, z.string().regex(TIME_RE).optional()],
        [field.keyEnd, z.string().regex(TIME_RE).optional()],
      ];
    case 'toggle_text':
      return [
        [field.keyBool, z.boolean().optional()],
        [field.keyText, optionalTrimmed],
      ];
    case 'repeat_list':
      return [[field.key, z.array(repeatItemSchema(field.itemFields)).optional()]];
  }
}

const schemaCache = new Map<CategoryCode, z.ZodTypeAny>();

/** 카테고리 코드에 해당하는 category_data 검증 스키마 (알 수 없는 키는 제거) */
export function categoryDataSchema(category: CategoryCode) {
  const cached = schemaCache.get(category);
  if (cached) return cached;
  const shape: Record<string, z.ZodTypeAny> = {};
  for (const field of CATEGORY_FIELDS[category]) {
    for (const [key, schema] of fieldSchemaEntries(field)) {
      shape[key] = schema;
    }
  }
  const schema = z.object(shape); // strip 모드(기본): 정의되지 않은 키는 제거
  schemaCache.set(category, schema);
  return schema;
}
