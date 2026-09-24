// Named in-browser save/load controls for Test Bet Roulette.
(function(){
  'use strict';

  var SAVE_KEY = 'testBetRouletteNamedSavesV1';
  var PANEL_ID = 'namedSavePanel';
  var MODAL_ID = 'namedSaveModal';

  function readGlobal(name, fallback){
    try {
      var value = eval(name);
      return typeof value === 'undefined' ? fallback : value;
    } catch(_) {
      return fallback;
    }
  }

  function writeGlobal(name, value){
    try {
      var nextValue = value;
      eval(name + ' = nextValue');
      return true;
    } catch(_) {
      return false;
    }
  }

  function cloneForSave(value){
    var seen = typeof WeakSet === 'function' ? new WeakSet() : null;
    return JSON.parse(JSON.stringify(value, function(key, val){
      if(val instanceof Set){
        return { __rouletteSavedSet: true, values: Array.from(val) };
      }
      if(typeof val === 'function') return undefined;
      if(val && typeof val === 'object'){
        if(val.nodeType || val === window || val === document) return undefined;
        if(seen){
          if(seen.has(val)) return undefined;
          seen.add(val);
        }
      }
      return val;
    }));
  }

  function reviveSaved(value){
    return JSON.parse(JSON.stringify(value || null), function(key, val){
      if(val && val.__rouletteSavedSet && Array.isArray(val.values)){
        return new Set(val.values);
      }
      return val;
    });
  }

  function replaceArray(name, items){
    var safeItems = Array.isArray(items) ? items : [];
    try {
      var arr = eval(name);
      if(Array.isArray(arr)){
        arr.length = 0;
        safeItems.forEach(function(item){ arr.push(item); });
        return true;
      }
    } catch(_) {}
    return writeGlobal(name, safeItems);
  }

  function replaceObject(name, obj){
    var safeObj = obj && typeof obj === 'object' && !Array.isArray(obj) ? obj : {};
    try {
      var target = eval(name);
      if(target && typeof target === 'object' && !Array.isArray(target)){
        Object.keys(target).forEach(function(key){ delete target[key]; });
        Object.assign(target, safeObj);
        return true;
      }
    } catch(_) {}
    return writeGlobal(name, safeObj);
  }

  function readSaveList(){
    try {
      var parsed = JSON.parse(localStorage.getItem(SAVE_KEY) || '[]');
      return Array.isArray(parsed) ? parsed : [];
    } catch(_) {
      return [];
    }
  }

  function writeSaveList(list){
    localStorage.setItem(SAVE_KEY, JSON.stringify(list));
  }

  function money(value){
    var n = Number(value || 0);
    return '$' + n.toLocaleString();
  }

  function showToast(message, kind){
    var banner = document.getElementById('banner');
    if(banner){
      banner.textContent = message;
      banner.className = 'banner ' + (kind || 'draw') + ' show';
      setTimeout(function(){ banner.classList.remove('show'); }, 2300);
      return;
    }
    alert(message);
  }

  function collectAutoSettings(){
    var ids = [
      'autoStrategy', 'autoRepeatCount', 'autoStopBank', 'autoStopProfit', 'autoMaxBet',
      'autoWinAction', 'autoLossAction', 'autoWinMultiplier', 'autoLossMultiplier',
      'autoBankrollInput', 'autoRepeatCount', 'slowAutoDelayInput'
    ];
    var data = { autoSpeed: cloneForSave(readGlobal('autoSpeed', 3)) };
    ids.forEach(function(id){
      var el = document.getElementById(id);
      if(el) data[id] = el.value;
    });
    return data;
  }

  function restoreAutoSettings(data){
    if(!data) return;
    Object.keys(data).forEach(function(id){
      if(id === 'autoSpeed'){
        writeGlobal('autoSpeed', data[id]);
        if(typeof window.setAutoSpeed === 'function'){
          try { window.setAutoSpeed(data[id]); } catch(_) {}
        }
        return;
      }
      var el = document.getElementById(id);
      if(el){
        el.value = data[id];
        try { el.dispatchEvent(new Event('change', { bubbles: true })); } catch(_) {}
      }
    });
  }

  function snapshotState(name){
    return {
      id: String(Date.now()),
      name: name,
      savedAt: new Date().toISOString(),
      state: {
        START_BANK: cloneForSave(readGlobal('START_BANK', 1000)),
        SESSION_START_BANK: cloneForSave(readGlobal('SESSION_START_BANK', readGlobal('START_BANK', 1000))),
        TABLE_MIN: cloneForSave(readGlobal('TABLE_MIN', 3)),
        TABLE_MAX: cloneForSave(readGlobal('TABLE_MAX', 500)),
        bank: cloneForSave(readGlobal('bank', 0)),
        stake: cloneForSave(readGlobal('stake', 5)),
        gameMode: cloneForSave(readGlobal('gameMode', 'strict')),
        settings: cloneForSave(readGlobal('settings', {})),
        bets: cloneForSave(readGlobal('bets', [])),
        lastRound: cloneForSave(readGlobal('lastRound', [])),
        rounds: cloneForSave(readGlobal('rounds', [])),
        allResults: cloneForSave(readGlobal('allResults', [])),
        numberCounts: cloneForSave(readGlobal('numberCounts', {})),
        series: cloneForSave(readGlobal('series', [])),
        selectedIdx: cloneForSave(readGlobal('selectedIdx', -1)),
        wheelRotation: cloneForSave(readGlobal('wheelRotation', 0)),
        betSeq: cloneForSave(readGlobal('betSeq', 0)),
        firstBetPlaced: cloneForSave(readGlobal('firstBetPlaced', false)),
        auto: collectAutoSettings()
      }
    };
  }

  function normalizeName(name){
    return String(name || '').trim().toLowerCase();
  }

  function saveCurrentGame(){
    if(readGlobal('spinning', false)){
      showToast('Wait for the spin to finish before saving.', 'draw');
      return;
    }
    var defaultName = 'Save ' + new Date().toLocaleString();
    var name = prompt('Name this save:', defaultName);
    if(name === null) return;
    name = String(name).trim();
    if(!name){
      showToast('Save cancelled. Name cannot be empty.', 'loss');
      return;
    }

    var saves = readSaveList();
    var existingIndex = saves.findIndex(function(save){ return normalizeName(save.name) === normalizeName(name); });
    if(existingIndex >= 0 && !confirm('Replace the saved game named "' + name + '"?')) return;

    var record = snapshotState(name);
    try {
      if(existingIndex >= 0) saves.splice(existingIndex, 1, record);
      else saves.push(record);
      saves.sort(function(a, b){ return String(b.savedAt).localeCompare(String(a.savedAt)); });
      writeSaveList(saves);
      showToast('Game saved: ' + name, 'win');
    } catch(err) {
      console.warn('Named save failed:', err);
      showToast('Could not save. Browser storage may be full.', 'loss');
    }
  }

  function resultClass(value){
    if(value === '0' || value === '00') return 'green';
    var redSet = readGlobal('REDS', new Set([1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36]));
    return redSet && redSet.has && redSet.has(Number(value)) ? 'red' : 'black';
  }

  function rebuildResultRail(){
    var rail = document.getElementById('rail');
    var results = readGlobal('allResults', []);
    var rounds = readGlobal('rounds', []);
    if(!rail || !Array.isArray(results)) return;
    rail.innerHTML = '';
    results.forEach(function(value, index){
      var ball = document.createElement('div');
      ball.className = 'rball ' + resultClass(value) + (index === 0 ? ' most-recent' : '');
      ball.textContent = value;
      ball.dataset.spinIdx = String(Math.max(0, rounds.length - 1 - index));
      ball.title = 'Spin ' + (Number(ball.dataset.spinIdx) + 1) + ': ' + value;
      ball.addEventListener('click', function(){
        var idx = Number(ball.dataset.spinIdx);
        if(typeof window.selectSpin === 'function') window.selectSpin(idx);
      });
      rail.appendChild(ball);
    });
  }

  function refreshAfterLoad(state){
    try { if(typeof window.updateBank === 'function') window.updateBank(); } catch(_) {}
    try { if(typeof window.updateStake === 'function') window.updateStake(); } catch(_) {}
    try { if(typeof window.drawChipGhosts === 'function') window.drawChipGhosts(); } catch(_) {}
    try { if(typeof window.refreshHotCold === 'function') window.refreshHotCold(); } catch(_) {}
    try { if(typeof window.refreshFeltCounts === 'function') window.refreshFeltCounts(); } catch(_) {}
    try { if(typeof window.updateSpinHistory === 'function') window.updateSpinHistory(); } catch(_) {}
    try { if(typeof window.drawChart === 'function') window.drawChart(); } catch(_) {}
    try { if(typeof window.updateChipAvailability === 'function') window.updateChipAvailability(); } catch(_) {}
    try { if(typeof window.updateFeltCursor === 'function') window.updateFeltCursor(); } catch(_) {}
    try { if(typeof window.updateModeButtons === 'function') window.updateModeButtons(); } catch(_) {}
    try { if(typeof window._soulmanRenderHints === 'function') window._soulmanRenderHints(); } catch(_) {}

    var pillMin = document.getElementById('pillMin');
    var pillMax = document.getElementById('pillMax');
    if(pillMin) pillMin.textContent = state.TABLE_MIN;
    if(pillMax) pillMax.textContent = state.TABLE_MAX;

    var last = Array.isArray(state.rounds) && state.rounds.length ? state.rounds[state.rounds.length - 1] : null;
    if(last){
      try {
        if(typeof window.setWheelBox === 'function') window.setWheelBox(last.result);
      } catch(_) {}
      try {
        if(typeof window.updateLastSpinResult === 'function') window.updateLastSpinResult(last.result, last.delta, last.staked);
        else {
          var lastEl = document.getElementById('lastSpinResult');
          if(lastEl) lastEl.textContent = last.result;
        }
      } catch(_) {}
      try {
        if(typeof window.selectSpin === 'function') window.selectSpin(state.rounds.length - 1);
      } catch(_) {}
    } else {
      try { if(typeof window.setWheelBox === 'function') window.setWheelBox('—'); } catch(_) {}
      var lastSpin = document.getElementById('lastSpinResult');
      if(lastSpin) lastSpin.textContent = '—';
    }

    rebuildResultRail();
  }

  function restoreState(savedRecord){
    if(!savedRecord || !savedRecord.state) return;
    if(readGlobal('spinning', false)){
      showToast('Wait for the spin to finish before loading.', 'draw');
      return;
    }
    var state = reviveSaved(savedRecord.state);

    writeGlobal('START_BANK', Number(state.START_BANK || 1000));
    writeGlobal('SESSION_START_BANK', Number(state.SESSION_START_BANK || state.START_BANK || 1000));
    writeGlobal('TABLE_MIN', Number(state.TABLE_MIN || 3));
    writeGlobal('TABLE_MAX', Number(state.TABLE_MAX || 500));
    writeGlobal('bank', Number(state.bank || 0));
    writeGlobal('stake', Number(state.stake || 5));
    writeGlobal('gameMode', state.gameMode || 'strict');
    writeGlobal('selectedIdx', typeof state.selectedIdx === 'number' ? state.selectedIdx : -1);
    writeGlobal('wheelRotation', Number(state.wheelRotation || 0));
    writeGlobal('betSeq', Number(state.betSeq || 0));
    writeGlobal('firstBetPlaced', !!state.firstBetPlaced);

    replaceObject('settings', state.settings || {});
    replaceArray('bets', state.bets || []);
    replaceArray('lastRound', state.lastRound || []);
    replaceArray('rounds', state.rounds || []);
    replaceArray('allResults', state.allResults || []);
    replaceObject('numberCounts', state.numberCounts || {});
    replaceArray('series', state.series && state.series.length ? state.series : [Number(state.START_BANK || 1000)]);
    restoreAutoSettings(state.auto);

    try { if(typeof window.saveLastSessionBank === 'function') window.saveLastSessionBank(Number(state.START_BANK || 1000)); } catch(_) {}
    refreshAfterLoad(state);
    closeLoadModal();
    showToast('Loaded game: ' + savedRecord.name, 'win');
  }

  function deleteSave(id){
    var saves = readSaveList();
    var record = saves.find(function(save){ return save.id === id; });
    if(!record) return;
    if(!confirm('Delete saved game "' + record.name + '"?')) return;
    writeSaveList(saves.filter(function(save){ return save.id !== id; }));
    renderLoadList();
    showToast('Deleted save: ' + record.name, 'draw');
  }

  function renderLoadList(){
    var list = document.getElementById('namedSaveList');
    if(!list) return;
    var saves = readSaveList().sort(function(a, b){ return String(b.savedAt).localeCompare(String(a.savedAt)); });
    if(!saves.length){
      list.innerHTML = '<div class="named-save-empty">No saved games yet.</div>';
      return;
    }
    list.innerHTML = '';
    saves.forEach(function(save){
      var state = save.state || {};
      var row = document.createElement('div');
      row.className = 'named-save-row';

      var info = document.createElement('div');
      info.className = 'named-save-info';
      var date = save.savedAt ? new Date(save.savedAt).toLocaleString() : 'Unknown date';
      var spins = Array.isArray(state.rounds) ? state.rounds.length : 0;
      info.innerHTML = '<strong></strong><span></span>';
      info.querySelector('strong').textContent = save.name;
      info.querySelector('span').textContent = date + ' | Bank ' + money(state.bank) + ' | Spins ' + spins;

      var actions = document.createElement('div');
      actions.className = 'named-save-actions';
      var loadBtn = document.createElement('button');
      loadBtn.type = 'button';
      loadBtn.className = 'named-save-load';
      loadBtn.textContent = 'Load';
      loadBtn.addEventListener('click', function(){ restoreState(save); });
      var delBtn = document.createElement('button');
      delBtn.type = 'button';
      delBtn.className = 'named-save-delete';
      delBtn.textContent = 'Delete';
      delBtn.addEventListener('click', function(){ deleteSave(save.id); });
      actions.append(loadBtn, delBtn);
      row.append(info, actions);
      list.appendChild(row);
    });
  }

  function openLoadModal(){
    renderLoadList();
    var modal = document.getElementById(MODAL_ID);
    if(modal) modal.classList.add('open');
  }

  function closeLoadModal(){
    var modal = document.getElementById(MODAL_ID);
    if(modal) modal.classList.remove('open');
  }

  function addStyles(){
    if(document.getElementById('namedSaveStyles')) return;
    var style = document.createElement('style');
    style.id = 'namedSaveStyles';
    style.textContent = [
      '#namedSavePanel{position:fixed;right:18px;bottom:226px;z-index:10050;display:flex;gap:7px;pointer-events:auto;}',
      '#namedSavePanel button{appearance:none;border:1px solid rgba(255,211,77,.7);background:linear-gradient(135deg,#101827,#05080f);color:#ffd34d;border-radius:7px;padding:8px 12px;font-size:12px;font-weight:900;letter-spacing:.2px;cursor:pointer;box-shadow:0 7px 18px rgba(0,0,0,.55),inset 0 1px 0 rgba(255,255,255,.08);}',
      '#namedSavePanel button:hover{border-color:#fff;color:#fff;}',
      '#namedSaveModal{position:fixed;inset:0;z-index:2147483646;display:none;align-items:center;justify-content:center;background:rgba(0,0,0,.78);pointer-events:auto;}',
      '#namedSaveModal.open{display:flex;}',
      '.named-save-card{width:min(560px,92vw);max-height:78vh;overflow:auto;background:linear-gradient(135deg,#101827,#070b13);border:2px solid #d4af37;border-radius:10px;padding:16px;color:#fff;box-shadow:0 20px 70px rgba(0,0,0,.75);}',
      '.named-save-head{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:12px;border-bottom:1px solid rgba(255,211,77,.25);padding-bottom:10px;}',
      '.named-save-head h2{margin:0;color:#ffd34d;font-size:18px;font-weight:900;}',
      '.named-save-close{appearance:none;background:#210f12;color:#ff9a9a;border:1px solid #ff6666;border-radius:6px;padding:5px 10px;font-size:14px;font-weight:900;cursor:pointer;}',
      '#namedSaveList{display:flex;flex-direction:column;gap:8px;}',
      '.named-save-row{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:10px;border:1px solid rgba(255,211,77,.18);border-radius:8px;background:rgba(255,255,255,.04);}',
      '.named-save-info{min-width:0;display:flex;flex-direction:column;gap:4px;}',
      '.named-save-info strong{font-size:14px;color:#fff;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}',
      '.named-save-info span{font-size:11px;color:#aab;}',
      '.named-save-actions{display:flex;gap:6px;flex-shrink:0;}',
      '.named-save-actions button{appearance:none;border:1px solid transparent;border-radius:6px;padding:7px 10px;font-size:11px;font-weight:900;cursor:pointer;}',
      '.named-save-load{background:#0b4b2b;color:#afffcf;border-color:#26c06f!important;}',
      '.named-save-delete{background:#4b1010;color:#ffc0c0;border-color:#ef4444!important;}',
      '.named-save-empty{padding:20px;text-align:center;color:#aab;border:1px dashed rgba(255,211,77,.25);border-radius:8px;}',
      '@media(max-width:700px){#namedSavePanel{right:10px;bottom:184px;flex-direction:column;}#namedSavePanel button{font-size:11px;padding:7px 10px}.named-save-row{align-items:flex-start;flex-direction:column}.named-save-actions{width:100%}.named-save-actions button{flex:1}}'
    ].join('\n');
    document.head.appendChild(style);
  }

  function buildControls(){
    if(document.getElementById(PANEL_ID)) return;
    addStyles();

    var panel = document.createElement('div');
    panel.id = PANEL_ID;
    var saveBtn = document.createElement('button');
    saveBtn.id = 'namedSaveGameBtn';
    saveBtn.type = 'button';
    saveBtn.textContent = 'Save Game';
    saveBtn.title = 'Save this game under a name';
    saveBtn.addEventListener('click', saveCurrentGame);
    var loadBtn = document.createElement('button');
    loadBtn.id = 'namedLoadGameBtn';
    loadBtn.type = 'button';
    loadBtn.textContent = 'Load Game';
    loadBtn.title = 'Load a named saved game';
    loadBtn.addEventListener('click', openLoadModal);
    panel.append(saveBtn, loadBtn);

    var modal = document.createElement('div');
    modal.id = MODAL_ID;
    modal.innerHTML = '<div class="named-save-card"><div class="named-save-head"><h2>Load Game</h2><button type="button" class="named-save-close">x</button></div><div id="namedSaveList"></div></div>';
    modal.addEventListener('click', function(e){ if(e.target === modal) closeLoadModal(); });
    modal.querySelector('.named-save-close').addEventListener('click', closeLoadModal);

    document.body.append(panel, modal);
  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', buildControls);
  } else {
    buildControls();
  }

  window.namedGameSaves = {
    saveCurrentGame: saveCurrentGame,
    openLoadModal: openLoadModal,
    restoreState: restoreState
  };
})();
