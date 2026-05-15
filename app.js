/* ═══════════════════════════════════════════════════════
   IBM DataStage — Pre-Run Validation Suite
   app.js — Demo Orchestration Logic
   ═══════════════════════════════════════════════════════ */

'use strict';

// ── State ────────────────────────────────────────────────
let pipelineData = null;

// ── Upload Zone Setup ────────────────────────────────────
const uploadZone = document.getElementById('uploadZone');
const fileInput  = document.getElementById('fileInput');

uploadZone.addEventListener('click', () => fileInput.click());

uploadZone.addEventListener('dragover', e => {
  e.preventDefault();
  uploadZone.classList.add('dragover');
});
uploadZone.addEventListener('dragleave', () => uploadZone.classList.remove('dragover'));
uploadZone.addEventListener('drop', e => {
  e.preventDefault();
  uploadZone.classList.remove('dragover');
  const file = e.dataTransfer.files[0];
  if (file) handleFile(file);
});

fileInput.addEventListener('change', e => {
  const file = e.target.files[0];
  if (file) handleFile(file);
});

function handleFile(file) {
  if (!file.name.endsWith('.json')) {
    alert('Please upload a valid JSON file.');
    return;
  }

  const reader = new FileReader();
  reader.onload = evt => {
    try {
      pipelineData = JSON.parse(evt.target.result);
    } catch {
      pipelineData = { _raw: evt.target.result }; // fallback
    }
    renderLoadedFile(file, pipelineData);
  };
  reader.readAsText(file);
}

function renderLoadedFile(file, data) {
  // Show diagram
  const diag = document.getElementById('pipelineDiagram');
  diag.classList.remove('hidden');
  document.getElementById('loadedFileName').textContent = file.name;

  // Try to load bundled diagram image
  const img = document.getElementById('pipelineImg');
  img.onerror = () => {
    // If no image file, show a generated SVG placeholder
    document.getElementById('diagramOverlay').textContent = 'pipeline_diagram.png (place your image here)';
    img.src = generatePlaceholderDataURI();
  };

  // Meta pills
  const nodes  = countKeys(data, 'node');
  const stages = countKeys(data, 'stage');
  document.getElementById('metaNodes').textContent  = `${nodes || '—'} nodes`;
  document.getElementById('metaStages').textContent = `${stages || '—'} stages`;
  document.getElementById('metaSize').textContent   = `${(file.size / 1024).toFixed(1)} KB`;

  // JSON preview
  const preview = document.getElementById('jsonPreview');
  preview.classList.remove('hidden');
  document.getElementById('jsonContent').textContent =
    JSON.stringify(data, null, 2).slice(0, 3000) + (file.size > 3000 ? '\n… (truncated)' : '');

  // Enable button
  document.getElementById('validateBtn').disabled = false;
}

function countKeys(obj, keyword) {
  const str = JSON.stringify(obj || {});
  const matches = str.match(new RegExp(`"${keyword}"`, 'gi'));
  return matches ? matches.length : 0;
}

function toggleJson() {
  const pre  = document.getElementById('jsonContent');
  const btn  = document.getElementById('toggleJsonBtn');
  const show = pre.style.display === 'none';
  pre.style.display    = show ? 'block' : 'none';
  btn.textContent      = show ? 'Hide' : 'Show';
}

// ── Placeholder SVG pipeline diagram ────────────────────
function generatePlaceholderDataURI() {
  const svg = `<svg viewBox="0 0 880 280" xmlns="http://www.w3.org/2000/svg" style="font-family:'IBM Plex Mono',monospace">
    <rect width="880" height="280" fill="#F0F4FF"/>
    <!-- Nodes -->
    ${makePipelineNode(60,  120, 'SOURCE\nDB2', '#0F62FE')}
    ${makePipelineNode(230, 80,  'TRANSFORM\nFilter', '#0072C3')}
    ${makePipelineNode(230, 170, 'TRANSFORM\nJoin', '#0072C3')}
    ${makePipelineNode(420, 120, 'AGGREGATE\nGroup By', '#6929C4')}
    ${makePipelineNode(600, 80,  'VALIDATE\nSchema', '#005D5D')}
    ${makePipelineNode(600, 170, 'VALIDATE\nTypes', '#005D5D')}
    ${makePipelineNode(780, 120, 'TARGET\nDW Table', '#198038')}
    <!-- Edges -->
    <line x1="142" y1="120" x2="192" y2="100" stroke="#A8A8A8" stroke-width="2" marker-end="url(#arr)"/>
    <line x1="142" y1="120" x2="192" y2="180" stroke="#A8A8A8" stroke-width="2" marker-end="url(#arr)"/>
    <line x1="312" y1="90"  x2="372" y2="120" stroke="#A8A8A8" stroke-width="2" marker-end="url(#arr)"/>
    <line x1="312" y1="180" x2="372" y2="135" stroke="#A8A8A8" stroke-width="2" marker-end="url(#arr)"/>
    <line x1="502" y1="110" x2="562" y2="90"  stroke="#A8A8A8" stroke-width="2" marker-end="url(#arr)"/>
    <line x1="502" y1="130" x2="562" y2="175" stroke="#A8A8A8" stroke-width="2" marker-end="url(#arr)"/>
    <line x1="682" y1="90"  x2="742" y2="115" stroke="#A8A8A8" stroke-width="2" marker-end="url(#arr)"/>
    <line x1="682" y1="175" x2="742" y2="130" stroke="#A8A8A8" stroke-width="2" marker-end="url(#arr)"/>
    <defs>
      <marker id="arr" markerWidth="8" markerHeight="8" refX="4" refY="3" orient="auto">
        <path d="M0,0 L0,6 L8,3 z" fill="#A8A8A8"/>
      </marker>
    </defs>
    <!-- Label -->
    <text x="440" y="256" fill="#A8A8A8" font-size="11" text-anchor="middle" letter-spacing="2">IBM DATASTAGE PIPELINE — PLACEHOLDER DIAGRAM</text>
  </svg>`;

  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
}

function makePipelineNode(cx, cy, label, color) {
  const lines = label.split('\n');
  const rects = `<rect x="${cx-40}" y="${cy-26}" width="82" height="52" rx="5" fill="#FFFFFF" stroke="${color}" stroke-width="1.5"/>`;
  const texts = lines.map((l, i) => {
    const isFirst = i === 0;
    return `<text x="${cx}" y="${cy + (isFirst ? -8 : 12)}" fill="${isFirst ? color : '#393939'}" font-size="${isFirst ? 9 : 10}" text-anchor="middle" font-weight="${isFirst ? 600 : 400}" letter-spacing="1">${l}</text>`;
  }).join('');
  return rects + texts;
}

// ── Validation Steps Data ────────────────────────────────
const VALIDATION_STEPS = [
  {
    title: 'Pipeline Descriptor Parsing',
    desc:  'Parsing and deserializing the JSON pipeline definition',
    outputType: 'list',
    output: [
      'Pipeline format: IBM DataStage v11.7 descriptor',
      'Root keys detected: nodes, edges, metadata, config',
      'Encoding: UTF-8 · No BOM detected',
      'JSON schema version: 2.1.0',
      'Parser status: SUCCESS — no syntax errors',
    ]
  },
  {
    title: 'Node & Edge Graph Validation',
    desc:  'Validating directed acyclic graph structure',
    outputType: 'json',
    output: {
      graph_analysis: {
        total_nodes: 7,
        total_edges: 8,
        source_nodes: ["SOURCE_DB2"],
        sink_nodes: ["TARGET_DW_TABLE"],
        is_acyclic: true,
        max_depth: 4,
        isolated_nodes: []
      },
      status: "VALID"
    }
  },
  {
    title: 'Stage Type Recognition',
    desc:  'Checking all stage types against supported operator catalogue',
    outputType: 'list',
    output: [
      'DB2Connector v4.2 → SUPPORTED',
      'FilterStage v3.0 → SUPPORTED',
      'JoinStage v3.1 → SUPPORTED',
      'AggregateStage v2.5 → SUPPORTED',
      'SchemaValidator v1.8 → SUPPORTED',
      'DataTypeCheck v2.0 → SUPPORTED',
      'DWConnector v4.2 → SUPPORTED',
    ]
  },
  {
    title: 'Schema & Column Mapping',
    desc:  'Validating column lineage and type compatibility across all stages',
    outputType: 'json',
    output: {
      columns_validated: 34,
      type_mismatches: 0,
      nullable_violations: 1,
      unresolved_references: 0,
      warnings: [
        "Column 'order_ts' is nullable at SOURCE but NOT NULL in TARGET — coalesce recommended"
      ]
    }
  },
  {
    title: 'Parameter & Expression Check',
    desc:  'Evaluating runtime parameters, SQL expressions, and derivation formulas',
    outputType: 'list',
    output: [
      'Runtime parameters: 12 defined · 12 resolved',
      'SQL expressions: 4 validated · 0 parse errors',
      'Derivation formulas: 7 validated · 0 type errors',
      'Lookup conditions: 3 validated · 0 missing keys',
      'Expression sandbox: all passed',
    ]
  },
];

// ── Pre-Execution Steps Data ─────────────────────────────
const PRE_EXEC_STEPS = [
  {
    title: 'Data Source Connectivity',
    desc:  'Testing live connectivity to all source and target systems',
    outputType: 'list',
    output: [
      'DB2 PROD (db2.ibm.internal:50000) → CONNECTED · Latency: 12ms',
      'Oracle DW (dw.ibm.internal:1521) → CONNECTED · Latency: 18ms',
      'S3 Staging (s3://ibm-etl-staging) → CONNECTED · Latency: 45ms',
      'Kafka Broker (kafka.ibm.internal:9092) → CONNECTED',
      'All 4 connections healthy',
    ]
  },
  {
    title: 'Data Volume & Null Profiling',
    desc:  'Sampling source tables for volume estimation and null distribution',
    outputType: 'json',
    output: {
      source_table: "ORDERS_FACT",
      row_count_estimate: 4820310,
      sampled_rows: 50000,
      columns_profiled: 18,
      null_rates: {
        "order_id": "0.00%",
        "customer_id": "0.02%",
        "order_ts": "1.14%",
        "amount": "0.00%",
        "region_code": "3.47%"
      },
      anomalies_detected: ["region_code null rate (3.47%) exceeds threshold of 2%"]
    }
  },
  {
    title: 'Constraint & Referential Integrity',
    desc:  'Verifying primary key uniqueness and foreign key consistency',
    outputType: 'json',
    output: {
      pk_uniqueness: { ORDERS_FACT: "PASS", CUSTOMER_DIM: "PASS", PRODUCT_DIM: "PASS" },
      fk_violations: { "ORDERS_FACT → CUSTOMER_DIM": 0, "ORDERS_FACT → PRODUCT_DIM": 2 },
      duplicate_rows: 0,
      total_violations: 2,
      severity: "WARNING"
    }
  },
  {
    title: 'Infrastructure Resource Check',
    desc:  'Evaluating compute, memory, and I/O availability on DataStage engine',
    outputType: 'list',
    output: [
      'DataStage Engine Node: engine-01.ibm.internal → ONLINE',
      'Available CPU: 24 cores (of 32) → SUFFICIENT',
      'Available Memory: 118 GB (of 256 GB) → SUFFICIENT',
      'Scratch Disk Space: 2.1 TB available → SUFFICIENT',
      'Parallel degree: 8 partitions recommended',
      'Conductor node: healthy · No active job conflicts',
    ]
  },
  {
    title: 'Execution Readiness Summary',
    desc:  'Aggregating all pre-execution results into a go/no-go decision',
    outputType: 'json',
    output: {
      schema_validation: "PASS",
      connectivity: "PASS",
      data_volume: "PASS",
      null_profiling: "WARNING",
      constraint_checks: "WARNING",
      infrastructure: "PASS",
      decision: "PROCEED WITH CAUTION",
      notes: [
        "2 FK violations in ORDERS_FACT — review before full load",
        "region_code null rate slightly above threshold"
      ]
    }
  }
];

// ── Validation Checks ────────────────────────────────────
const VALIDATION_CHECKS = [
  { name: 'JSON Syntax Valid',           detail: 'RFC 8259 compliant',       status: 'pass' },
  { name: 'Graph is Acyclic (DAG)',      detail: 'No cyclic dependencies',   status: 'pass' },
  { name: 'All Stages Recognised',       detail: '7/7 stages supported',     status: 'pass' },
  { name: 'Column Type Compatibility',   detail: '34 columns checked',       status: 'pass' },
  { name: 'Nullable Constraint',         detail: '1 warning — order_ts',     status: 'warn' },
  { name: 'Runtime Parameters Resolved', detail: '12/12 resolved',           status: 'pass' },
  { name: 'SQL Expression Parse',        detail: '4/4 valid',                status: 'pass' },
  { name: 'Unresolved Column Refs',      detail: '0 found',                  status: 'pass' },
  { name: 'Sink Node Reachability',      detail: 'All paths reach sink',     status: 'pass' },
  { name: 'Schema Version Compatible',   detail: 'v2.1.0 → engine v11.7',   status: 'pass' },
];

const PRE_EXEC_CHECKS = [
  { name: 'Source DB2 Connectivity',     detail: '12ms RTT',                 status: 'pass' },
  { name: 'Target DW Connectivity',      detail: '18ms RTT',                 status: 'pass' },
  { name: 'S3 Staging Access',           detail: '45ms RTT',                 status: 'pass' },
  { name: 'PK Uniqueness — ORDERS',      detail: '0 duplicates',             status: 'pass' },
  { name: 'FK Integrity — PRODUCT_DIM',  detail: '2 violations found',       status: 'warn' },
  { name: 'Null Rate — region_code',     detail: '3.47% > 2% threshold',     status: 'warn' },
  { name: 'CPU Headroom',                detail: '24/32 cores free',         status: 'pass' },
  { name: 'Memory Headroom',             detail: '118 GB free',              status: 'pass' },
  { name: 'Scratch Disk',                detail: '2.1 TB available',         status: 'pass' },
  { name: 'No Conflicting Jobs',         detail: 'Engine queue clear',       status: 'pass' },
];

// ── Icon helpers ─────────────────────────────────────────
function iconRunning() {
  return `<svg class="step-status-icon" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="11" cy="11" r="9" stroke="#1192E8" stroke-width="1.5" stroke-dasharray="4 3"
      style="animation:spin 1s linear infinite;transform-origin:center"/>
  </svg>`;
}
function iconComplete() {
  return `<svg class="step-status-icon" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="11" cy="11" r="9" stroke="#42BE65" stroke-width="1.5"/>
    <path d="M7 11L9.5 13.5L15 8" stroke="#42BE65" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`;
}
function iconWarn() {
  return `<svg class="step-status-icon" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M11 3L20 19H2L11 3Z" stroke="#F1C21B" stroke-width="1.5" stroke-linejoin="round"/>
    <path d="M11 9V13" stroke="#F1C21B" stroke-width="1.5" stroke-linecap="round"/>
    <circle cx="11" cy="16" r="0.75" fill="#F1C21B"/>
  </svg>`;
}
function checkIconForStatus(s) {
  if (s === 'pass') return `<svg viewBox="0 0 20 20" fill="none" width="18" height="18"><circle cx="10" cy="10" r="8" stroke="#42BE65" stroke-width="1.5"/><path d="M6.5 10L8.5 12L13.5 7" stroke="#42BE65" stroke-width="1.5" stroke-linecap="round"/></svg>`;
  if (s === 'warn') return `<svg viewBox="0 0 20 20" fill="none" width="18" height="18"><path d="M10 2L18.5 17H1.5L10 2Z" stroke="#F1C21B" stroke-width="1.5" stroke-linejoin="round"/><path d="M10 8V12" stroke="#F1C21B" stroke-width="1.5" stroke-linecap="round"/></svg>`;
  return `<svg viewBox="0 0 20 20" fill="none" width="18" height="18"><circle cx="10" cy="10" r="8" stroke="#FA4D56" stroke-width="1.5"/><path d="M7 7L13 13M13 7L7 13" stroke="#FA4D56" stroke-width="1.5" stroke-linecap="round"/></svg>`;
}

// ── Render step output ───────────────────────────────────
function renderOutput(step) {
  if (step.outputType === 'list') {
    return `<ul>${step.output.map(i => `<li>${i}</li>`).join('')}</ul>`;
  }
  return `<pre>${JSON.stringify(step.output, null, 2)}</pre>`;
}

// ── Build step DOM ───────────────────────────────────────
function buildStepEl(step, idx, statusClass) {
  const id = `step-body-${idx}`;
  const badge = statusClass === 'running' ? 'RUNNING'
              : (step.output && step.output.severity === 'WARNING') || 
                (step.output && step.output.anomalies_detected) ? 'WARNING'
              : 'COMPLETE';
  const badgeClass = badge === 'RUNNING' ? 'running' : badge === 'WARNING' ? 'warning' : 'complete';
  const icon = badge === 'RUNNING' ? iconRunning() : badge === 'WARNING' ? iconWarn() : iconComplete();

  const div = document.createElement('div');
  div.className = 'step-item';
  div.innerHTML = `
    <div class="step-item-header" onclick="toggleStep('${id}')">
      ${icon}
      <span class="step-item-title">${step.title}</span>
      <span class="step-badge ${badgeClass}">${badge}</span>
      <svg class="step-chevron" id="chev-${id}" viewBox="0 0 16 16" fill="none">
        <path d="M4 6L8 10L12 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
      </svg>
    </div>
    <div class="step-item-body" id="${id}">
      <div class="step-output">${badge === 'RUNNING' ? '<p style="color:var(--text-muted);font-size:13px">Processing…</p>' : renderOutput(step)}</div>
    </div>
  `;
  return div;
}

function toggleStep(id) {
  const body = document.getElementById(id);
  const chev = document.getElementById('chev-' + id);
  const open = body.classList.toggle('open');
  chev.classList.toggle('open', open);
}

// ── Spinner messages ─────────────────────────────────────
const SPINNER_MSGS = [
  'Parsing pipeline descriptor…',
  'Resolving stage dependencies…',
  'Building execution graph…',
];
let spinnerIdx = 0, spinnerInterval;

function startSpinnerCycle(elId, msgs) {
  const el = document.getElementById(elId);
  let i = 0;
  el.textContent = msgs[0];
  return setInterval(() => { i = (i + 1) % msgs.length; el.textContent = msgs[i]; }, 900);
}

// ── Start Validation ─────────────────────────────────────
function startValidation() {
  const sec = document.getElementById('section-validation');
  sec.classList.remove('hidden');
  sec.scrollIntoView({ behavior: 'smooth', block: 'start' });

  const si = startSpinnerCycle('spinnerText', SPINNER_MSGS);

  setTimeout(() => {
    clearInterval(si);
    document.getElementById('spinnerBlock').classList.add('hidden');
    runAnalysisSteps();
  }, 3000);
}

async function runAnalysisSteps() {
  const list = document.getElementById('stepsList');
  list.classList.remove('hidden');

  for (let i = 0; i < VALIDATION_STEPS.length; i++) {
    const step = VALIDATION_STEPS[i];
    const el = buildStepEl(step, i, 'running');
    list.appendChild(el);
    await delay(1000);

    // Upgrade to complete
    const id = `step-body-${i}`;
    const header = el.querySelector('.step-item-header');
    const badgeClass = (step.output && (step.output.nullable_violations || step.output.warnings)) ? 'warning' : 'complete';
    const icon = badgeClass === 'warning' ? iconWarn() : iconComplete();
    const badgeLabel = badgeClass === 'warning' ? 'WARNING' : 'COMPLETE';

    header.innerHTML = `
      ${icon}
      <span class="step-item-title">${step.title}</span>
      <span class="step-badge ${badgeClass}">${badgeLabel}</span>
      <svg class="step-chevron" id="chev-${id}" viewBox="0 0 16 16" fill="none">
        <path d="M4 6L8 10L12 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
      </svg>
    `;
    // re-bind click
    header.setAttribute('onclick', `toggleStep('${id}')`);

    // Fill body
    const body = document.getElementById(id);
    body.querySelector('.step-output').innerHTML = renderOutput(step);

    // Auto-open first
    if (i === 0) { body.classList.add('open'); document.getElementById('chev-' + id)?.classList.add('open'); }

    await delay(400);
  }

  await delay(500);
  showValidationReport();
}

// ── Validation Report ────────────────────────────────────
function showValidationReport() {
  const sec = document.getElementById('section-val-report');
  sec.classList.remove('hidden');
  sec.scrollIntoView({ behavior: 'smooth', block: 'start' });

  const pass  = VALIDATION_CHECKS.filter(c => c.status === 'pass').length;
  const warn  = VALIDATION_CHECKS.filter(c => c.status === 'warn').length;
  const fail  = VALIDATION_CHECKS.filter(c => c.status === 'fail').length;
  const total = VALIDATION_CHECKS.length;

  const content = document.getElementById('valReportContent');
  content.innerHTML = `
    <div class="report-summary">
      <div class="report-stat stat-total"><div class="stat-val">${total}</div><div class="stat-label">TOTAL CHECKS</div></div>
      <div class="report-stat stat-pass"><div class="stat-val">${pass}</div><div class="stat-label">PASSED</div></div>
      <div class="report-stat stat-warn"><div class="stat-val">${warn}</div><div class="stat-label">WARNINGS</div></div>
      <div class="report-stat stat-fail"><div class="stat-val">${fail}</div><div class="stat-label">FAILED</div></div>
    </div>
    <div class="report-checks">
      ${VALIDATION_CHECKS.map((c, i) => `
        <div class="report-check-row" style="animation-delay:${i * 60}ms">
          <div class="check-icon">${checkIconForStatus(c.status)}</div>
          <div class="check-name">${c.name}</div>
          <div class="check-detail">${c.detail}</div>
          <div class="check-status ${c.status}">${c.status.toUpperCase()}</div>
        </div>
      `).join('')}
    </div>
  `;

  const action = document.getElementById('valReportAction');
  action.innerHTML = `
    <button class="btn-primary" onclick="startPreExec()">
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M3 9H15M9 3L15 9L9 15" stroke="white" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
      Proceed to Pre-Execution Checks
    </button>
    <button class="btn-secondary" onclick="window.scrollTo({top:0,behavior:'smooth'})">
      Revise Pipeline
    </button>
  `;
}

// ── Pre-Execution ────────────────────────────────────────
function startPreExec() {
  const sec = document.getElementById('section-preexec');
  sec.classList.remove('hidden');
  sec.scrollIntoView({ behavior: 'smooth', block: 'start' });

  const spinner = document.getElementById('preExecSpinner');
  spinner.classList.remove('hidden');

  const PRE_SPINNER_MSGS = [
    'Connecting to data sources…',
    'Sampling source tables…',
    'Probing infrastructure nodes…',
  ];
  const si = startSpinnerCycle('preExecSpinnerText', PRE_SPINNER_MSGS);

  setTimeout(() => {
    clearInterval(si);
    spinner.classList.add('hidden');
    runPreExecSteps();
  }, 3000);
}

async function runPreExecSteps() {
  const list = document.getElementById('preExecStepsList');
  list.classList.remove('hidden');

  for (let i = 0; i < PRE_EXEC_STEPS.length; i++) {
    const step = PRE_EXEC_STEPS[i];
    const el = buildStepEl(step, `pe${i}`, 'running');
    list.appendChild(el);
    await delay(1100);

    const id = `step-body-pe${i}`;
    const header = el.querySelector('.step-item-header');

    const hasWarn = step.output && (
      step.output.anomalies_detected?.length ||
      (step.output.fk_violations && Object.values(step.output.fk_violations).some(v => v > 0)) ||
      step.output.severity === 'WARNING'
    );
    const badgeClass = hasWarn ? 'warning' : 'complete';
    const icon = hasWarn ? iconWarn() : iconComplete();
    const badgeLabel = hasWarn ? 'WARNING' : 'COMPLETE';

    header.innerHTML = `
      ${icon}
      <span class="step-item-title">${step.title}</span>
      <span class="step-badge ${badgeClass}">${badgeLabel}</span>
      <svg class="step-chevron" id="chev-${id}" viewBox="0 0 16 16" fill="none">
        <path d="M4 6L8 10L12 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
      </svg>
    `;
    header.setAttribute('onclick', `toggleStep('${id}')`);
    document.getElementById(id).querySelector('.step-output').innerHTML = renderOutput(step);
    await delay(350);
  }

  await delay(500);
  showPreExecReport();
}

// ── Pre-Exec Report ──────────────────────────────────────
function showPreExecReport() {
  const sec = document.getElementById('section-preexec-report');
  sec.classList.remove('hidden');
  sec.scrollIntoView({ behavior: 'smooth', block: 'start' });

  const pass  = PRE_EXEC_CHECKS.filter(c => c.status === 'pass').length;
  const warn  = PRE_EXEC_CHECKS.filter(c => c.status === 'warn').length;
  const fail  = PRE_EXEC_CHECKS.filter(c => c.status === 'fail').length;
  const total = PRE_EXEC_CHECKS.length;

  const content = document.getElementById('preExecReportContent');
  content.innerHTML = `
    <div class="report-summary">
      <div class="report-stat stat-total"><div class="stat-val">${total}</div><div class="stat-label">TOTAL CHECKS</div></div>
      <div class="report-stat stat-pass"><div class="stat-val">${pass}</div><div class="stat-label">PASSED</div></div>
      <div class="report-stat stat-warn"><div class="stat-val">${warn}</div><div class="stat-label">WARNINGS</div></div>
      <div class="report-stat stat-fail"><div class="stat-val">${fail}</div><div class="stat-label">FAILED</div></div>
    </div>
    <div class="report-checks">
      ${PRE_EXEC_CHECKS.map((c, i) => `
        <div class="report-check-row" style="animation-delay:${i * 60}ms">
          <div class="check-icon">${checkIconForStatus(c.status)}</div>
          <div class="check-name">${c.name}</div>
          <div class="check-detail">${c.detail}</div>
          <div class="check-status ${c.status}">${c.status.toUpperCase()}</div>
        </div>
      `).join('')}
    </div>
    <div style="margin-top:16px;padding:14px 20px;background:rgba(241,194,27,0.07);border:1px solid rgba(241,194,27,0.2);border-radius:6px;font-size:13px;color:#F1C21B;font-family:var(--font-mono)">
      ⚠ 2 warnings detected — review FK violations and null rate before proceeding.
    </div>
  `;

  const action = document.getElementById('preExecAction');
  action.innerHTML = `
    <button class="btn-primary" onclick="showRunSection()">
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M4 4L14 9L4 14V4Z" fill="white"/></svg>
      Proceed to Pipeline Execution
    </button>
  `;
}

// ── Run Section ──────────────────────────────────────────
function showRunSection() {
  const sec = document.getElementById('section-run');
  sec.classList.remove('hidden');
  sec.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

const RUN_LOG_LINES = [
  { t: '00:00:01', cls: 'log-info', msg: 'Initialising DataStage Engine (engine-01.ibm.internal)' },
  { t: '00:00:02', cls: 'log-info', msg: 'Allocating 8 parallel partitions · 24 CPU cores reserved' },
  { t: '00:00:03', cls: 'log-ok',   msg: 'SOURCE_DB2 — reading ORDERS_FACT (4,820,310 rows estimated)' },
  { t: '00:00:04', cls: 'log-info', msg: 'FilterStage — applying predicate: region IN (\'APAC\', \'EMEA\')' },
  { t: '00:00:05', cls: 'log-ok',   msg: 'FilterStage — 3,218,045 rows passed filter' },
  { t: '00:00:07', cls: 'log-info', msg: 'JoinStage — joining with CUSTOMER_DIM on customer_id' },
  { t: '00:00:09', cls: 'log-ok',   msg: 'JoinStage — 3,217,987 rows matched · 58 unmatched (logged)' },
  { t: '00:00:11', cls: 'log-info', msg: 'AggregateStage — grouping by region, product_category, quarter' },
  { t: '00:00:14', cls: 'log-ok',   msg: 'AggregateStage — 1,248 aggregate rows produced' },
  { t: '00:00:15', cls: 'log-info', msg: 'SchemaValidator — validating 34 output columns' },
  { t: '00:00:16', cls: 'log-ok',   msg: 'SchemaValidator — all columns PASS' },
  { t: '00:00:17', cls: 'log-info', msg: 'DWConnector — writing to TARGET_DW_TABLE (batch mode)' },
  { t: '00:00:21', cls: 'log-ok',   msg: '1,248 rows committed to DW · 0 rejected' },
  { t: '00:00:22', cls: 'log-done', msg: '✓ Pipeline COMPLETE — Total time: 21s · Rows written: 1,248' },
];

async function runPipeline() {
  const btn = document.querySelector('.btn-run');
  btn.disabled = true;
  btn.innerHTML = `<svg width="18" height="18" viewBox="0 0 18 18" fill="none"><circle cx="9" cy="9" r="7" stroke="white" stroke-width="1.5" stroke-dasharray="4 3" style="animation:spin 0.8s linear infinite;transform-origin:center"/></svg> Running…`;

  const output = document.getElementById('runOutput');
  const log    = document.getElementById('runLog');
  output.classList.remove('hidden');

  // Update header dot to show running
  output.querySelector('.run-progress-header').innerHTML =
    `<span class="dot-live"></span>Pipeline executing in production environment…`;

  for (const line of RUN_LOG_LINES) {
    await delay(600);
    const row = document.createElement('div');
    row.className = 'log-line';
    row.innerHTML = `<span class="log-time">${line.t}</span><span class="${line.cls}">${line.msg}</span>`;
    log.appendChild(row);
    log.scrollTop = log.scrollHeight;
  }

  // ── Pipeline finished ──────────────────────────────
  await delay(500);

  // Update the header to "Completed"
  output.querySelector('.run-progress-header').innerHTML =
    `<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="6" stroke="#198038" stroke-width="1.5"/><path d="M4 7L6 9L10 5" stroke="#198038" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
     <span style="color:#198038;font-weight:500">Execution completed successfully</span>`;

  // Update the run button
  btn.style.background = '#198038';
  btn.innerHTML = `<svg width="18" height="18" viewBox="0 0 18 18" fill="none"><circle cx="9" cy="9" r="7" stroke="white" stroke-width="1.5"/><path d="M6 9L8 11L12 7" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg> Pipeline Complete`;

  // Show completion banner
  const section = document.getElementById('section-run');
  const banner = document.createElement('div');
  banner.className = 'run-complete-banner';
  banner.innerHTML = `
    <div class="complete-icon">
      <svg viewBox="0 0 52 52" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="26" cy="26" r="24" stroke="#198038" stroke-width="2"/>
        <path d="M16 26L22 32L36 18" stroke="#198038" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </div>
    <div>
      <h3>Pipeline Execution Successful</h3>
      <p>All stages completed · 0 errors · 1,248 rows written to TARGET_DW_TABLE</p>
    </div>
  `;
  section.querySelector('.card-action').after(banner);

  // Show execution stats
  const stats = document.createElement('div');
  stats.className = 'run-stats-row';
  stats.innerHTML = `
    <div class="run-stat-item"><span>TOTAL RUNTIME</span><strong>21s</strong></div>
    <div class="run-stat-item"><span>ROWS PROCESSED</span><strong>4,820,310</strong></div>
    <div class="run-stat-item"><span>ROWS WRITTEN</span><strong>1,248</strong></div>
    <div class="run-stat-item"><span>ROWS REJECTED</span><strong>0</strong></div>
    <div class="run-stat-item"><span>PARTITIONS USED</span><strong>8</strong></div>
    <div class="run-stat-item"><span>TARGET</span><strong>DB2 DW · PROD</strong></div>
  `;
  banner.after(stats);
  stats.scrollIntoView({ behavior: 'smooth', block: 'end' });
}

// ── Utilities ────────────────────────────────────────────
function delay(ms) {
  return new Promise(res => setTimeout(res, ms));
}
