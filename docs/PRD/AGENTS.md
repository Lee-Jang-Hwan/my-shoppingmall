# PRD Generation Agent Orchestrator

## Overview
이 에이전트는 MRD(Market Requirements Document)로부터 PRD(Product Requirements Document)를 자동으로 생성하는 일련의 전문 분석 규칙을 조율합니다.

## Prerequisites
- MRD 문서가 `MRD-Document.md` 또는 `mrd-output/final/MRD-Document.md`로 제공
- Perplexity MCP가 경쟁사 조사를 위해 구성됨 (설정되지 않은 경우 Tavily MCP 사용)
- Playwright MCP가 사용자 조사 시뮬레이션을 위해 구성됨 (선택사항)
- 모든 규칙 파일이 `.cursor/rules/` 디렉토리에 존재
- **출력 언어**: 한국어
- **형식 규칙**: 이모지 사용 금지

## Project Structure
```
.cursor/
├── rules/
│   ├── 01-analyze-mrd.md
│   ├── 02-competitor-analysis.md
│   ├── 03-user-research.md
│   ├── 04-user-stories.md
│   ├── 05-technical-requirements.md
│   ├── 06-success-metrics.md
│   └── 07-generate-prd.md
├── prd-output/
│   ├── analysis/           # 중간 분석 결과
│   │   ├── mrd-analysis.md
│   │   ├── competitor-analysis.md
│   │   ├── user-research.md
│   │   ├── user-stories.md
│   │   ├── technical-requirements.md
│   │   └── success-metrics.md
│   ├── versions/          # 버전 관리
│   └── final/
│       └── PRD-Document.md  # 최종 PRD (한국어)

### Phase 1: Foundation Analysis
Execute these rules sequentially to build the knowledge base:

1. **MRD Analysis** (`.cursor/rules/01-analyze-mrd.md`)
   - Input: `@MRD-Document.md`
   - Output: Structured analysis of market requirements
   - Store as: `analysis/mrd-analysis.md`

2. **Competitor Analysis** (`.cursor/rules/02-competitor-analysis.md`)
   - Input: MRD analysis + Perplexity web research
   - Output: Competitive landscape and differentiation opportunities
   - Store as: `analysis/competitor-analysis.md`
   - Note: Use Perplexity MCP to research each competitor

### Phase 2: User-Centric Design
Build user understanding and requirements:

3. **User Research** (`.cursor/rules/03-user-research.md`)
   - Input: Target segments from MRD analysis
   - Output: User personas, interview questions, journey maps
   - Store as: `analysis/user-research.md`

4. **User Stories** (`.cursor/rules/04-user-stories.md`)
   - Input: User personas and identified problems
   - Output: Epics, user stories, acceptance criteria
   - Store as: `analysis/user-stories.md`

### Phase 3: Technical Specification
Define technical implementation details:

5. **Technical Requirements** (`.cursor/rules/05-technical-requirements.md`)
   - Input: User stories and MRD constraints
   - Output: Architecture, NFRs, API specifications
   - Store as: `analysis/technical-requirements.md`

6. **Success Metrics** (`.cursor/rules/06-success-metrics.md`)
   - Input: Business objectives and user stories
   - Output: KPIs, measurement framework
   - Store as: `analysis/success-metrics.md`

### Phase 4: Document Generation
Compile all analyses into final PRD:

7. **Generate PRD** (`.cursor/rules/07-generate-prd.md`)
   - Input: All previous analysis outputs
   - Output: Complete PRD document
   - Store as: `PRD-Document.md`

## Agent Commands

### Full PRD Generation
To generate a complete PRD from MRD:
```
Execute all rules in sequence (01-07)
Compile outputs into final PRD
```

### Partial Updates
To update specific sections:
```
Execute relevant rule(s)
Update corresponding PRD section
```

### Quick Analysis
For rapid prototyping:
```
Execute rules 01, 03, 04 only
Generate simplified PRD
```

## Context Management

### File References
항상 올바른 파일 참조를 사용하세요:
- `@MRD-Document.md` 또는 `@mrd-output/final/MRD-Document.md` - 소스 문서
- `@.cursor/rules/PRD/prd-output/analysis/*.md` - 중간 결과물
- `@.cursor/rules/PRD/prd-output/final/PRD-Document.md` - 최종 결과물

### Variable Tracking
분석 전반에 걸쳐 일관성 유지:
- 제품명
- 타겟 페르소나
- 핵심 지표
- 기술적 제약사항

## Quality Assurance

### Validation Points
After each phase, verify:
1. **Completeness**: All required sections populated
2. **Consistency**: Information aligns across sections
3. **Clarity**: No ambiguous requirements
4. **Feasibility**: Technical requirements achievable
5. **Measurability**: Success metrics are quantifiable

### Error Handling
If any step fails:
1. Check input file availability
2. Verify MCP service connectivity
3. Review previous step outputs
4. Re-run failed step with debug output

## Output Standards (출력 표준)

### Formatting Rules (형식 규칙)
- 모든 출력물은 마크다운 사용
- **이모지 사용 금지**
- 명확한 계층 구조 유지
- 일관된 용어 사용
- 전문적이고 간결한 한국어 사용

### Document Sections (문서 구성)
최종 PRD는 다음 섹션을 포함해야 합니다:
1. 요약 (Executive Summary)
2. 제품 개요 (Product Overview)
3. 사용자 분석 (User Analysis)
4. 문제 정의 (Problem Statement)
5. 솔루션 설계 (Solution Design)
6. 기술 요구사항 (Technical Requirements)
7. 성공 지표 (Success Metrics)
8. 경쟁 분석 (Competitive Analysis)
9. 리스크 및 의존성 (Risks & Dependencies)
10. 구현 로드맵 (Implementation Roadmap)

### Language Requirements (언어 요구사항)
- **주 언어**: 한국어
- **기술 용어**: 필요시 영문 병기
  - 예: "사용자 스토리 (User Story)"
  - 예: "비기능 요구사항 (NFR)"
- **숫자 표기**: 한국식 표기법 준수
- **날짜 형식**: YYYY년 MM월 DD일

## Automation Tips

### Cursor Commands
Cursor의 Cmd+K (Mac) 또는 Ctrl+K (Windows)를 사용하여:
- 특정 섹션에 규칙 적용
- 템플릿을 기반으로 컨텐츠 생성
- 문서 간 상호 참조

### Batch Processing
여러 제품을 위해:
1. 개별 MRD 파일 생성
2. 각 MRD에 대해 에이전트 실행
3. 고유한 이름으로 PRD 저장

### Iterative Refinement
초기 PRD 생성 후:
1. 이해관계자와 검토
2. 필요시 MRD 업데이트
3. 특정 규칙 재실행
4. 영향받은 PRD 섹션 재생성

## Integration with MRD Workflow (MRD 워크플로우 통합)

### MRD Document Sources
MRD 문서를 다음 위치에서 찾을 수 있습니다:
1. **표준 위치**: `MRD-Document.md`
2. **MRD 워크플로우 출력**: `mrd-output/final/MRD-Document.md`
3. **통합 문서**: `mrd-output/final/MRD-Integrated.md`

### Data Integration
MRD 워크플로우에서 생성된 데이터 활용:
```
mrd-output/data/
├── market-data.json       # 시장 분석 데이터
├── personas.json          # 페르소나 데이터
├── problems.json          # 문제 정의 데이터
├── competitors.json       # 경쟁사 데이터
├── solutions.json         # 솔루션 데이터
├── metrics.json          # 메트릭 데이터
└── master-data.json      # 통합 데이터
```

### Workflow Connection
```bash
# MRD 완료 후 PRD 시작
# 1. MRD 생성 완료 확인
ls mrd-output/final/MRD-Document.md

# 2. PRD 워크플로우 시작
cursor .cursor/rules/AGENTS.md

# 3. MRD 데이터 참조
@mrd-output/data/master-data.json 활용하여 PRD 생성
```

### Rule Updates
When updating rules:
1. Test on sample MRD first
2. Version control all changes
3. Document rule modifications
4. Update this orchestrator if workflow changes

### Performance Optimization
For faster execution:
- Cache competitor research results
- Reuse user personas across similar products
- Batch API calls to MCP services
- Use incremental updates vs full regeneration

## Support

### Troubleshooting
Common issues and solutions:
- **Missing sections**: Check if all rules executed
- **Inconsistent data**: Verify MRD completeness
- **API limits**: Implement rate limiting for MCP calls
- **Large documents**: Split into smaller chunks

### Extension Points
This system can be extended with:
- Additional analysis rules
- Custom MCP integrations
- Automated testing frameworks
- Version control integration
- Collaborative review workflows