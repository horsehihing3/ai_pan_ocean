// [2026-04-21] 안전보건 목표 - 팬오션_안전보건목표_2025.html 디자인 적용
import { useState, useEffect, useRef } from 'react';

/* ── 색상 변수 ────────────────────────────────── */
const C = {
  navy: '#0a1f44',
  navy2: '#112359',
  blue: '#1a56c4',
  blue2: '#2563eb',
  blue3: '#3b82f6',
  sky: '#0ea5e9',
  teal: '#0891b2',
  green: '#059669',
  amber: '#d97706',
  gold2: '#fbbf24',
  red: '#dc2626',
  t1: '#0f172a',
  t2: '#334155',
  t3: '#64748b',
  t4: '#94a3b8',
  bg2: '#eef2f9',
  border: '#dde6f0',
};

/* ── 뱃지 ─────────────────────────────────────── */
type BadgeColor = 'navy'|'blue'|'green'|'amber'|'red'|'gray'|'teal';
function Badge({ color, children }: { color: BadgeColor; children: React.ReactNode }) {
  const styles: Record<BadgeColor, React.CSSProperties> = {
    navy:  { background: '#e0e8f5', color: C.navy },
    blue:  { background: '#dbeafe', color: '#1d4ed8' },
    green: { background: '#d1fae5', color: '#065f46' },
    amber: { background: '#fef3c7', color: '#78350f' },
    red:   { background: '#fee2e2', color: '#991b1b' },
    gray:  { background: '#f1f5f9', color: C.t3 },
    teal:  { background: '#cffafe', color: '#155e75' },
  };
  return (
    <span style={{ ...styles[color], display:'inline-flex', alignItems:'center', gap:4,
      padding:'3px 9px', borderRadius:6, fontSize:11, fontWeight:700, whiteSpace:'nowrap' }}>
      {children}
    </span>
  );
}

type PriorityLevel = 'high'|'mid'|'low';
function Priority({ level }: { level: PriorityLevel }) {
  const styles: Record<PriorityLevel, React.CSSProperties> = {
    high: { background: '#fee2e2', color: '#991b1b' },
    mid:  { background: '#fef3c7', color: '#78350f' },
    low:  { background: '#d1fae5', color: '#065f46' },
  };
  const labels = { high: '최우선', mid: '중요', low: '일반' };
  return (
    <span style={{ ...styles[level], display:'inline-flex', alignItems:'center',
      padding:'2px 8px', borderRadius:4, fontSize:10.5, fontWeight:700 }}>
      {labels[level]}
    </span>
  );
}

/* ── 섹션 헤더 ────────────────────────────────── */
function SectionHeader({ label, title, desc }: { label: string; title: string; desc?: string }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <div style={{ fontSize:11, fontWeight:700, color: C.blue2, letterSpacing:'0.12em',
        textTransform:'uppercase', marginBottom:6, display:'flex', alignItems:'center', gap:7 }}>
        <span style={{ width:24, height:2, background: C.blue2, display:'inline-block' }} />
        {label}
      </div>
      <h2 style={{ fontSize:22, fontWeight:800, color: C.navy, letterSpacing:'-0.4px' }}>{title}</h2>
      {desc && <p style={{ fontSize:14, color: C.t3, marginTop:6, lineHeight:1.6 }}>{desc}</p>}
    </div>
  );
}

/* ── 목표 테이블 ──────────────────────────────── */
type GoalRow = {
  cat?: string; catSpan?: number;
  item: string; prev: string; target: string;
  badge: [string, BadgeColor]; priority: PriorityLevel; dept: string;
};

function GoalTable({ rows }: { rows: GoalRow[] }) {
  const thStyle: React.CSSProperties = {
    background: C.navy, color: '#fff', fontSize:11, fontWeight:700,
    letterSpacing:'0.05em', padding:'11px 16px', textAlign:'left', whiteSpace:'nowrap',
  };
  const tdBase: React.CSSProperties = { padding:'11px 16px', borderBottom:`1px solid #edf2f8`, color: C.t2, verticalAlign:'middle' };
  return (
    <div style={{ overflowX:'auto', borderRadius:12, boxShadow:'0 2px 12px rgba(10,31,68,.08)' }}>
      <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13, background:'#fff' }}>
        <thead>
          <tr>
            {['분류','세부 목표 항목','2024년 실적','2025년 목표','측정지표','중요도','담당부서'].map((h, i) => (
              <th key={h} style={{ ...thStyle, borderRadius: i===0?'12px 0 0 0':i===6?'0 12px 0 0':undefined }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} style={{ background: i % 2 === 0 ? '#fff' : '#fafcff' }}>
              {r.cat && <td rowSpan={r.catSpan} style={{ ...tdBase, fontWeight:700, color: C.t1, fontSize:13 }}>{r.cat}</td>}
              <td style={tdBase}>{r.item}</td>
              <td style={{ ...tdBase, fontWeight:700, color: C.blue2, textAlign:'center' }}>{r.prev}</td>
              <td style={{ ...tdBase, fontWeight:700, color: C.navy, textAlign:'center' }}>{r.target}</td>
              <td style={{ ...tdBase, textAlign:'center' }}><Badge color={r.badge[1]}>{r.badge[0]}</Badge></td>
              <td style={{ ...tdBase, textAlign:'center' }}><Priority level={r.priority} /></td>
              <td style={{ ...tdBase, textAlign:'center' }}>{r.dept}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ── 탭 데이터 ────────────────────────────────── */
const TAB_DATA: { id: string; label: string; rows: GoalRow[] }[] = [
  {
    id: 'ship', label: '🚢 선박 안전',
    rows: [
      { cat:'중대사고\n예방', catSpan:4, item:'선박 중대사고 (사망·침몰·좌초·충돌) 발생 건수', prev:'0건', target:'0건', badge:['사고 건수','navy'], priority:'high', dept:'선박안전팀' },
      { item:'Lost Time Injury Frequency (LTIF)', prev:'0.72', target:'≤ 0.50', badge:['백만인시당','blue'], priority:'high', dept:'선박안전팀' },
      { item:'아차사고(Near Miss) 보고 건수', prev:'142건', target:'≥ 200건', badge:['건수 (▲목표)','green'], priority:'mid', dept:'SMS팀' },
      { item:'위험성평가 실시율 (전 선박)', prev:'94%', target:'100%', badge:['이행률','blue'], priority:'high', dept:'선박안전팀' },
      { cat:'외부 감사\n대응', catSpan:3, item:'항만국통제(PSC) 억류(Detention) 건수', prev:'0건', target:'0건', badge:['억류 건수','navy'], priority:'high', dept:'운항팀' },
      { item:'기국·선급 검사 적발 결함 건수', prev:'8건', target:'≤ 5건', badge:['결함 건수','amber'], priority:'mid', dept:'운항팀' },
      { item:'SIRE / CDI 화물 검사 통과율', prev:'96.2%', target:'≥ 98%', badge:['통과율','blue'], priority:'mid', dept:'탱커팀' },
      { cat:'선박\n안전설비', catSpan:3, item:'비상구명설비(LSA) 정기점검 이행률', prev:'98%', target:'100%', badge:['점검 이행률','blue'], priority:'high', dept:'선박팀' },
      { item:'소방설비 법정검사 완료율', prev:'100%', target:'100%', badge:['완료율','green'], priority:'high', dept:'선박팀' },
      { item:'선박 안전관리시스템(SMS) 감사 적합 선박 비율', prev:'92%', target:'≥ 95%', badge:['적합율','teal'], priority:'mid', dept:'SMS팀' },
    ],
  },
  {
    id: 'office', label: '🏢 육상·항만',
    rows: [
      { cat:'중대재해\n예방', catSpan:3, item:'육상사업장 중대산업재해 발생 건수', prev:'0건', target:'0건', badge:['건수','navy'], priority:'high', dept:'안전보건팀' },
      { item:'산업재해율 (재해자수/근로자수×100)', prev:'0.12%', target:'≤ 0.10%', badge:['재해율','blue'], priority:'high', dept:'안전보건팀' },
      { item:'위험성평가 실시 (사업장 전체)', prev:'100%', target:'100%', badge:['이행율','green'], priority:'high', dept:'안전보건팀' },
      { cat:'항만\n하역 안전', catSpan:2, item:'하역작업 중 사고 건수 (부두·터미널)', prev:'2건', target:'0건', badge:['건수','navy'], priority:'high', dept:'운항팀' },
      { item:'하역 전 안전점검(TBM) 실시율', prev:'88%', target:'100%', badge:['실시율','blue'], priority:'mid', dept:'운항팀' },
      { cat:'안전\n경영체계', catSpan:2, item:'안전보건관리체계 구축·운영 (중대재해법)', prev:'완료', target:'고도화', badge:['완성도','teal'], priority:'high', dept:'안전보건팀' },
      { item:'협력업체 안전보건 점검 실시 (연 2회)', prev:'1회', target:'연 2회', badge:['회/년','amber'], priority:'mid', dept:'안전보건팀' },
    ],
  },
  {
    id: 'health', label: '❤️ 선원 건강보건',
    rows: [
      { cat:'건강검진', catSpan:3, item:'선원 승선 전 신체검사 이행률', prev:'100%', target:'100%', badge:['이행율','green'], priority:'high', dept:'인사팀' },
      { item:'임직원 일반건강검진 수검율', prev:'96.3%', target:'100%', badge:['수검율','blue'], priority:'high', dept:'인사팀' },
      { item:'건강검진 이상소견자 사후관리 완료율', prev:'78%', target:'≥ 90%', badge:['완료율','blue'], priority:'mid', dept:'인사팀' },
      { cat:'정신건강\n관리', catSpan:3, item:'선원 정신건강 설문조사 실시 (연 1회 이상)', prev:'0회', target:'연 1회', badge:['회/년','amber'], priority:'mid', dept:'인사팀' },
      { item:'선원 고위험군 심리상담 연계율', prev:'신규', target:'100%', badge:['연계율','teal'], priority:'mid', dept:'인사팀' },
      { item:'직무스트레스 예방 프로그램 운영', prev:'미시행', target:'도입완료', badge:['도입여부','blue'], priority:'low', dept:'인사팀' },
      { cat:'MLC 2006\n준수', catSpan:2, item:'해사노동협약(MLC) 근로시간 기준 준수율', prev:'97.1%', target:'100%', badge:['준수율','green'], priority:'high', dept:'선원팀' },
      { item:'MLC 선내 거주 환경 기준 적합 선박 비율', prev:'90%', target:'100%', badge:['적합율','blue'], priority:'mid', dept:'선박팀' },
    ],
  },
  {
    id: 'env', label: '🌊 환경·비상대응',
    rows: [
      { cat:'해양환경\n오염 예방', catSpan:3, item:'기름 유출 사고 발생 건수 (해양 방류)', prev:'0건', target:'0건', badge:['건수','navy'], priority:'high', dept:'해무팀' },
      { item:'MARPOL 위반 적발 건수', prev:'0건', target:'0건', badge:['건수','navy'], priority:'high', dept:'해무팀' },
      { item:'선박 폐기물 관리계획서 보유율', prev:'100%', target:'100%', badge:['보유율','green'], priority:'mid', dept:'해무팀' },
      { cat:'비상대응\n훈련', catSpan:2, item:'비상대응 훈련 실시 (선박, 분기 1회 이상)', prev:'분기1회', target:'분기1회', badge:['회/분기','blue'], priority:'high', dept:'선박안전팀' },
      { item:'비상대응 훈련 평가 합격률', prev:'94%', target:'≥ 98%', badge:['합격율','blue'], priority:'mid', dept:'선박안전팀' },
      { cat:'선박\n보안', catSpan:2, item:'ISPS Code 보안 감사 통과율', prev:'100%', target:'100%', badge:['통과율','teal'], priority:'high', dept:'해무팀' },
      { item:'보안 위협 (해적·밀수 등) 보고 및 대응 훈련', prev:'연1회', target:'연 2회', badge:['회/년','amber'], priority:'mid', dept:'해무팀' },
    ],
  },
  {
    id: 'edu', label: '🎓 교육·훈련',
    rows: [
      { cat:'법정\n교육', catSpan:3, item:'선원 STCW 법정교육 이수율 100%', prev:'98.5%', target:'100%', badge:['이수율','blue'], priority:'high', dept:'선원교육팀' },
      { item:'육상 안전보건 법정교육 이수율', prev:'97%', target:'100%', badge:['이수율','blue'], priority:'high', dept:'안전보건팀' },
      { item:'신규 선원 안전 입문교육 100% 실시', prev:'100%', target:'100%', badge:['실시율','green'], priority:'high', dept:'선원교육팀' },
      { cat:'역량\n강화', catSpan:2, item:'운항 시뮬레이터 교육 시간 (1인당)', prev:'16시간', target:'≥ 24시간', badge:['시간/인','teal'], priority:'mid', dept:'선원교육팀' },
      { item:'안전보건 전문인력 자격 취득 지원', prev:'3명', target:'≥ 5명', badge:['명/년','amber'], priority:'low', dept:'인사팀' },
      { cat:'경영진\n리더십', catSpan:2, item:'대표이사 안전 현장방문 (선박·항만)', prev:'2회', target:'연 4회', badge:['회/년','navy'], priority:'mid', dept:'경영지원' },
      { item:'임원·관리자 안전보건 리더십 교육', prev:'1회', target:'반기 1회', badge:['회/반기','blue'], priority:'mid', dept:'안전보건팀' },
    ],
  },
];

/* ── 프로그레스 바 ────────────────────────────── */
function ProgressBar({ label, value, pct, sub, color }: { label:string; value:string; pct:number; sub:string; color:string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) setTimeout(() => setWidth(pct), 100);
    }, { threshold: 0.2 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [pct]);
  return (
    <div ref={ref} style={{ marginBottom: 14 }}>
      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
        <span style={{ fontSize:13, fontWeight:600, color: C.t1 }}>{label}</span>
        <span style={{ fontSize:12, fontWeight:700, color }}>{value}</span>
      </div>
      <div style={{ height:10, background: C.bg2, borderRadius:5, overflow:'hidden' }}>
        <div style={{ height:'100%', width:`${width}%`, borderRadius:5, background:color, transition:'width 1s ease' }} />
      </div>
      <div style={{ fontSize:11.5, color: C.t3, marginTop:4 }}>{sub}</div>
    </div>
  );
}

/* ── 메인 컴포넌트 ────────────────────────────── */
export default function SafetyGoalsPage() {
  const [activeTab, setActiveTab] = useState('ship');

  const policyCards = [
    { color:'#e8eef8', top:`linear-gradient(90deg,${C.navy},${C.blue2})`, icon:'⚓', num:'방침 01', title:'안전 최우선 경영원칙 확립', desc:'모든 경영 활동에서 안전을 최우선 가치로 삼습니다. 생명과 건강이 생산성·수익성보다 우선임을 공유하고, 경영자는 안전에 필요한 인력·예산·설비를 최우선 배정합니다.' },
    { color:'#dbeafe', top:`linear-gradient(90deg,${C.blue2},${C.sky})`, icon:'🛡️', num:'방침 02', title:'법규 및 국제협약 완전 준수', desc:'중대재해처벌법·산업안전보건법·선박안전법·SOLAS·STCW·MLC 2006 등 국내외 법규와 IMO 결의·ISM Code·TMSA를 철저히 준수합니다.' },
    { color:'#cffafe', top:`linear-gradient(90deg,${C.teal},${C.green})`, icon:'🔍', num:'방침 03', title:'위험 사전 식별 및 선제적 예방', desc:'모든 선박과 사업장에서 위험성평가(Risk Assessment)를 실시하고, 아차사고(Near Miss) 보고 문화를 확산하여 사고 발생 전 단계에서 위험을 제거합니다.' },
    { color:'#d1fae5', top:`linear-gradient(90deg,${C.green},#34d399)`, icon:'👥', num:'방침 04', title:'자율적 안전문화 구축 및 참여', desc:'전 선원과 임직원이 안전보건 활동에 자발적으로 참여하는 문화를 구축합니다. 안전제안 활성화, 선박 안전위원회 운영, 비상 훈련 주기적 실시를 통해 현장 중심 역량을 강화합니다.' },
    { color:'#fef3c7', top:`linear-gradient(90deg,${C.amber},${C.gold2})`, icon:'🎓', num:'방침 05', title:'지속적 교육·훈련 및 역량 강화', desc:'STCW 및 국내 법정교육을 포함한 체계적 안전보건 교육을 실시합니다. 선원 건강검진·정신건강 관리·운항 시뮬레이터 훈련 등을 강화하여 개인 역량을 지속 향상시킵니다.' },
    { color:'#fee2e2', top:`linear-gradient(90deg,${C.red},#f87171)`, icon:'📈', num:'방침 06', title:'성과 모니터링 및 지속 개선', desc:'안전보건 KPI를 주기적으로 측정·분석하고 경영진에 보고합니다. 사고·아차사고를 철저히 조사하여 재발방지대책을 수립하며, 내외부 감사 결과를 반영한 PDCA 사이클을 운영합니다.' },
  ];

  const certCards = [
    { icon:'⚓', name:'ISM Code', org:'국제해사기구 (IMO)', status:'✅ 전 관리선박 DOC·SMC 보유', ok:true },
    { icon:'🛡️', name:'ISO 45001:2018', org:'안전보건경영시스템 국제표준', status:'✅ 육상 사업장 인증 유지', ok:true },
    { icon:'🌊', name:'TMSA (탱커관리)', org:'OCIMF TMSA Level 3', status:'✅ Level 3 달성 유지', ok:true },
    { icon:'📋', name:'MLC 2006', org:'해사노동협약 ILO', status:'✅ MLC 적합 인증서 보유', ok:true },
    { icon:'🔐', name:'ISPS Code', org:'선박 및 항만 보안 코드', status:'✅ SSP 승인 유지', ok:true },
    { icon:'🌿', name:'ISO 14001:2015', org:'환경경영시스템 국제표준', status:'🔄 인증 추진 중 (2025년 목표)', ok:false },
  ];

  const timelineItems = [
    { q:'2025년 1분기 (1~3월)', title:'안전보건 목표 선포 및 체계 수립', desc:'대표이사 안전보건방침 선포식, 안전보건 목표 전사 공지, 선박별 SMS 검토 및 개정, 임직원 교육계획 수립', badges:[['완료','green'],['방침선포','navy'],['계획수립','blue']] as [string, BadgeColor][], dot:'done' },
    { q:'2025년 2분기 (4~6월)', title:'위험성평가 전면 실시 및 선박 점검', desc:'전 선박 위험성평가 100% 실시, 선박안전점검단 현장점검 (3척 이상), 선원 정신건강 설문조사 최초 실시, 항만하역 안전 교육 강화', badges:[['완료','green'],['위험성평가','teal'],['선박점검','blue']] as [string, BadgeColor][], dot:'done' },
    { q:'2025년 3분기 (7~9월)', title:'중간 점검 및 개선 조치', desc:'상반기 안전보건 KPI 분석 및 보고, SMS 내부감사 실시, 선원 건강검진 실시, 하반기 비상훈련 계획 수립 및 실시', badges:[['진행중','amber'],['중간점검','blue']] as [string, BadgeColor][], dot:'active' },
    { q:'2025년 4분기 (10~12월)', title:'연간 성과 평가 및 차년도 계획 수립', desc:'연간 안전보건 KPI 달성도 평가, 경영검토 회의 개최, 사고·아차사고 연간 분석 보고, 2026년 안전보건 목표 수립 및 예산 배정', badges:[['예정','gray'],['경영검토','navy'],['차년도계획','blue']] as [string, BadgeColor][], dot:'plan' },
  ];

  const dotColors: Record<string, string> = { done: C.green, active: C.blue2, plan: '#fff' };
  const dotBorder: Record<string, string> = { done: C.green, active: C.blue2, plan: C.t4 };

  return (
    <div style={{ fontFamily:"'Noto Sans KR', sans-serif", background:'#f4f7fc', color: C.t1, minHeight:'100vh' }}>

      {/* ── HERO ─────────────────────────────── */}
      <div style={{
        background:`linear-gradient(135deg,${C.navy} 0%,${C.navy2} 40%,#1a3a7c 70%,#0e4a8a 100%)`,
        position:'relative', overflow:'hidden', padding:'64px 36px 80px', textAlign:'center',
      }}>
        {/* 패턴 배경 */}
        <div style={{ position:'absolute', inset:0, backgroundImage:"url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.03'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")" }} />
        {/* 웨이브 */}
        <div style={{ position:'absolute', bottom:0, left:0, right:0, height:60, background:'#f4f7fc', clipPath:'ellipse(55% 100% at 50% 100%)' }} />

        <div style={{ display:'inline-flex', alignItems:'center', gap:7, background:'rgba(255,255,255,.1)', border:'1px solid rgba(255,255,255,.2)', color:'rgba(255,255,255,.85)', fontSize:12, fontWeight:600, padding:'5px 16px', borderRadius:20, marginBottom:20, letterSpacing:'0.05em' }}>
          ⚓ 2025년도 안전보건 목표 &amp; 방침
        </div>
        <h1 style={{ fontSize:'clamp(24px,4vw,40px)', fontWeight:700, color:'#fff', letterSpacing:'-0.5px', lineHeight:1.2, marginBottom:10 }}>
          안전하고 건강한 바다,<br />
          <span style={{ color: C.gold2 }}>Zero Harm</span> · 무재해 해운을 선도합니다
        </h1>
        <p style={{ fontSize:15, color:'rgba(255,255,255,.7)', marginBottom:28, maxWidth:600, margin:'0 auto 28px' }}>
          팬오션은 모든 선원과 임직원의 생명과 건강을 최우선으로 하며,<br />
          지속가능한 안전보건경영체계 구축을 통해 글로벌 리딩 해운물류기업으로 나아갑니다.
        </p>
        <div style={{ display:'inline-flex', gap:24, flexWrap:'wrap', justifyContent:'center', fontSize:12, color:'rgba(255,255,255,.55)' }}>
          {['📅 2025년 1월 2일 선포','🏢 팬오션㈜ 대표이사','⚖️ 중대재해처벌법 준수','🌊 ISM Code 준수'].map(t => (
            <span key={t} style={{ display:'flex', alignItems:'center', gap:5 }}>{t}</span>
          ))}
        </div>
      </div>

      <div style={{ maxWidth:1060, margin:'0 auto', padding:'0 24px' }}>

        {/* ── 비전 스트립 ──────────────────────── */}
        <div style={{ padding:'48px 0 0' }}>
          <SectionHeader label="Safety Vision" title="안전보건 비전 및 슬로건" />
          <div style={{
            background:`linear-gradient(135deg,${C.navy},#1a3a7c)`,
            borderRadius:16, padding:'36px 40px', display:'flex', alignItems:'center', gap:40,
            boxShadow:'0 8px 40px rgba(10,31,68,.16)', position:'relative', overflow:'hidden',
          }}>
            <span style={{ position:'absolute', right:40, bottom:-10, fontSize:100, opacity:0.07, lineHeight:1 }}>🚢</span>
            <div style={{ width:56, height:56, borderRadius:14, background:'rgba(255,255,255,.12)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:26, flexShrink:0 }}>🎯</div>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:11, fontWeight:700, color:'rgba(255,255,255,.5)', letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:6 }}>Safety Vision 2025</div>
              <div style={{ fontSize:18, fontWeight:700, color:'#fff', lineHeight:1.5 }}>
                "<span style={{ color: C.gold2 }}>바다 위 모든 생명을 지킨다</span> — Safety First, Life First"<br />
                중대재해 Zero · 무사고 항해 · 건강한 선원 · 안전한 항만
              </div>
              <div style={{ fontSize:13, color:'rgba(255,255,255,.6)', marginTop:8, lineHeight:1.6 }}>
                팬오션은 벌크선·컨테이너선·탱커선·LNG선 등 전 선종에 걸쳐 ISM Code 및 TMSA 기준을 준수하며, 선원과 임직원이 안전하고 건강하게 근무할 수 있는 환경을 만드는 것을 안전보건경영의 최고 목표로 삼습니다.
              </div>
            </div>
          </div>
        </div>

        {/* ── KPI ──────────────────────────────── */}
        <div style={{ padding:'48px 0 0' }}>
          <SectionHeader label="2025 Safety KPI" title="2025년 핵심 안전보건 성과목표" />
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14 }}>
            {[
              { emoji:'⚓', top:'중대재해 발생 건수', val:'0', unit:'건', desc:'선박·육상 사망·중상 사고\n전무 달성 (Zero Harm)', color: C.navy },
              { emoji:'🛡️', top:'Lost Time Injury (LTI)', val:'0', unit:'건', desc:'휴업 산재 Zero 목표\nLTIF ≤ 0.5 (전년 0.72)', color: C.green },
              { emoji:'📊', top:'안전보건 교육 이수율', val:'100', unit:'%', desc:'전 선원·임직원 법정교육\n100% 이수 달성', color: C.blue2 },
              { emoji:'🚢', top:'항해 안전 감사 통과율', val:'100', unit:'%', desc:'PSC·기국·선급 외부감사\n적발 0건 유지', color: C.teal },
            ].map((k, i) => (
              <div key={i} style={{ background:'#fff', border:`1px solid ${C.border}`, borderRadius:13, padding:'20px 18px', boxShadow:'0 2px 12px rgba(10,31,68,.08)', textAlign:'center', position:'relative', overflow:'hidden' }}>
                <div style={{ position:'absolute', right:-8, bottom:-8, fontSize:48, opacity:0.06, lineHeight:1 }}>{k.emoji}</div>
                <div style={{ fontSize:10.5, fontWeight:600, color: C.t4, letterSpacing:'0.05em', marginBottom:8 }}>{k.top}</div>
                <div style={{ fontSize:28, fontWeight:800, lineHeight:1, marginBottom:5, color: k.color }}>
                  {k.val}<span style={{ fontSize:13, fontWeight:400, color: C.t3, marginLeft:2 }}>{k.unit}</span>
                </div>
                <div style={{ fontSize:11.5, color: C.t3, lineHeight:1.4, whiteSpace:'pre-line' }}>{k.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── 방침 카드 ─────────────────────────── */}
        <div style={{ padding:'48px 0 0' }}>
          <SectionHeader label="Safety & Health Policy" title="안전보건 경영방침" desc="팬오션은 다음의 6대 안전보건 경영방침을 전 사업장 및 선박에 적용합니다." />
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:16 }}>
            {policyCards.map((pc) => (
              <div key={pc.num} style={{ background:'#fff', border:`1px solid ${C.border}`, borderRadius:14, padding:24, boxShadow:'0 2px 12px rgba(10,31,68,.08)', position:'relative', overflow:'hidden', transition:'transform .2s, box-shadow .2s' }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform='translateY(-3px)'; (e.currentTarget as HTMLDivElement).style.boxShadow='0 8px 40px rgba(10,31,68,.16)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform='translateY(0)'; (e.currentTarget as HTMLDivElement).style.boxShadow='0 2px 12px rgba(10,31,68,.08)'; }}
              >
                <div style={{ position:'absolute', top:0, left:0, right:0, height:4, borderRadius:'14px 14px 0 0', background: pc.top }} />
                <div style={{ width:44, height:44, borderRadius:11, background: pc.color, display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, marginBottom:14 }}>{pc.icon}</div>
                <div style={{ fontSize:10, fontWeight:700, color: C.t4, letterSpacing:'0.1em', marginBottom:5 }}>{pc.num}</div>
                <div style={{ fontSize:14, fontWeight:700, color: C.t1, marginBottom:8, lineHeight:1.35 }}>{pc.title}</div>
                <div style={{ fontSize:12.5, color: C.t2, lineHeight:1.65 }}>{pc.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── 세부 목표 탭 ──────────────────────── */}
        <div style={{ padding:'48px 0 0' }}>
          <SectionHeader label="Detailed Goals" title="2025년 분야별 세부 안전보건 목표" />
          {/* 탭 버튼 */}
          <div style={{ display:'flex', borderBottom:`2px solid ${C.border}`, marginBottom:24, overflowX:'auto' }}>
            {TAB_DATA.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
                padding:'12px 22px', fontSize:13, fontWeight:600, color: activeTab===tab.id ? C.blue2 : C.t3,
                border:'none', background:'none', cursor:'pointer', whiteSpace:'nowrap',
                borderBottom: activeTab===tab.id ? `3px solid ${C.blue2}` : '3px solid transparent',
                marginBottom:-2, fontFamily:'inherit', transition:'all .15s',
              }}>
                {tab.label}
              </button>
            ))}
          </div>
          {/* 탭 패널 */}
          {TAB_DATA.filter(t => t.id === activeTab).map(tab => (
            <GoalTable key={tab.id} rows={tab.rows} />
          ))}
        </div>

        {/* ── 추진 일정 + 진행률 ────────────────── */}
        <div style={{ padding:'48px 0 0' }}>
          <SectionHeader label="Action Plan" title="2025년 안전보건 주요 추진 일정" />
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:24 }}>
            {/* 타임라인 */}
            <div>
              <div style={{ paddingLeft:20, position:'relative' }}>
                <div style={{ position:'absolute', left:5, top:8, bottom:0, width:2, background:`linear-gradient(to bottom,${C.blue2},transparent)` }} />
                {timelineItems.map((tl, i) => (
                  <div key={i} style={{ position:'relative', marginBottom:22 }}>
                    <div style={{ position:'absolute', left:-18, top:4, width:10, height:10, borderRadius:'50%', border:`2px solid ${dotBorder[tl.dot]}`, background: dotColors[tl.dot] }} />
                    <div style={{ fontSize:10.5, fontWeight:700, color: C.t4, marginBottom:3, fontFamily:'monospace' }}>{tl.q}</div>
                    <div style={{ fontSize:13, fontWeight:700, color: C.t1, marginBottom:3 }}>{tl.title}</div>
                    <div style={{ fontSize:12, color: C.t2, lineHeight:1.55 }}>{tl.desc}</div>
                    <div style={{ display:'flex', gap:5, marginTop:5, flexWrap:'wrap' }}>
                      {tl.badges.map(([text, color]) => <Badge key={text} color={color}>{text}</Badge>)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {/* 진행률 */}
            <div>
              <div style={{ background:'#fff', border:`1px solid ${C.border}`, borderRadius:14, padding:24, boxShadow:'0 2px 12px rgba(10,31,68,.08)' }}>
                <div style={{ fontSize:13, fontWeight:700, color: C.navy, marginBottom:16 }}>📊 2025년 안전보건 목표 달성 현황 (3분기 기준)</div>
                <ProgressBar label="중대재해 Zero 유지" value="달성중" pct={100} sub="중대사고 발생 0건 · 9개월 연속 무사고" color={`linear-gradient(90deg,${C.green},#34d399)`} />
                <ProgressBar label="LTIF 목표 달성 (≤0.50)" value="0.41" pct={82} sub="현재 0.41 · 목표 0.50 이내 달성 (양호)" color={`linear-gradient(90deg,${C.blue2},${C.sky})`} />
                <ProgressBar label="안전교육 이수율" value="94%" pct={94} sub="미이수자 124명 · 4분기 완료 추진" color={`linear-gradient(90deg,${C.amber},${C.gold2})`} />
                <ProgressBar label="PSC 억류 건수" value="0건" pct={100} sub="항만국통제 억류 0건 · 목표 달성" color={`linear-gradient(90deg,${C.green},#34d399)`} />
                <ProgressBar label="아차사고 보고 (목표 200건)" value="156건" pct={78} sub="156/200건 (78%) · 4분기 적극 독려" color={`linear-gradient(90deg,${C.teal},${C.sky})`} />
              </div>
            </div>
          </div>
        </div>

        {/* ── 인증 현황 ─────────────────────────── */}
        <div style={{ padding:'48px 0 0' }}>
          <SectionHeader label="Certification" title="안전보건 관련 인증 및 준수 체계" />
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14 }}>
            {certCards.map((c) => (
              <div key={c.name} style={{ background:'#fff', border:`1px solid ${C.border}`, borderRadius:12, padding:20, boxShadow:'0 2px 12px rgba(10,31,68,.08)', textAlign:'center' }}>
                <div style={{ fontSize:32, marginBottom:10 }}>{c.icon}</div>
                <div style={{ fontSize:13, fontWeight:700, color: C.t1, marginBottom:5 }}>{c.name}</div>
                <div style={{ fontSize:11.5, color: C.t3, marginBottom:10 }}>{c.org}</div>
                <div style={{ fontSize:12, fontWeight:600, color: c.ok ? C.green : C.blue2 }}>{c.status}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── 대표이사 선언 ──────────────────────── */}
        <div style={{ padding:'48px 0 0' }}>
          <div style={{
            background:`linear-gradient(135deg,${C.navy},#1e3a6e)`,
            borderRadius:16, padding:40, textAlign:'center',
            boxShadow:'0 8px 40px rgba(10,31,68,.16)', position:'relative', overflow:'hidden',
          }}>
            <div style={{ position:'absolute', inset:0, background:'radial-gradient(ellipse at 30% 50%,rgba(59,130,246,.15) 0%,transparent 60%)' }} />
            <div style={{ fontSize:40, marginBottom:16, lineHeight:1 }}>✍️</div>
            <div style={{ fontSize:20, fontWeight:700, color:'#fff', marginBottom:14, lineHeight:1.4 }}>
              팬오션은 <span style={{ color: C.gold2 }}>바다 위 모든 생명</span>을 책임집니다
            </div>
            <div style={{ fontSize:14, color:'rgba(255,255,255,.75)', lineHeight:1.8, maxWidth:640, margin:'0 auto 24px' }}>
              "팬오션의 모든 사업 활동에서 인명의 안전과 건강은 어떠한 경영 목표보다 우선합니다. 우리는 중대재해 Zero를 넘어, 모든 사고 예방과 건강한 근무 환경 조성을 위해 필요한 모든 자원을 아끼지 않겠습니다. 전 선원과 임직원이 오늘도 안전하게 항해하고 귀환하는 것이 팬오션 안전보건경영의 완성입니다."
            </div>
            <div style={{ borderTop:'1px solid rgba(255,255,255,.15)', paddingTop:20, color:'rgba(255,255,255,.5)', fontSize:12.5 }}>
              <strong style={{ color:'rgba(255,255,255,.8)' }}>팬오션주식회사 대표이사</strong> &nbsp;|&nbsp;
              선포일: 2025년 1월 2일 &nbsp;|&nbsp;
              <strong style={{ color:'rgba(255,255,255,.8)' }}>중대재해처벌법 이행 서약</strong>
            </div>
          </div>
        </div>

        <div style={{ height: 60 }} />
      </div>

      {/* ── 푸터 ─────────────────────────────── */}
      <footer style={{ background: C.navy, color:'rgba(255,255,255,.5)', textAlign:'center', padding:24, fontSize:12 }}>
        <strong style={{ color:'rgba(255,255,255,.8)' }}>팬오션주식회사 (Pan Ocean Co., Ltd.)</strong> &nbsp;|&nbsp;
        서울특별시 중구 통일로 92 케이지타워 &nbsp;|&nbsp;
        안전보건팀 &nbsp;|&nbsp; 2025년 안전보건 목표 · 연간 갱신
      </footer>
    </div>
  );
}
