// ─────────────────────────────────────────────
// 전국 외고 / 국제고 / 자사고 학교 데이터
// ─────────────────────────────────────────────

export type SchoolCategory = "FOREIGN_LANGUAGE" | "INTERNATIONAL" | "AUTONOMOUS";

export type ActivityCategory = "LEADERSHIP" | "CLUB" | "STUDENT_COUNCIL" | "VOLUNTEER" | "OTHER";

export const ACTIVITY_CATEGORY_LABELS: Record<ActivityCategory, string> = {
  LEADERSHIP: "임원활동",
  CLUB: "동아리활동",
  STUDENT_COUNCIL: "학생회활동",
  VOLUNTEER: "봉사활동",
  OTHER: "기타",
};

export interface Activity {
  category: ActivityCategory;
  title: string;
  period: string;
  description: string;
}

export interface School {
  id: string;
  name: string;
  shortName: string;
  category: SchoolCategory;
  region: string;
  isNationwide: boolean;
}

export const SCHOOL_CATEGORY_LABELS: Record<SchoolCategory, string> = {
  FOREIGN_LANGUAGE: "외국어고등학교",
  INTERNATIONAL: "국제고등학교",
  AUTONOMOUS: "자율형사립고등학교",
};

export const SCHOOLS: School[] = [
  // ═══════════════════════════════════════════
  // 외국어고등학교 (28교)
  // ═══════════════════════════════════════════

  // 서울 (6교)
  { id: "FL_DAEWON", name: "대원외국어고등학교", shortName: "대원외고", category: "FOREIGN_LANGUAGE", region: "서울", isNationwide: false },
  { id: "FL_DAEIL", name: "대일외국어고등학교", shortName: "대일외고", category: "FOREIGN_LANGUAGE", region: "서울", isNationwide: false },
  { id: "FL_MYUNGDUK", name: "명덕외국어고등학교", shortName: "명덕외고", category: "FOREIGN_LANGUAGE", region: "서울", isNationwide: false },
  { id: "FL_SEOUL", name: "서울외국어고등학교", shortName: "서울외고", category: "FOREIGN_LANGUAGE", region: "서울", isNationwide: false },
  { id: "FL_EWHA", name: "이화여자외국어고등학교", shortName: "이화외고", category: "FOREIGN_LANGUAGE", region: "서울", isNationwide: false },
  { id: "FL_HANYOUNG", name: "한영외국어고등학교", shortName: "한영외고", category: "FOREIGN_LANGUAGE", region: "서울", isNationwide: false },

  // 경기 (8교)
  { id: "FL_GYEONGGI", name: "경기외국어고등학교", shortName: "경기외고", category: "FOREIGN_LANGUAGE", region: "경기", isNationwide: false },
  { id: "FL_GOYANG", name: "고양외국어고등학교", shortName: "고양외고", category: "FOREIGN_LANGUAGE", region: "경기", isNationwide: false },
  { id: "FL_GWACHEON", name: "과천외국어고등학교", shortName: "과천외고", category: "FOREIGN_LANGUAGE", region: "경기", isNationwide: false },
  { id: "FL_GIMPO", name: "김포외국어고등학교", shortName: "김포외고", category: "FOREIGN_LANGUAGE", region: "경기", isNationwide: false },
  { id: "FL_DONGDUCHEON", name: "동두천외국어고등학교", shortName: "동두천외고", category: "FOREIGN_LANGUAGE", region: "경기", isNationwide: false },
  { id: "FL_SEONGNAM", name: "성남외국어고등학교", shortName: "성남외고", category: "FOREIGN_LANGUAGE", region: "경기", isNationwide: false },
  { id: "FL_SUWON", name: "수원외국어고등학교", shortName: "수원외고", category: "FOREIGN_LANGUAGE", region: "경기", isNationwide: false },
  { id: "FL_ANYANG", name: "안양외국어고등학교", shortName: "안양외고", category: "FOREIGN_LANGUAGE", region: "경기", isNationwide: false },

  // 인천 (2교)
  { id: "FL_MICHUHOL", name: "미추홀외국어고등학교", shortName: "미추홀외고", category: "FOREIGN_LANGUAGE", region: "인천", isNationwide: false },
  { id: "FL_INCHEON", name: "인천외국어고등학교", shortName: "인천외고", category: "FOREIGN_LANGUAGE", region: "인천", isNationwide: false },

  // 부산 (1교)
  { id: "FL_BUSAN", name: "부산외국어고등학교", shortName: "부산외고", category: "FOREIGN_LANGUAGE", region: "부산", isNationwide: false },

  // 대구 (1교)
  { id: "FL_DAEGU", name: "대구외국어고등학교", shortName: "대구외고", category: "FOREIGN_LANGUAGE", region: "대구", isNationwide: false },

  // 대전 (1교)
  { id: "FL_DAEJEON", name: "대전외국어고등학교", shortName: "대전외고", category: "FOREIGN_LANGUAGE", region: "대전", isNationwide: false },

  // 울산 (1교)
  { id: "FL_ULSAN", name: "울산외국어고등학교", shortName: "울산외고", category: "FOREIGN_LANGUAGE", region: "울산", isNationwide: false },

  // 충북 (1교)
  { id: "FL_CHEONGJU", name: "청주외국어고등학교", shortName: "청주외고", category: "FOREIGN_LANGUAGE", region: "충북", isNationwide: false },

  // 충남 (1교)
  { id: "FL_CHUNGNAM", name: "충남외국어고등학교", shortName: "충남외고", category: "FOREIGN_LANGUAGE", region: "충남", isNationwide: false },

  // 전북 (1교)
  { id: "FL_JEONBUK", name: "전북외국어고등학교", shortName: "전북외고", category: "FOREIGN_LANGUAGE", region: "전북", isNationwide: false },

  // 전남 (1교)
  { id: "FL_JEONNAM", name: "전남외국어고등학교", shortName: "전남외고", category: "FOREIGN_LANGUAGE", region: "전남", isNationwide: false },

  // 경북 (1교)
  { id: "FL_GYEONGBUK", name: "경북외국어고등학교", shortName: "경북외고", category: "FOREIGN_LANGUAGE", region: "경북", isNationwide: false },

  // 경남 (2교)
  { id: "FL_GYEONGNAM", name: "경남외국어고등학교", shortName: "경남외고", category: "FOREIGN_LANGUAGE", region: "경남", isNationwide: false },
  { id: "FL_GIMHAE", name: "김해외국어고등학교", shortName: "김해외고", category: "FOREIGN_LANGUAGE", region: "경남", isNationwide: false },

  // 제주 (1교)
  { id: "FL_JEJU", name: "제주외국어고등학교", shortName: "제주외고", category: "FOREIGN_LANGUAGE", region: "제주", isNationwide: false },

  // ═══════════════════════════════════════════
  // 국제고등학교 (8교)
  // ═══════════════════════════════════════════
  { id: "INT_SEOUL", name: "서울국제고등학교", shortName: "서울국제고", category: "INTERNATIONAL", region: "서울", isNationwide: false },
  { id: "INT_GOYANG", name: "고양국제고등학교", shortName: "고양국제고", category: "INTERNATIONAL", region: "경기", isNationwide: false },
  { id: "INT_DONGTAN", name: "동탄국제고등학교", shortName: "동탄국제고", category: "INTERNATIONAL", region: "경기", isNationwide: false },
  { id: "INT_CHEONGSIM", name: "청심국제고등학교", shortName: "청심국제고", category: "INTERNATIONAL", region: "경기", isNationwide: true },
  { id: "INT_INCHEON", name: "인천국제고등학교", shortName: "인천국제고", category: "INTERNATIONAL", region: "인천", isNationwide: false },
  { id: "INT_BUSAN", name: "부산국제고등학교", shortName: "부산국제고", category: "INTERNATIONAL", region: "부산", isNationwide: false },
  { id: "INT_DAEGU", name: "대구국제고등학교", shortName: "대구국제고", category: "INTERNATIONAL", region: "대구", isNationwide: false },
  { id: "INT_SEJONG", name: "세종국제고등학교", shortName: "세종국제고", category: "INTERNATIONAL", region: "세종", isNationwide: false },

  // ═══════════════════════════════════════════
  // 자율형사립고등학교 (33교)
  // ═══════════════════════════════════════════

  // 서울 (16교)
  { id: "AU_KYUNGHEE", name: "경희고등학교", shortName: "경희고", category: "AUTONOMOUS", region: "서울", isNationwide: false },
  { id: "AU_DAEGWANG", name: "대광고등학교", shortName: "대광고", category: "AUTONOMOUS", region: "서울", isNationwide: false },
  { id: "AU_BAEJAE", name: "배재고등학교", shortName: "배재고", category: "AUTONOMOUS", region: "서울", isNationwide: false },
  { id: "AU_BOIN", name: "보인고등학교", shortName: "보인고", category: "AUTONOMOUS", region: "서울", isNationwide: false },
  { id: "AU_SEONDUK", name: "선덕고등학교", shortName: "선덕고", category: "AUTONOMOUS", region: "서울", isNationwide: false },
  { id: "AU_SEHWA", name: "세화고등학교", shortName: "세화고", category: "AUTONOMOUS", region: "서울", isNationwide: false },
  { id: "AU_SEHWA_G", name: "세화여자고등학교", shortName: "세화여고", category: "AUTONOMOUS", region: "서울", isNationwide: false },
  { id: "AU_SHINIL", name: "신일고등학교", shortName: "신일고", category: "AUTONOMOUS", region: "서울", isNationwide: false },
  { id: "AU_YANGJEONG", name: "양정고등학교", shortName: "양정고", category: "AUTONOMOUS", region: "서울", isNationwide: false },
  { id: "AU_EWHA_G", name: "이화여자고등학교", shortName: "이화여고", category: "AUTONOMOUS", region: "서울", isNationwide: false },
  { id: "AU_JUNGDONG", name: "중동고등학교", shortName: "중동고", category: "AUTONOMOUS", region: "서울", isNationwide: false },
  { id: "AU_JUNGANG", name: "중앙고등학교", shortName: "중앙고", category: "AUTONOMOUS", region: "서울", isNationwide: false },
  { id: "AU_HANYANG", name: "한양대학교사범대학부속고등학교", shortName: "한대부고", category: "AUTONOMOUS", region: "서울", isNationwide: false },
  { id: "AU_HYUNDAI", name: "현대고등학교", shortName: "현대고", category: "AUTONOMOUS", region: "서울", isNationwide: false },
  { id: "AU_HWIMUN", name: "휘문고등학교", shortName: "휘문고", category: "AUTONOMOUS", region: "서울", isNationwide: false },
  { id: "AU_HANA", name: "하나고등학교", shortName: "하나고", category: "AUTONOMOUS", region: "서울", isNationwide: true },

  // 부산 (2교)
  { id: "AU_HAEUNDAE", name: "해운대고등학교", shortName: "해운대고", category: "AUTONOMOUS", region: "부산", isNationwide: true },
  { id: "AU_BUIL", name: "부일외국어고등학교", shortName: "부일외고", category: "AUTONOMOUS", region: "부산", isNationwide: false },

  // 대구 (1교)
  { id: "AU_GYESUNG", name: "계성고등학교", shortName: "계성고", category: "AUTONOMOUS", region: "대구", isNationwide: false },

  // 인천 (2교)
  { id: "AU_INCHEON_SKY", name: "인천하늘고등학교", shortName: "인천하늘고", category: "AUTONOMOUS", region: "인천", isNationwide: true },
  { id: "AU_POSCO_ICN", name: "인천포스코고등학교", shortName: "인천포스코고", category: "AUTONOMOUS", region: "인천", isNationwide: false },

  // 대전 (2교)
  { id: "AU_DAESUNG", name: "대전대성고등학교", shortName: "대전대성고", category: "AUTONOMOUS", region: "대전", isNationwide: false },
  { id: "AU_DAESHIN", name: "대전대신고등학교", shortName: "대전대신고", category: "AUTONOMOUS", region: "대전", isNationwide: false },

  // 울산 (1교)
  { id: "AU_CHEONGWOON", name: "현대청운고등학교", shortName: "현대청운고", category: "AUTONOMOUS", region: "울산", isNationwide: true },

  // 경기 (2교)
  { id: "AU_DONGSAN", name: "안산동산고등학교", shortName: "안산동산고", category: "AUTONOMOUS", region: "경기", isNationwide: false },
  { id: "AU_HUFS", name: "용인한국외국어대학교부설고등학교", shortName: "용인외대부고", category: "AUTONOMOUS", region: "경기", isNationwide: true },

  // 강원 (1교)
  { id: "AU_MINSAGWAN", name: "민족사관고등학교", shortName: "민사고", category: "AUTONOMOUS", region: "강원", isNationwide: true },

  // 충남 (2교)
  { id: "AU_BUGIL", name: "북일고등학교", shortName: "북일고", category: "AUTONOMOUS", region: "충남", isNationwide: true },
  { id: "AU_SAMSUNG", name: "충남삼성고등학교", shortName: "충남삼성고", category: "AUTONOMOUS", region: "충남", isNationwide: true },

  // 전북 (1교)
  { id: "AU_SANGSAN", name: "상산고등학교", shortName: "상산고", category: "AUTONOMOUS", region: "전북", isNationwide: true },

  // 전남 (1교)
  { id: "AU_GWANGYANG", name: "광양제철고등학교", shortName: "광양제철고", category: "AUTONOMOUS", region: "전남", isNationwide: true },

  // 경북 (2교)
  { id: "AU_POHANG", name: "포항제철고등학교", shortName: "포항제철고", category: "AUTONOMOUS", region: "경북", isNationwide: true },
  { id: "AU_GIMCHEON", name: "김천고등학교", shortName: "김천고", category: "AUTONOMOUS", region: "경북", isNationwide: true },
];

// ─── 유틸 함수 ─────────────────────────────

/** ID로 학교 찾기 */
export function getSchoolById(id: string): School | undefined {
  return SCHOOLS.find((s) => s.id === id);
}

/** 학교 ID → 짧은 이름 */
export function getSchoolShortName(id: string): string {
  return getSchoolById(id)?.shortName ?? id;
}

/** 학교 ID → 전체 이름 */
export function getSchoolName(id: string): string {
  return getSchoolById(id)?.name ?? id;
}

/** 학교 ID → 카테고리 라벨 */
export function getSchoolCategoryLabel(id: string): string {
  const school = getSchoolById(id);
  if (!school) return "";
  return SCHOOL_CATEGORY_LABELS[school.category];
}

/** 카테고리별 학교 목록 */
export function getSchoolsByCategory(category: SchoolCategory): School[] {
  return SCHOOLS.filter((s) => s.category === category);
}

/** 지역별 학교 목록 */
export function getSchoolsByRegion(region: string): School[] {
  return SCHOOLS.filter((s) => s.region === region);
}

/** 전체 지역 목록 (중복 제거, 순서 유지) */
export function getAllRegions(): string[] {
  const regions: string[] = [];
  for (const s of SCHOOLS) {
    if (!regions.includes(s.region)) regions.push(s.region);
  }
  return regions;
}
