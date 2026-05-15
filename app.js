/* ═══════════════════════════════════════════════════════
   BEACON Validation Suite
   app.js — Demo Orchestration Logic
   ═══════════════════════════════════════════════════════ */

'use strict';

// ── State ────────────────────────────────────────────────
let pipelineData = null;
let revisedPipelineLoaded = false; // tracks if revise uploaded a new file

// ── Upload Zone Setup ────────────────────────────────────
const uploadZone = document.getElementById('uploadZone');
const fileInput  = document.getElementById('fileInput');

// Only open file dialog when clicking the zone itself, NOT when
// a child element (like the browse button) already handles it.
uploadZone.addEventListener('click', e => {
  // If the click came from the browse button, it calls fileInput.click()
  // directly — don't double-trigger here.
  if (e.target.closest('.btn-browse')) return;
  fileInput.click();
});

// The "browse files" button inside the zone
const browseLinkBtn = document.getElementById('browseLinkBtn');
if (browseLinkBtn) {
  browseLinkBtn.addEventListener('click', e => {
    e.stopPropagation(); // prevent bubbling to uploadZone
    fileInput.click();
  });
}

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
  if (file) handleFile(file, revisedPipelineLoaded);
  // Reset so re-selecting same file still fires 'change'
  fileInput.value = '';
});

function handleFile(file, isRevise = false) {
  if (!file.name.endsWith('.json')) {
    alert('Please upload a valid JSON file.');
    return;
  }

  const reader = new FileReader();
  reader.onload = evt => {
    try {
      pipelineData = JSON.parse(evt.target.result);
    } catch {
      pipelineData = { _raw: evt.target.result };
    }
    if (isRevise) {
      renderRevisedFile(file, pipelineData);
    } else {
      renderLoadedFile(file, pipelineData);
    }
  };
  reader.readAsText(file);
}

// ── Revise Pipeline: trigger file upload immediately ───────
function revisePipeline() {
  revisedPipelineLoaded = true;

  // Hide & clear all downstream sections
  ['section-validation', 'section-val-report', 'section-preexec', 'section-preexec-report', 'section-run'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.add('hidden');
  });

  // Clear dynamically injected content
  const stepsList = document.getElementById('stepsList');
  if (stepsList) {
    stepsList.innerHTML = '';
    stepsList.classList.add('hidden');
  }
  
  const spinnerBlock = document.getElementById('spinnerBlock');
  if (spinnerBlock) spinnerBlock.classList.remove('hidden');

  const preExecStepsList = document.getElementById('preExecStepsList');
  if (preExecStepsList) {
    preExecStepsList.innerHTML = '';
    preExecStepsList.classList.add('hidden');
  }
  
  const preExecSpinner = document.getElementById('preExecSpinner');
  if (preExecSpinner) preExecSpinner.classList.add('hidden');

  const valReportContent = document.getElementById('valReportContent');
  if (valReportContent) valReportContent.innerHTML = '';
  
  const valReportAction = document.getElementById('valReportAction');
  if (valReportAction) valReportAction.innerHTML = '';
  
  const preExecReportContent = document.getElementById('preExecReportContent');
  if (preExecReportContent) preExecReportContent.innerHTML = '';
  
  const preExecAction = document.getElementById('preExecAction');
  if (preExecAction) preExecAction.innerHTML = '';

  // Re-show upload zone for a new file
  const fileInfoSection = document.getElementById('fileInfoSection');
  if (fileInfoSection) fileInfoSection.classList.add('hidden');
  
  const pipelineDiagramPanel = document.getElementById('pipelineDiagramPanel');
  if (pipelineDiagramPanel) pipelineDiagramPanel.classList.add('hidden');
  
  const jsonSidebar = document.getElementById('jsonSidebar');
  if (jsonSidebar) jsonSidebar.classList.add('hidden');
  
  const validateBtn = document.getElementById('validateBtn');
  if (validateBtn) validateBtn.disabled = true;

  // Scroll back to upload section
  const uploadSection = document.getElementById('section-upload');
  if (uploadSection) {
    uploadSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  // Trigger file input for a new file
  // Use setTimeout to ensure the click happens after any UI updates and scroll
  setTimeout(() => {
    if (fileInput) {
      console.log('Triggering file input dialog...');
      fileInput.click();
    } else {
      console.error('File input element not found!');
    }
  }, 300);
}

// After a revised file is loaded, show it AND the two-option action bar
function renderRevisedFile(file, data) {
  revisedPipelineLoaded = false;
  renderLoadedFile(file, data);

  // Show message and two-button action bar in the sidebar
  const fileInfoSection = document.getElementById('fileInfoSection');
  
  // Add a message below the file info
  let msgDiv = document.getElementById('fixPipelineMsg');
  if (!msgDiv) {
    msgDiv = document.createElement('div');
    msgDiv.id = 'fixPipelineMsg';
    msgDiv.style.cssText = 'padding: 12px; background: rgba(15,98,254,0.05); border: 1px solid rgba(15,98,254,0.2); border-radius: 4px; font-size: 12px; color: var(--text-primary); margin-top: 12px;';
    fileInfoSection.appendChild(msgDiv);
  }
  msgDiv.innerHTML = '✓ Fixed pipeline uploaded. Choose an option below:';

  // Update the compile button section with two choices
  const compileSection = document.querySelector('.sidebar-section:last-child');
  if (compileSection) {
    compileSection.innerHTML = `
      <button class="btn-compile" onclick="startValidation()">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8L6 11L13 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
        Compile Pipeline
      </button>
      <button class="btn-secondary" style="width: 100%; margin-top: 8px; padding: 10px 16px; font-size: 13px;" onclick="skipToPreExec()">
        Skip Compilation → Pre-Execution Checks
      </button>
    `;
  }
}

// Skip validation and jump straight to pre-execution checks
function skipToPreExec() {
  startPreExec();
}

function renderLoadedFile(file, data) {
  // Show file info section
  const fileInfo = document.getElementById('fileInfoSection');
  fileInfo.classList.remove('hidden');
  document.getElementById('loadedFileName').textContent = file.name;
  document.getElementById('fileSize').textContent = `${(file.size / 1024).toFixed(1)}KB`;

  // Show pipeline diagram panel
  const diagramPanel = document.getElementById('pipelineDiagramPanel');
  diagramPanel.classList.remove('hidden');

  // Try to load bundled diagram image
  const img = document.getElementById('pipelineImg');
  img.onerror = () => {
    // If no image file, show a generated SVG placeholder
    img.src = generatePlaceholderDataURI();
  };

  // Show JSON sidebar with formatted JSON
  const jsonSidebar = document.getElementById('jsonSidebar');
  jsonSidebar.classList.remove('hidden');
  document.getElementById('jsonContent').textContent =
    JSON.stringify(data, null, 2);

  // Enable button
  document.getElementById('validateBtn').disabled = false;
}

function removeFile() {
  pipelineData = null;
  document.getElementById('fileInfoSection').classList.add('hidden');
  document.getElementById('pipelineDiagramPanel').classList.add('hidden');
  document.getElementById('jsonSidebar').classList.add('hidden');
  document.getElementById('validateBtn').disabled = true;
  fileInput.value = '';
}

function countKeys(obj, keyword) {
  const str = JSON.stringify(obj || {});
  const matches = str.match(new RegExp(`"${keyword}"`, 'gi'));
  return matches ? matches.length : 0;
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
    <text x="440" y="256" fill="#A8A8A8" font-size="11" text-anchor="middle" letter-spacing="2">BEACON PIPELINE — PLACEHOLDER DIAGRAM</text>
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

// ── BEACON Validation Stages ─────────────────────────────
const BEACON_STAGES = [
  {
    title: 'Normalize ETL Pipeline',
    badge: 'complete',
    outputType: 'json',
    output: {
      pipeline_name: "Daily_Net_Sales_Consolidation",
      nodes: [
        { id:"STAGE_POS",       type:"unknown",   name:"POS_Source",        inputs:[],                         output:"L_POS",                  schema:[{name:"order_id",type:"int32"},{name:"order_date",type:"string"},{name:"store_id",type:"string"},{name:"amount_local",type:"int32"},{name:"currency",type:"string"},{name:"channel",type:"string"}], params:{file_path:"POS_Data.csv",delimiter:",",null_field:""} },
        { id:"STAGE_ECOM",      type:"unknown",   name:"ECOM_Source",       inputs:[],                         output:"L_ECOM",                 schema:[{name:"order_id",type:"int32"},{name:"order_date",type:"string"},{name:"customer_id",type:"string"},{name:"amount_usd",type:"int32"},{name:"currency_flag",type:"string"},{name:"channel",type:"string"}], params:{file_path:"ECOM_Data.csv",delimiter:","} },
        { id:"STAGE_RETURNS",   type:"unknown",   name:"Returns_Source",    inputs:[],                         output:"L_RETURNS",              params:{file_path:"Returns_Data_Correct.csv",delimiter:","} },
        { id:"STAGE_JOIN1",     type:"join",      name:"Join_POS_ECOM",     inputs:["L_POS","L_ECOM"],         output:"L_MERGED_ORDERS",        params:{join_type:"full_outer",join_keys:["order_id"]} },
        { id:"STAGE_JOIN2",     type:"join",      name:"Join_With_Returns", inputs:["L_MERGED_ORDERS","L_RETURNS"], output:"L_MERGED_WITH_RETURNS", params:{join_type:"left_outer",join_keys:["order_id"]} },
        { id:"STAGE_TRANSFORM", type:"transform", name:"Compute_Net",       inputs:["L_MERGED_WITH_RETURNS"],  output:"L_TRANSFORMED",          params:{expressions:{amount_usd:"IF currency='USD' THEN amount_local ELSE amount_local * rate_to_usd",net_amount_usd:"amount_usd - NVL(return_amount_usd,0)"}} },
        { id:"STAGE_AGG",       type:"aggregate", name:"Aggregate_Daily",   inputs:["L_TRANSFORMED"],          output:"L_DAILY",                params:{group_by:["order_date","channel"],aggregations:{total_amount_usd:"SUM(amount_usd)",total_net_amount_usd:"SUM(net_amount_usd)"}} },
        { id:"STAGE_TARGET",    type:"unknown",   name:"Load_To_Fact",      inputs:["L_DAILY"],                output:"FACT_DAILY_SALES",       params:{} }
      ],
      edges: [
        {from:"STAGE_POS",to:"L_POS"},{from:"STAGE_ECOM",to:"L_ECOM"},{from:"STAGE_RETURNS",to:"L_RETURNS"},
        {from:"L_POS",to:"STAGE_JOIN1"},{from:"L_ECOM",to:"STAGE_JOIN1"},{from:"STAGE_JOIN1",to:"L_MERGED_ORDERS"},
        {from:"L_MERGED_ORDERS",to:"STAGE_JOIN2"},{from:"L_RETURNS",to:"STAGE_JOIN2"},{from:"STAGE_JOIN2",to:"L_MERGED_WITH_RETURNS"},
        {from:"L_MERGED_WITH_RETURNS",to:"STAGE_TRANSFORM"},{from:"STAGE_TRANSFORM",to:"L_TRANSFORMED"},
        {from:"L_TRANSFORMED",to:"STAGE_AGG"},{from:"STAGE_AGG",to:"L_DAILY"},{from:"L_DAILY",to:"STAGE_TARGET"},{from:"STAGE_TARGET",to:"FACT_DAILY_SALES"}
      ]
    }
  },
  {
    title: 'Extract Semantics',
    badge: 'complete',
    outputType: 'json',
    output: [
      { operation_type:'source',  output:'L_POS',                stage_id:'STAGE_POS',       stage_name:'POS_Source',      source_fp:'POS_Data.csv' },
      { operation_type:'source',  output:'L_ECOM',               stage_id:'STAGE_ECOM',      stage_name:'ECOM_Source',     source_fp:'ECOM_Data.csv' },
      { operation_type:'source',  output:'L_RETURNS',            stage_id:'STAGE_RETURNS',   stage_name:'Returns_Source',  source_fp:'Returns_Data_Correct.csv' },
      { operation_type:'join',    output:'L_MERGED_ORDERS',      stage_id:'STAGE_JOIN1',     stage_name:'Join_POS_ECOM',   inputs:['L_POS','L_ECOM'],               join_type:'full_outer',  join_keys:['order_id'] },
      { operation_type:'join',    output:'L_MERGED_WITH_RETURNS',stage_id:'STAGE_JOIN2',     stage_name:'Join_With_Returns', inputs:['L_MERGED_ORDERS','L_RETURNS'], join_type:'left_outer',  join_keys:['order_id'] },
      { operation_type:'transform',output:'L_TRANSFORMED',       stage_id:'STAGE_TRANSFORM', stage_name:'Compute_Net',     inputs:['L_MERGED_WITH_RETURNS'], expressions:{amount_usd:"IF currency='USD' THEN amount_local ELSE amount_local * rate_to_usd",net_amount_usd:'amount_usd - NVL(return_amount_usd,0)'} },
      { operation_type:'aggregate',output:'L_DAILY',             stage_id:'STAGE_AGG',       stage_name:'Aggregate_Daily', inputs:['L_TRANSFORMED'], group_by:['order_date','channel'], aggregations:{total_amount_usd:'SUM(amount_usd)',total_net_amount_usd:'SUM(net_amount_usd)'} }
    ]
  },
  {
    title: 'Infer Intent',
    badge: 'complete',
    outputType: 'text',
    output: 'To integrate and analyze sales data from different channels (POS and ECOM) including returns, to compute net sales amounts and aggregate them by day and channel.'
  },
  {
    title: 'Infer Expected Behaviour',
    badge: 'complete',
    outputType: 'text',
    output: 'Expected behaviour synthesized considering the global pipeline intent and the extracted semantics!'
  },
  {
    title: 'Detect Mismatch',
    badge: 'complete',
    outputType: 'text',
    output: 'Input ETL Pipeline validated against the inferred Expected behavior.<br><strong>Three silent defects</strong> detected!'
  },
  {
    title: 'Diagnostics & Fixes',
    badge: 'complete',
    outputType: 'text',
    output: 'Detailed report generated for the <strong>three silent defects</strong> along with their suggested fixes.'
  }
];

// ── (legacy kept for Pre-Exec flow) ──────────────────────
const VALIDATION_STEPS = BEACON_STAGES;

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
      severity: "COMPLETE"
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
  { name: 'Pipeline Parsing',            detail: 'JSON structure valid',       status: 'pass' },
  { name: 'DAG Acyclicity',              detail: 'No cyclic dependencies',     status: 'pass' },
  { name: 'Stage Type Recognition',      detail: '8/8 stages recognised',      status: 'pass' },
  { name: 'Column Type Compatibility',   detail: '22 columns checked',         status: 'pass' },
  {
    name: 'Schema Presence Check',
    detail: 'Returns_Source has no schema',
    status: 'warn',
    description: 'The Returns_Source stage is missing schema definition, which prevents proper type checking and validation',
    remediation: 'Add explicit schema definition to Returns_Source stage with column names and types. This ensures data quality validation and prevents runtime type errors.'
  },
  {
    name: 'Join Type — Join_Returns',
    detail: 'FULL OUTER should be LEFT',
    status: 'fail',
    description: 'Sales orders are joined with returns using FULL OUTER JOIN, which can create fake sales records from return-only rows',
    remediation: 'Change join type from FULL OUTER JOIN to LEFT OUTER JOIN in Join_Returns stage. Returns are adjustments to sales, not independent transactions, so only sales records should drive the join.'
  },
  { name: 'Runtime Parameters Resolved', detail: 'All params resolved',        status: 'pass' },
  { name: 'Expression Validity',         detail: '2/2 expressions parseable',  status: 'pass' },
  { name: 'Sink Node Reachability',      detail: 'FACT_DAILY_SALES reachable', status: 'pass' },
  {
    name: 'Join Semantics — Join_Orders',
    detail: 'FULL OUTER on fact streams',
    status: 'warn',
    description: 'POS and ECOM sales are merged using FULL OUTER JOIN on order_id, which may duplicate revenue if these are overlapping fact streams',
    remediation: 'Verify if POS_Sales and ECOM_Sales are dependent or independent streams. If independent, replace Join_Orders with UNION ALL to avoid duplicate counting. If dependent, add deduplication logic or precedence rules.'
  },
];

const PRE_EXEC_CHECKS = [
  {
    name: 'Source DB2 Connectivity',
    detail: '12ms RTT',
    status: 'pass'
  },
  {
    name: 'Target DW Connectivity',
    detail: '18ms RTT',
    status: 'pass'
  },
  {
    name: 'S3 Staging Access',
    detail: '45ms RTT',
    status: 'fail',
    description: 'Unable to establish connection to S3 staging bucket',
    remediation: 'Verify S3 bucket permissions and network connectivity. Check IAM credentials and security group rules.'
  },
  {
    name: 'PK Uniqueness — ORDERS',
    detail: '0 duplicates',
    status: 'pass'
  },
  {
    name: 'FK Integrity — PRODUCT_DIM',
    detail: '2 violations found',
    status: 'pass',
    description: 'Foreign key violations detected in PRODUCT_DIM table',
    remediation: 'Review and fix the 2 records in ORDERS_FACT that reference non-existent product IDs. Either update the product_id values to valid references or add the missing products to PRODUCT_DIM table.'
  },
  {
    name: 'Null Rate — region_code',
    detail: '3.47% > 2% threshold',
    status: 'pass',
    description: 'The region_code column has a null rate of 3.47%, which exceeds the acceptable threshold of 2%',
    remediation: 'Investigate why region_code is missing for 3.47% of records. Options: 1) Implement data quality rules at source to ensure region_code is populated, 2) Add default region mapping logic, 3) Filter out records with null region_code if they are not business-critical.'
  },
  {
    name: 'CPU Headroom',
    detail: '24/32 cores free',
    status: 'pass'
  },
  {
    name: 'Memory Headroom',
    detail: '118 GB free',
    status: 'warn',
    description: 'Memory usage is approaching threshold limits',
    remediation: 'Monitor memory usage closely. Consider scaling up resources or optimizing memory-intensive operations.'
  },
  {
    name: 'Scratch Disk',
    detail: '2.1 TB available',
    status: 'fail',
    description: 'Insufficient scratch disk space for large data operations',
    remediation: 'Free up disk space or provision additional storage. Minimum 3 TB recommended for this pipeline.'
  },
  {
    name: 'No Conflicting Jobs',
    detail: 'Engine queue clear',
    status: 'pass'
  },
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
  if (step.outputType === 'text') {
    return `<p class="beacon-text-output">${step.output}</p>`;
  }
  return `<div class="beacon-json-scroll"><pre>${JSON.stringify(step.output, null, 2)}</pre></div>`;
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

  // Hide spinner immediately and start analysis
  document.getElementById('spinnerBlock').classList.add('hidden');
  runAnalysisSteps();
}

let activeBeaconIdx = 0;

async function runAnalysisSteps() {
  const list = document.getElementById('stepsList');
  list.classList.remove('hidden');
  list.innerHTML = '';

  // Build the two-panel BEACON layout
  list.innerHTML = `
    <div class="beacon-layout">
      <div class="beacon-sidebar" id="beaconSidebar"></div>
      <div class="beacon-output-panel" id="beaconOutputPanel">
        <div class="beacon-output-placeholder">
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none"><circle cx="20" cy="20" r="18" stroke="#C6C6C6" stroke-width="1.5"/><path d="M14 20h12M20 14v12" stroke="#C6C6C6" stroke-width="1.5" stroke-linecap="round"/></svg>
          <p>Select a stage to view its output</p>
        </div>
      </div>
    </div>
  `;

  const sidebar = document.getElementById('beaconSidebar');

  for (let i = 0; i < BEACON_STAGES.length; i++) {
    const step = BEACON_STAGES[i];

    // Build sidebar row in RUNNING state
    const row = document.createElement('div');
    row.className = 'beacon-stage-row running';
    row.id = `beacon-row-${i}`;
    row.dataset.idx = i;
    row.innerHTML = `
      <div class="beacon-stage-status" id="beacon-status-${i}">${iconRunning()}</div>
      <div class="beacon-stage-info">
        <span class="beacon-stage-title">${step.title}</span>
        <span class="beacon-stage-badge running" id="beacon-badge-${i}">RUNNING</span>
      </div>
      <span class="beacon-stage-op-tag">O/P</span>
    `;
    sidebar.appendChild(row);

    await delay(900);

    // Upgrade to final state
    const badgeClass = step.badge;
    const badgeLabel = badgeClass === 'warning' ? 'WARNING' : 'COMPLETE';
    const icon = badgeClass === 'warning' ? iconWarn() : iconComplete();

    row.classList.remove('running');
    row.classList.add(badgeClass);
    document.getElementById(`beacon-status-${i}`).innerHTML = icon;
    const badge = document.getElementById(`beacon-badge-${i}`);
    badge.textContent = badgeLabel;
    badge.className = `beacon-stage-badge ${badgeClass}`;

    // Make clickable
    row.onclick = () => showBeaconOutput(i);

    // Auto-display output as stage completes
    showBeaconOutput(i);

    await delay(200);
  }

  await delay(500);
  showValidationReport();
}

function showBeaconOutput(idx) {
  // Highlight active row
  document.querySelectorAll('.beacon-stage-row').forEach((r, i) => {
    r.classList.toggle('active', i === idx);
  });

  activeBeaconIdx = idx;
  const step = BEACON_STAGES[idx];
  const panel = document.getElementById('beaconOutputPanel');

  const badgeClass = step.badge;
  const badgeLabel = badgeClass === 'warning' ? 'WARNING' : 'COMPLETE';

  panel.innerHTML = `
    <div class="beacon-output-header">
      <div class="beacon-output-title">
        <span class="beacon-output-step-num">${String(idx + 1).padStart(2, '0')}</span>
        <span>${step.title}</span>
      </div>
      <span class="beacon-stage-badge ${badgeClass}">${badgeLabel}</span>
    </div>
    <div class="beacon-output-body">
      <div class="beacon-output-label">Output</div>
      <div class="step-output">${renderOutput(step)}</div>
    </div>
  `;
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
    <div class="report-summary clickable-kpis">
      <div class="report-stat stat-pass" onclick="toggleCheckPanel('pass')">
        <div class="stat-val">${pass}</div><div class="stat-label">PASSED</div>
      </div>
      <div class="report-stat stat-fail" onclick="toggleCheckPanel('fail')">
        <div class="stat-val">${fail}</div><div class="stat-label">FAILED</div>
      </div>
      <div class="report-stat stat-warn" onclick="toggleCheckPanel('warn')">
        <div class="stat-val">${warn}</div><div class="stat-label">WARNINGS</div>
      </div>
      <div class="report-stat stat-total" onclick="toggleCheckPanel('all')">
        <div class="stat-val">${total}</div><div class="stat-label">TOTAL CHECKS</div>
      </div>
    </div>
    <div class="kpi-hint">Click a number to see details</div>
    <div class="check-panel hidden" id="checkPanel"></div>
  `;

  const action = document.getElementById('valReportAction');
  
  // Show instructional message if there are warnings or failures
  if (warn > 0 || fail > 0) {
    action.innerHTML = `
      <div style="margin-bottom: 16px; padding: 14px 20px; background: rgba(241,194,27,0.07); border: 1px solid rgba(241,194,27,0.2); border-radius: 6px; font-size: 13px; color: var(--text-primary);">
        <strong>⚠️ Action Required:</strong> Please review and fix the identified issues in your pipeline. These issues may lead to incorrect results or pipeline failure. Once fixed, upload the corrected pipeline below.
      </div>
      <button class="btn-secondary" onclick="revisePipeline()">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style="margin-right: 6px;">
          <path d="M8 2v12M8 2l-3 3M8 2l3 3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        Upload Fixed Pipeline
      </button>
    `;
  } else {
    action.innerHTML = '';
  }
}

function buildDefectExpander(type, title, what, warningBox, why, fixes) {
  const uid = 'defect-' + Math.random().toString(36).slice(2, 8);
  const borderClass = type === 'fail' ? 'defect-fail' : 'defect-warn';
  return `
    <div class="defect-expander ${borderClass}" id="${uid}">
      <div class="defect-expander-header" onclick="toggleDefect('${uid}')">
        <span class="defect-expander-title">${title}</span>
        <svg class="defect-chev" id="chev-${uid}" viewBox="0 0 16 16" fill="none">
          <path d="M4 6L8 10L12 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
        </svg>
      </div>
      <div class="defect-expander-body" id="body-${uid}">
        <div class="defect-body-inner">
          ${what}
          ${warningBox}
          ${why}
          <div class="defect-fix-expander" id="fix-${uid}">
            <div class="defect-fix-header" onclick="toggleDefectFix('fix-${uid}')">
              🔧 Suggested Fixes
              <svg class="defect-chev" id="chev-fix-${uid}" viewBox="0 0 16 16" fill="none">
                <path d="M4 6L8 10L12 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
              </svg>
            </div>
            <div class="defect-fix-body hidden" id="fixbody-${uid}">
              ${fixes}
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

function toggleDefect(uid) {
  const body = document.getElementById('body-' + uid);
  const chev = document.getElementById('chev-' + uid);
  const open = body.classList.toggle('open');
  chev.classList.toggle('open', open);
}

function toggleDefectFix(fixUid) {
  const fixBodyId = fixUid.replace(/^fix-/, 'fixbody-');
  const chevId    = 'chev-' + fixUid;
  const b = document.getElementById(fixBodyId);
  const c = document.getElementById(chevId);
  if (b) { const isHidden = b.classList.toggle('hidden'); if (c) c.classList.toggle('open', !isHidden); }
}

let activeCheckFilter = null;
function toggleCheckPanel(filter, checksArray = VALIDATION_CHECKS) {
  const panel = document.getElementById('checkPanel');
  if (activeCheckFilter === filter) {
    panel.classList.add('hidden');
    activeCheckFilter = null;
    document.querySelectorAll('.report-stat').forEach(s => s.classList.remove('kpi-active'));
    return;
  }
  activeCheckFilter = filter;
  document.querySelectorAll('.report-stat').forEach(s => s.classList.remove('kpi-active'));
  const idx = { all: 0, pass: 1, warn: 3, fail: 2 }; // order in grid
  document.querySelectorAll('.report-stat')[['all','pass','warn','fail'].indexOf(filter)]?.classList.add('kpi-active');

  const filtered = filter === 'all' ? checksArray : checksArray.filter(c => c.status === filter);
  panel.innerHTML = filtered.map(c => {
    const hasDetails = c.description || c.remediation;
    return `
      <div class="report-check-row">
        <div class="check-icon">${checkIconForStatus(c.status)}</div>
        <div class="check-name">${c.name}</div>
        <div class="check-detail">${c.detail}</div>
        <div class="check-status ${c.status}">${c.status.toUpperCase()}</div>
      </div>
      ${hasDetails ? `
        <div class="check-details-panel" style="margin-left: 40px; padding: 12px 16px; background: rgba(15,98,254,0.03); border-left: 3px solid ${c.status === 'warn' ? '#F1C21B' : '#FA4D56'}; margin-bottom: 12px; border-radius: 4px;">
          ${c.description ? `<p style="margin: 0 0 8px 0; font-size: 13px; color: var(--text-primary);"><strong>Description:</strong> ${c.description}</p>` : ''}
          ${c.remediation ? `<p style="margin: 0; font-size: 13px; color: var(--text-secondary);"><strong>Remediation:</strong> ${c.remediation}</p>` : ''}
        </div>
      ` : ''}
    `;
  }).join('');
  panel.classList.remove('hidden');
}

// ── Pre-Execution ────────────────────────────────────────
function startPreExec() {
  const sec = document.getElementById('section-preexec');
  sec.classList.remove('hidden');
  sec.scrollIntoView({ behavior: 'smooth', block: 'start' });

  // Hide spinner immediately and start pre-execution steps
  const spinner = document.getElementById('preExecSpinner');
  spinner.classList.add('hidden');
  runPreExecSteps();
}

async function runPreExecSteps() {
  const list = document.getElementById('preExecStepsList');
  list.classList.remove('hidden');

  // Build the two-panel BEACON layout for pre-execution
  list.innerHTML = `
    <div class="beacon-layout">
      <div class="beacon-sidebar" id="preExecBeaconSidebar"></div>
      <div class="beacon-output-panel" id="preExecBeaconOutputPanel">
        <div class="beacon-output-placeholder">
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none"><circle cx="20" cy="20" r="18" stroke="#C6C6C6" stroke-width="1.5"/><path d="M14 20h12M20 14v12" stroke="#C6C6C6" stroke-width="1.5" stroke-linecap="round"/></svg>
          <p>Select a check to view its output</p>
        </div>
      </div>
    </div>
  `;

  const sidebar = document.getElementById('preExecBeaconSidebar');

  for (let i = 0; i < PRE_EXEC_STEPS.length; i++) {
    const step = PRE_EXEC_STEPS[i];

    // Build sidebar row in RUNNING state
    const row = document.createElement('div');
    row.className = 'beacon-stage-row running';
    row.id = `preexec-row-${i}`;
    row.dataset.idx = i;
    row.innerHTML = `
      <div class="beacon-stage-status" id="preexec-status-${i}">${iconRunning()}</div>
      <div class="beacon-stage-info">
        <span class="beacon-stage-title">${step.title}</span>
        <span class="beacon-stage-badge running" id="preexec-badge-${i}">RUNNING</span>
      </div>
      <span class="beacon-stage-op-tag">O/P</span>
    `;
    sidebar.appendChild(row);

    await delay(900);

    // Determine final state
    // Force 'complete' status for Data Volume & Null Profiling and Constraint & Referential Integrity
    const forceComplete = step.title === 'Data Volume & Null Profiling' || step.title === 'Constraint & Referential Integrity';
    const hasWarn = !forceComplete && step.output && (
      step.output.anomalies_detected?.length ||
      (step.output.fk_violations && Object.values(step.output.fk_violations).some(v => v > 0)) ||
      step.output.severity === 'WARNING'
    );
    const badgeClass = hasWarn ? 'warning' : 'complete';
    const badgeLabel = badgeClass === 'warning' ? 'WARNING' : 'COMPLETE';
    const icon = badgeClass === 'warning' ? iconWarn() : iconComplete();

    row.classList.remove('running');
    row.classList.add(badgeClass);
    document.getElementById(`preexec-status-${i}`).innerHTML = icon;
    const badge = document.getElementById(`preexec-badge-${i}`);
    badge.textContent = badgeLabel;
    badge.className = `beacon-stage-badge ${badgeClass}`;

    // Make clickable
    row.onclick = () => showPreExecOutput(i);

    // Auto-display output as stage completes
    showPreExecOutput(i);

    await delay(200);
  }

  await delay(500);
  showPreExecReport();
}

function showPreExecOutput(idx) {
  // Highlight active row
  document.querySelectorAll('#preExecBeaconSidebar .beacon-stage-row').forEach((r, i) => {
    r.classList.toggle('active', i === idx);
  });

  const step = PRE_EXEC_STEPS[idx];
  const panel = document.getElementById('preExecBeaconOutputPanel');

  const hasWarn = step.output && (
    step.output.anomalies_detected?.length ||
    (step.output.fk_violations && Object.values(step.output.fk_violations).some(v => v > 0)) ||
    step.output.severity === 'WARNING'
  );
  const badgeClass = hasWarn ? 'warning' : 'complete';
  const badgeLabel = badgeClass === 'warning' ? 'WARNING' : 'COMPLETE';

  panel.innerHTML = `
    <div class="beacon-output-header">
      <div class="beacon-output-title">
        <span class="beacon-output-step-num">${String(idx + 1).padStart(2, '0')}</span>
        <span>${step.title}</span>
      </div>
      <span class="beacon-stage-badge ${badgeClass}">${badgeLabel}</span>
    </div>
    <div class="beacon-output-body">
      <div class="beacon-output-label">Output</div>
      <div class="step-output">${renderOutput(step)}</div>
    </div>
  `;
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
    <div class="report-summary clickable-kpis">
      <div class="report-stat stat-pass" onclick="togglePreExecCheckPanel('pass')">
        <div class="stat-val">${pass}</div><div class="stat-label">PASSED</div>
      </div>
      <div class="report-stat stat-fail" onclick="togglePreExecCheckPanel('fail')">
        <div class="stat-val">${fail}</div><div class="stat-label">FAILED</div>
      </div>
      <div class="report-stat stat-warn" onclick="togglePreExecCheckPanel('warn')">
        <div class="stat-val">${warn}</div><div class="stat-label">WARNINGS</div>
      </div>
      <div class="report-stat stat-total" onclick="togglePreExecCheckPanel('all')">
        <div class="stat-val">${total}</div><div class="stat-label">TOTAL CHECKS</div>
      </div>
    </div>
    <div class="kpi-hint">Click a number to see details</div>
    <div class="check-panel hidden" id="preExecCheckPanel"></div>
    <div style="margin-top: 24px; padding: 14px 20px; background: rgba(218,30,40,0.07); border: 1px solid rgba(218,30,40,0.3); border-radius: 6px; font-size: 13px; color: var(--text-primary);">
      <strong>⚠️ Alert:</strong> Please carefully review all the issues detected in the input data and pipeline environment that could lead to failure at runtime.
    </div>
  `;

  // No action buttons - pre-exec report is the final step
  document.getElementById('preExecAction').innerHTML = '';
}

let activePreExecCheckFilter = null;
function togglePreExecCheckPanel(filter) {
  const panel = document.getElementById('preExecCheckPanel');
  if (activePreExecCheckFilter === filter) {
    panel.classList.add('hidden');
    activePreExecCheckFilter = null;
    document.querySelectorAll('.report-stat').forEach(s => s.classList.remove('kpi-active'));
    return;
  }
  activePreExecCheckFilter = filter;
  document.querySelectorAll('.report-stat').forEach(s => s.classList.remove('kpi-active'));
  const idx = { all: 0, pass: 1, warn: 3, fail: 2 };
  document.querySelectorAll('.report-stat')[['all','pass','warn','fail'].indexOf(filter)]?.classList.add('kpi-active');

  const filtered = filter === 'all' ? PRE_EXEC_CHECKS : PRE_EXEC_CHECKS.filter(c => c.status === filter);
  panel.innerHTML = filtered.map(c => {
    const hasDetails = c.description || c.remediation;
    return `
      <div class="report-check-row">
        <div class="check-icon">${checkIconForStatus(c.status)}</div>
        <div class="check-name">${c.name}</div>
        <div class="check-detail">${c.detail}</div>
        <div class="check-status ${c.status}">${c.status.toUpperCase()}</div>
      </div>
      ${hasDetails ? `
        <div class="check-details-panel" style="margin-left: 40px; padding: 12px 16px; background: rgba(15,98,254,0.03); border-left: 3px solid ${c.status === 'warn' ? '#F1C21B' : '#FA4D56'}; margin-bottom: 12px; border-radius: 4px;">
          ${c.description ? `<p style="margin: 0 0 8px 0; font-size: 13px; color: var(--text-primary);"><strong>Description:</strong> ${c.description}</p>` : ''}
          ${c.remediation ? `<p style="margin: 0; font-size: 13px; color: var(--text-secondary);"><strong>Remediation:</strong> ${c.remediation}</p>` : ''}
        </div>
      ` : ''}
    `;
  }).join('');
  panel.classList.remove('hidden');
}


// ── Utilities ────────────────────────────────────────────
function delay(ms) {
  return new Promise(res => setTimeout(res, ms));
}
