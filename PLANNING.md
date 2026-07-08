# 스딩(SDING) B2B 웨딩업체 데이터 수집 도구 기획서

> 스딩 앱에 입점할 B2B 웨딩업체 정보를, 앱에 실제로 반영하기 전까지 임시로 모아서 보관해두는
> **최소 기능 데이터 수집 도구**입니다. Claude Code로 개발을 진행하기 위한 스펙 문서입니다.

## 목차
1. 프로젝트 개요
2. 정보구조(IA) 및 사이트맵
3. 업종 카테고리 정의
4. 데이터 설계
5. 공통 필드 명세
6. 업종별 전용 필드 명세
7. category_data JSON 예시
8. 스타일/무드 태그
9. 사진 업로드 기능 설계
10. 화면설계
11. 기술 스택 제안
12. 구현 항목 체크리스트
13. Claude Code 활용 가이드
14. 확정된 의사결정 사항

---

## 1. 프로젝트 개요

### 1.1 목적
스딩 팀 내부에서만 쓰는 입력 도구입니다. 정식 운영 화면이 아니라 데이터를 모아두는 용도이므로,
꼭 필요한 기능만 남기고 나머지는 전부 뺐습니다.

### 1.2 가정 사항
- 스딩 팀(운영/MD)만 사용하며, 업체가 직접 접근하지 않습니다.
- 로그인은 계정 구분 없이 **비밀번호 1개(기본값 1111)만으로 통과**합니다.
- 여기 쌓인 데이터는 이후 스딩 앱으로 수동 이관됩니다. 실시간 연동은 고려하지 않습니다.

### 1.3 핵심 기능 (최소 구성)
1. 비밀번호 로그인
2. 업체 리스트 (업종별 필터 — 처음 요청하신 "업종별로 나눠서 보기 편하게"는 그대로 유지)
3. 업체 등록
4. 업체 수정
5. 대표사진 + 업종별 갤러리(드레스 등) 사진 업로드

**제외한 기능**: 대시보드, 업체 미리보기, 마스터 데이터(카테고리/스타일태그) 관리 화면, 설정/계정 관리

---

## 2. 정보구조(IA) 및 사이트맵

```
스딩 B2B 데이터 수집 도구
├─ 로그인 (비밀번호 1개)
└─ 업체 관리
   ├─ 업체 리스트 (업종별 필터)
   ├─ 업체 등록
   └─ 업체 수정
```

---

## 3. 업종 카테고리 정의 (14개)

| # | 업종명 | 코드(code) | 비고 |
|---|---|---|---|
| 1 | 웨딩홀 | `wedding_hall` | |
| 2 | 스튜디오 | `studio` | |
| 3 | 드레스 | `dress` | 사진 갤러리 강화 대상 |
| 4 | 헤어&메이크업 | `hair_makeup` | |
| 5 | 헤어변형 | `hair` | |
| 6 | 본식스냅 | `main_snap` | 스냅과 필드구조 동일 |
| 7 | 스냅 | `snap` | 본식스냅과 필드구조 동일 |
| 8 | 영상(DVD) | `video` | |
| 9 | 예물 | `jewelry` | |
| 10 | 예복 | `suit` | |
| 11 | 한복 | `hanbok` | |
| 12 | 부케 | `bouquet` | |
| 13 | 청첩장 | `invitation` | |
| 14 | 사회 | `mc` | |

마스터 데이터 관리 화면이 없으므로, 이 목록은 DB 테이블이 아니라 **코드에 고정 상수**로 넣습니다(4.3절 참고).
카테고리를 바꾸려면 코드 수정 후 재배포가 필요하지만, 자주 바뀌는 값이 아니라 이 편이 더 간단하고 저렴합니다.

---

## 4. 데이터 설계

### 4.1 설계 방향
화면이 [리스트-등록-수정] 세 개뿐이고 마스터 데이터 관리도 없어지면서, 이전에 검토했던
6개 테이블 구조(categories / vendors / vendor_photos / vendor_options / style_moods / vendor_style_moods)를
**`vendors` 테이블 하나**로 합쳤습니다.

- 카테고리, 스타일/무드 태그 → 코드 상수 (관리 화면이 없으니 DB 테이블일 필요가 없음)
- 사진, 추가옵션 → `vendors` 안의 JSON 컬럼 (별도 테이블로 분리할 만큼 복잡한 조회가 필요 없음)

테이블이 줄어든 만큼 마이그레이션·시드 데이터·조인 쿼리가 없어져서, 말씀하신 "적은 비용" 방향에 맞습니다.

### 4.2 vendors 테이블 필드

| 필드 | 타입 | 설명 |
|---|---|---|
| id | int (PK) | |
| category | string | 3절의 14개 고정값 중 하나 |
| name | string | 업체명 |
| contact | string | 업체연락처 |
| business_hours_start / business_hours_end | string | 운영시간 (예: "10:00" ~ "19:00") |
| region / address | string | 지역/주소 |
| products | json | 상품구성 `[{name, description}]`, `+`/`-`로 여러 개 입력 |
| description | text | 업체설명 |
| style_moods | string[] | 자유 입력 해시태그 (8절 참고, 고정 목록 아님) |
| options | json | `[{name, price, desc}]` |
| sding_benefit | text | 스딩 전용 혜택 |
| category_data | json | 업종별 전용 필드 (6절) |
| photos | json | `[{url, type, label, sortOrder}]` (9절) |
| created_at / updated_at | datetime | |

### 4.3 Prisma 스키마

```prisma
model Vendor {
  id                 Int      @id @default(autoincrement())
  category           String   // wedding_hall, studio, dress ... (3절 14종 고정값)
  name               String
  contact            String?  // 업체연락처
  businessHoursStart String?  // "10:00"
  businessHoursEnd   String?  // "19:00"
  region             String?
  address            String?
  products           Json?    // [{ name, description }] — 상품구성, +/- 로 여러 개 등록
  description        String?  @db.Text
  styleMoods         String[] // 자유 입력 해시태그 (8절 참고, 고정 목록 아님)
  options            Json?    // [{ name, price, desc }]
  sdingBenefit       String?
  categoryData       Json?    // 업종별 전용 필드 (6절 스키마 참고)
  photos             Json?    // [{ url, type: "main"|"gallery"|"dress", label, sortOrder }]
  createdAt          DateTime @default(now())
  updatedAt          DateTime @updatedAt
}
```

```typescript
// lib/constants.ts — 카테고리는 코드 상수로 관리 (마스터 데이터 관리 화면 없음)
export const CATEGORIES = [
  { code: 'wedding_hall', label: '웨딩홀' },
  { code: 'studio', label: '스튜디오' },
  { code: 'dress', label: '드레스' },
  { code: 'hair_makeup', label: '헤어&메이크업' },
  { code: 'hair', label: '헤어변형' },
  { code: 'main_snap', label: '본식스냅' },
  { code: 'snap', label: '스냅' },
  { code: 'video', label: '영상(DVD)' },
  { code: 'jewelry', label: '예물' },
  { code: 'suit', label: '예복' },
  { code: 'hanbok', label: '한복' },
  { code: 'bouquet', label: '부케' },
  { code: 'invitation', label: '청첩장' },
  { code: 'mc', label: '사회' },
] as const;

// 스타일/무드는 고정 목록이 아니라 자유 입력 해시태그입니다(8절 참고). 상수로 관리하지 않습니다.
```

---

## 5. 공통 필드 명세

| 필드명 | key | 타입 | 입력형태 | 필수 | 비고 |
|---|---|---|---|---|---|
| 업체명 | name | string | 텍스트 | Y | |
| 카테고리 | category | string | 단일 선택 | Y | 3절 14개 고정값 중 택1 |
| 업체연락처 | contact | string | 텍스트(전화번호) | Y | |
| 운영시간 | business_hours_start / business_hours_end | string | 시 선택 + 분 선택 ~ 시 선택 + 분 선택 | Y | 예: 10시 00분 ~ 19시 00분 |
| 지역 | region | string | 선택(시/도-구/군) | Y | 리스트 필터/검색용 |
| 주소 | address | string | 텍스트(주소검색 API 권장) | Y | 카카오/다음 주소 API 연동 권장 |
| 상품구성 | products | json 배열 | 상품명+설명, `+`/`-`로 여러 개 추가·삭제 | Y | 상품이 하나가 아닐 수 있음 |
| 스타일/무드 | style_moods | string[] | 자유 입력 해시태그(#) | N | 8절 참고, 고정 목록 아님 |
| 추가옵션 | options | json 배열 | 옵션명+가격 다중입력 | N | |
| 업체설명 | description | long text | 리치텍스트 권장 | Y | 상세 설명 |
| 스딩 전용 혜택 | sding_benefit | text | 텍스트에어리어 | N | |
| 대표사진 | - | image | 단일 업로드 | Y | photos 배열, type=main |

---

## 6. 업종별 전용 필드 명세

### 6.1 웨딩홀 (wedding_hall)

| 필드명 | key | 타입 | 입력형태 | 비고 |
|---|---|---|---|---|
| 홀 타입 / 예식 형태 | hall_types | array | 다중선택 | 예: 채플, 컨벤션홀, 하우스웨딩, 야외 |
| 예식 간격 | ceremony_interval | string | 텍스트 | 예: "90분 간격" |
| 수용 인원 | capacity_min / capacity_max | number | 숫자 2개 | 최소~최대 |
| 메뉴/식대 | menus | 반복 리스트 | 메뉴명+1인가격 다중입력 | |
| 대관료 | rental_fee | number | 숫자(원) | |
| 연출료 | production_fee | number | 숫자(원) | |
| 꽃장식 | flower_decoration | text | 텍스트에어리어 | 기본 포함여부, 업그레이드 옵션 |
| 음주류 | alcohol_policy | text | 텍스트에어리어 | 반입 가능여부, 콜키지 등 |
| 홀 타입별 상세설명 | hall_details | 반복 리스트 | 홀이름+설명 다중입력 | 홀별 사진은 9절 갤러리에서 라벨로 연결 |
| 주차 가능시간 | parking_hours_start / parking_hours_end | string | 시 선택 + 분 선택 ~ 시 선택 + 분 선택 | 운영시간과 동일한 입력방식 |
| 주차 가능대수 | parking_capacity | number | 숫자 | 예: 200 |

### 6.2 스튜디오 (studio)

| 필드명 | key | 타입 | 입력형태 | 비고 |
|---|---|---|---|---|
| 촬영소요시간 | shoot_duration | text | 텍스트 | |
| 촬영스케줄 | shoot_schedule | text | 텍스트에어리어 | 회전 간격, 시간대 |
| 보유소품 | props | text | 텍스트에어리어 or 태그 | |
| 촬영 의상 벌수 | outfit_count | number | 숫자 | |
| 참고사항(헤어변형업체 출입가능여부) | notes | boolean + text | 토글+텍스트 | 외부 헤어변형업체 출입 가능 여부 |

### 6.3 드레스 (dress)

| 필드명 | key | 타입 | 입력형태 | 비고 |
|---|---|---|---|---|
| 방문상담소요시간 | consultation_duration | text | 텍스트 | |
| 기본소요시간 | basic_duration | text | 텍스트 | 피팅 기본 소요시간 |
| 헬퍼비 | helper_fee | number | 숫자(원) | |
| 피팅비 | fitting_fee | number | 숫자(원) | |
| **드레스 사진 갤러리** | - | 별도 기능 | 다중 이미지+라벨 | 9절 참고. 드레스마다 이름/라인 라벨 입력 |

### 6.4 헤어&메이크업 (hair_makeup)

| 필드명 | key | 타입 | 입력형태 | 비고 |
|---|---|---|---|---|
| 메인시술자직급(메이크업) | main_artist_grade_makeup | text | 텍스트/선택 | 예: 원장, 부원장, 실장 |
| 메인시술자직급(헤어) | main_artist_grade_hair | text | 텍스트/선택 | |
| 시술자케어 | aftercare | text | 텍스트에어리어 | |

### 6.5 헤어변형 (hair)

| 필드명 | key | 타입 | 입력형태 | 비고 |
|---|---|---|---|---|
| 디자이너직급 | designer_grade | text | 텍스트/선택 | |
| 지역별 출장비 | travel_fee_by_region | 반복 리스트 | 지역명+금액 다중입력 | |
| 시간대별 추가비용 | time_extra_fees | 반복 리스트 | 시간대(시 선택+분 선택 ~ 시 선택+분 선택) + 금액, `+`/`-`로 여러 개 추가 | 주간/야간 등 고정 라벨 없이 자유롭게 구간 추가 |
| 야외촬영 추가비용 | outdoor_extra_fee | number | 숫자(원) | |

### 6.6 본식스냅 · 스냅 (main_snap / snap — 필드구조 동일)

| 필드명 | key | 타입 | 입력형태 | 비고 |
|---|---|---|---|---|
| 상품구성 | product_composition | text | 텍스트에어리어 | |
| 촬영범위 | shoot_scope | text | 텍스트에어리어 | |
| 셀렉방법 | selection_method | text | 텍스트에어리어 | |
| 해피콜방법 | happy_call_method | text | 텍스트에어리어 | |

### 6.7 영상(DVD) (video)

| 필드명 | key | 타입 | 입력형태 | 비고 |
|---|---|---|---|---|
| 출장비용 | travel_fee | number | 숫자(원) | |
| 예약양식 | reservation_form | text | 텍스트에어리어 | 예약 절차/양식 안내 |

### 6.8 예물 (jewelry)

| 필드명 | key | 타입 | 입력형태 | 비고 |
|---|---|---|---|---|
| 평균예산대 | avg_budget_min / avg_budget_max | number | 숫자 2개 | 최소~최대 |

### 6.9 예복 (suit)

| 필드명 | key | 타입 | 입력형태 | 비고 |
|---|---|---|---|---|
| 맞춤시 구성 | custom_composition | text | 텍스트에어리어 | |
| 원단별 금액 | price_by_fabric | 반복 리스트 | 원단명+금액 다중입력 | |
| 맞춤 패키지 금액 | custom_package_price | number | 숫자(원) | |
| 렌탈시 구성 | rental_composition | text | 텍스트에어리어 | |
| 렌탈 최저금액 | rental_min_price | number | 숫자(원) | |
| 렌탈 패키지 금액 | rental_package_price | number | 숫자(원) | |
| 옵션 | options | 반복 리스트 | 옵션명+금액 다중입력 | 기본구성+추가옵션 |
| 특이사항 | special_notes | text | 텍스트에어리어 | |

### 6.10 한복 (hanbok)

| 필드명 | key | 타입 | 입력형태 | 비고 |
|---|---|---|---|---|
| 구성 및 금액 | packages | 반복 리스트 | 유형(맞춤/대여/맞춤대여/가족패키지)+최저금액+상세구성 | |
| 피팅비 | fitting_fee | number | 숫자(원) | |
| 고객안내사항(사진촬영 가능여부) | photo_allowed | boolean + text | 토글+텍스트 | |

### 6.11 부케 (bouquet)

| 필드명 | key | 타입 | 입력형태 | 비고 |
|---|---|---|---|---|
| 본식부케 랜덤디자인 금액~ | main_random_price | number | 숫자(원, 최소값) | |
| 본식부케 디자인요청 금액~ | main_request_price | number | 숫자(원, 최소값) | |
| 본식부케 셋트구성 | main_set_composition | text | 텍스트에어리어 | |
| 리허설부케 랜덤디자인 금액~ | rehearsal_random_price | number | 숫자(원, 최소값) | |
| 리허설부케 디자인요청 금액~ | rehearsal_request_price | number | 숫자(원, 최소값) | |
| 리허설부케 셋트구성 | rehearsal_set_composition | text | 텍스트에어리어 | |
| 플라워디렉팅 구성 및 금액 | flower_directing | text | 텍스트에어리어 | |
| 주문방법 | order_method | text | 텍스트에어리어 | |

### 6.12 청첩장 (invitation)

| 필드명 | key | 타입 | 입력형태 | 비고 |
|---|---|---|---|---|
| 주문 공지사항(쿠폰&필수, 제휴혜택 안내) | order_notice | text | 리치텍스트 권장 | 제휴혜택 적용방법 안내 포함 |

### 6.13 사회 (mc)

| 필드명 | key | 타입 | 입력형태 | 비고 |
|---|---|---|---|---|
| 구성 및 금액(서울예식기준) | price_composition | text | 텍스트에어리어 | |
| 1부예식 금액 | part1_price | number | 숫자(원) | |
| 1부+2부 사회자 금액 | part1and2_price | number | 숫자(원) | |
| 출장비 | travel_fee | number | 숫자(원) | |
| 지정비 | designation_fee | number | 숫자(원) | |
| 진행방식 | process_method | text | 텍스트에어리어 | |

---

## 7. category_data JSON 예시

**웨딩홀**
```json
{
  "hall_types": ["채플", "컨벤션홀"],
  "ceremony_interval": "90분 간격",
  "capacity_min": 100,
  "capacity_max": 300,
  "menus": [
    { "name": "스탠다드 뷔페", "price_per_person": 55000 },
    { "name": "프리미엄 코스", "price_per_person": 88000 }
  ],
  "rental_fee": 3000000,
  "production_fee": 500000,
  "flower_decoration": "기본 플라워 포함, 업그레이드 시 추가 비용",
  "alcohol_policy": "주류 반입 가능, 콜키지 프리",
  "hall_details": [
    { "hall_name": "그랜드홀", "description": "최대 300명, 자연광 채광" },
    { "hall_name": "스카이홀", "description": "루프탑, 최대 100명" }
  ],
  "parking_hours_start": "09:00",
  "parking_hours_end": "24:00",
  "parking_capacity": 200
}
```

**드레스**
```json
{
  "consultation_duration": "60분",
  "basic_duration": "90분",
  "helper_fee": 50000,
  "fitting_fee": 30000
}
```

**헤어변형**
```json
{
  "designer_grade": "원장",
  "travel_fee_by_region": [
    { "region": "서울", "amount": 30000 },
    { "region": "경기", "amount": 50000 }
  ],
  "time_extra_fees": [
    { "time_start": "06:00", "time_end": "09:00", "amount": 30000 },
    { "time_start": "21:00", "time_end": "24:00", "amount": 50000 }
  ],
  "outdoor_extra_fee": 100000
}
```

업종별 스키마를 프론트엔드에서 zod 등으로 타입 검증하면, JSON 컬럼을 쓰더라도 입력 폼과 데이터
정합성을 안전하게 유지할 수 있습니다.

---

## 8. 스타일/무드 태그

고정 목록이 아니라 **자유 입력 해시태그**입니다. 등록/수정 화면에서 텍스트를 입력하고 엔터(또는
스페이스)를 치면 `#태그` 형태의 칩으로 추가되고, 칩을 클릭하면 삭제되는 태그 입력 컴포넌트를 씁니다.

- 저장은 `#` 기호 없이 텍스트만 배열로 저장하고(`style_moods: string[]`), 화면에는 `#`을 붙여서 표시합니다.
- 개수 제한은 두지 않되, 칩이 줄바꿈되도록 처리하면 UI가 깨지지 않습니다.
- 고정 목록이 아니므로 오탈자·표기 차이(예: "로맨틱" vs "로멘틱")로 태그가 갈릴 수 있습니다. 당장은
  문제가 안 되지만, 나중에 앱에서 태그로 검색/필터링할 계획이면 정리가 필요할 수 있다는 점만 참고해주세요.

---

## 9. 사진 업로드 기능 설계

핵심 요구사항은 동일합니다 — 전 업종 대표사진 1장 필수, 드레스 업체는 여러 벌의 드레스 사진 추가 업로드.
저장 방식만 `vendors.photos` **JSON 배열 컬럼**으로 단순화했습니다.

```json
[
  { "url": "https://...", "type": "main", "sortOrder": 0 },
  { "url": "https://...", "type": "dress", "label": "화이트 A라인", "sortOrder": 1 },
  { "url": "https://...", "type": "dress", "label": "머메이드 라인", "sortOrder": 2 }
]
```

| type | 용도 | 개수 |
|---|---|---|
| main | 업체 대표사진 | 1장(필수) |
| gallery | 일반 갤러리 사진 | 여러 장(선택) |
| dress | 드레스별 사진 | 여러 장, label로 드레스명 구분 |

실제 이미지 파일은 오브젝트 스토리지(Supabase Storage 등)에 올리고, 반환된 URL만 이 배열에 추가합니다.
어드민 업로드 UI(드래그앤드롭 다중 업로드, 순서 정렬, 드레스 라벨 입력)는 그대로 필요합니다.

---

## 10. 화면설계

**로그인**: 비밀번호 입력 필드 1개 + 확인 버튼. 아이디 없음. 통과하면 쿠키 발급, 이후 모든
페이지는 이 쿠키 유무만 확인합니다.

**업체 리스트**: 좌측 또는 상단에 업종 필터(14개+전체) — "업종별로 나눠서 보기 편하게" 요구사항은
그대로 유지했습니다. 목록엔 대표사진 썸네일, 업체명, 업종, 지역 정도만 표시. 각 행 클릭 시 수정
화면으로 이동, 상단에 "새 업체 등록" 버튼.

**업체 등록/수정**: [공통정보] [업종별 정보] [사진관리] 3개 탭. 업종별 정보는 선택한 카테고리에
따라 동적 렌더링. 저장 버튼 하나면 충분합니다.
- 운영시간·주차가능시간: 시(0~23)/분 선택 UI ~ 시/분 선택 UI로 통일된 형태 사용
- 상품구성: 상품명+설명 입력 줄이 반복되고, 줄마다 `+`(추가)/`-`(삭제) 버튼
- 스타일/무드: 해시태그 입력 컴포넌트(엔터로 추가, 클릭으로 삭제)

---

## 11. 기술 스택 제안

로그인이 단순 비밀번호 게이트라 NextAuth 같은 인증 라이브러리 자체가 필요 없습니다.

- Next.js 14+ (App Router) + TypeScript
- Tailwind CSS + shadcn/ui
- Supabase (PostgreSQL + Storage, 무료 티어로 충분) — Auth 기능은 사용하지 않음
- 로그인: `middleware.ts`에서 쿠키 확인 → 없으면 `/login`으로 리다이렉트. `/login`에서 입력한
  비밀번호를 `ADMIN_PASSWORD` 환경변수와 비교 후 쿠키 발급
- 배포: Vercel 무료 티어

테이블이 1개뿐이라 Prisma 없이 Supabase JS 클라이언트로 바로 쿼리해도 되지만, 스키마 변경 관리
편의상 Prisma는 유지 추천합니다(비용 차이 없음).

말씀하신 1111은 코드에 그대로 박아두기보다 `ADMIN_PASSWORD` 환경변수로 빼두길 권장합니다.
품이 거의 안 들면서, 나중에 값 바꾸기도 쉽고 깃허브에 비밀번호가 그대로 올라가는 것도 피할 수 있어요.

---

## 12. 구현 항목 체크리스트

단계를 나눠 중간 확인을 받지 않고 한 번에 진행합니다. 아래 순서는 Claude Code가 내부적으로
참고할 진행 순서입니다.

1. Next.js 프로젝트 세팅 + Supabase 연결
2. Prisma 스키마(4.3절) 적용
3. 비밀번호 로그인(middleware)
4. 업체 리스트(업종 필터)
5. 업체 등록/수정 — 공통 필드(5절) + 대표사진
6. 업종별 전용 필드 폼(6절, 14종)
7. 갤러리 다중 사진 업로드(드레스 라벨링 포함)

---

## 13. Claude Code 활용 가이드

이 문서를 프로젝트 루트에 `PLANNING.md`로 저장한 뒤, Claude Code에서 아래처럼 시작해보세요.

**시작 프롬프트 예시**
```
PLANNING.md 문서 전체를 참고해서 B2B 웨딩업체 데이터 수집용 어드민을 한 번에 구현해줘.
단계별로 나눠서 확인받지 않고, 아래 범위를 전부 이어서 진행해줘.

스택: Next.js(App Router) + TypeScript + Prisma + Supabase(DB+Storage).
인증은 NextAuth 같은 라이브러리 없이, 비밀번호 하나(ADMIN_PASSWORD 환경변수, 기본값 1111)를
middleware에서 쿠키로 확인하는 방식으로만 구현해줘.

구현 범위 (12절 체크리스트 순서 참고):
1. 프로젝트 세팅 (Next.js, Tailwind, shadcn/ui) + Supabase 연결
2. Prisma 스키마(4.3절, vendors 테이블 1개) 작성 및 마이그레이션
3. 비밀번호 로그인 미들웨어
4. 업체 리스트 (업종별 필터, 3절 14개 카테고리 상수 사용)
5. 업체 등록/수정 폼
   - 공통 필드(5절): 연락처, 시/분 선택 운영시간, +/- 상품구성 리스트, 해시태그 스타일/무드 등
   - 업종별 전용 필드(6절, 7절 JSON 예시 참고): 선택한 카테고리에 따라 동적 렌더링, 14개 업종 전부
6. 사진 업로드(9절): 대표사진 1장 + 갤러리 다중 업로드, 드레스는 장별 라벨 입력

스펙이 애매하거나 막히는 부분이 있으면 임의로 넘어가지 말고 물어봐줘.
```

**폴더 구조 제안**
```
/app
  /login
    page.tsx
  /vendors
    page.tsx        // 업체 리스트
    /new/page.tsx    // 신규 등록
    /[id]/page.tsx   // 수정
/lib
  constants.ts       // CATEGORIES
  category-schemas/  // 업종별 category_data 필드 정의(zod)
middleware.ts         // 비밀번호 쿠키 체크
/prisma
  schema.prisma
```

---

## 14. 확정된 의사결정 사항

- **헤어변형 시간대별 추가비용**: 주간/야간 같은 고정 라벨 대신, 시간대(시작~종료)+금액을 여러 개
  추가할 수 있는 리스트(`time_extra_fees`)로 처리합니다.
- **다지점 업체**: 업체당 주소는 1개입니다. 지점이 여러 곳이면 지점마다 별도 업체로 등록합니다.
- **ADMIN_PASSWORD**: 1111을 그대로 사용합니다.
