    function recognizeChords() {
      const pcs = selectedChordPcs();
      if (pcs.length < 2) return [];
      const bass = bassNotePc();
      const matches = [];

      for (let root = 0; root < 12; root += 1) {
        const selectedIntervals = pcs.map(pc => mod(pc - root, 12));
        for (const type of chordTypes) {
          const allowed = new Set(type.intervals);
          const required = type.required || type.intervals;
          const extra = selectedIntervals.filter(interval => !allowed.has(interval));
          if (extra.length) continue;

          const matched = selectedIntervals.filter(interval => allowed.has(interval));
          const missingRequired = required.filter(interval => !selectedIntervals.includes(interval));
          if (matched.length < 2 || missingRequired.length > 2) continue;
          if (missingDefinesChordType(type, missingRequired)) continue;
          if (!selectedIntervals.includes(0) && matched.length < 3) continue;

          const exact = missingRequired.length === 0 && matched.length === type.intervals.length;
          const hasThirdOrSus = selectedIntervals.some(interval => [2, 3, 4, 5].includes(interval));
          const hasSeventhOrExtension = selectedIntervals.some(interval => [1, 2, 5, 9, 10, 11].includes(interval));
          if (!hasThirdOrSus && !hasSeventhOrExtension && type.symbol !== "5") continue;

          const score =
            (exact ? 80 : 0) +
            matched.length * 12 -
            missingRequired.length * 8 +
            (selectedIntervals.includes(0) ? 10 : -4) +
            (bass === root ? 8 : 0) +
            Math.min(type.intervals.length, 6);

          matches.push({
            symbol: formatChordSymbol(root, type, bass, missingRequired),
            name: type.name,
            root,
            bass,
            missing: missingRequired,
            matched: matched.length,
            exact,
            score
          });
        }
      }

      const bySymbol = new Map();
      matches
        .sort((a, b) => b.score - a.score || a.symbol.length - b.symbol.length)
        .forEach(match => {
          if (!bySymbol.has(match.symbol)) bySymbol.set(match.symbol, match);
        });
      return [...bySymbol.values()].slice(0, 8);
    }

    function saveSettings() {
      const snapshot = {
        language: state.language,
        root: state.root,
        accidental: state.accidental,
        material: state.material,
        mode: state.mode,
        fretCount: state.fretCount,
        visibility: state.visibility,
        solfege: state.solfege,
        practiceRange: state.practiceRange,
        showNames: state.showNames,
        practiceOverlay: state.practiceOverlay,
        autoNext: state.autoNext,
        chordRecognition: state.chordRecognition,
        chordPosition: state.chordPosition,
        bpm: state.bpm
      };
      localStorage.setItem(storageKey, JSON.stringify(snapshot));
    }

    function loadSettings() {
      try {
        const saved = JSON.parse(localStorage.getItem(storageKey) || "{}");
        Object.entries(saved).forEach(([key, value]) => {
          if (key in state) state[key] = value;
        });
        if (!scaleFormulas[state.mode] && arpeggioFormulas[state.mode]) state.material = "arpeggio";
        if (!formulaGroup()[state.mode]) state.mode = Object.keys(formulaGroup())[0];
      } catch (error) {
        localStorage.removeItem(storageKey);
      }
    }

    function noteAttempt(ok) {
      state.attemptCount += 1;
      if (ok) state.correctCount += 1;
      renderStats();
      if (ok && state.autoNext) window.setTimeout(newQuestion, 450);
    }

    function cellGridTemplate() {
      const frets = Number(state.fretCount);
      return `70px repeat(${frets}, minmax(58px, 1fr))`;
    }

    function populateKeys() {
      els.keySelect.innerHTML = "";
      names().forEach((name, pc) => {
        const option = document.createElement("option");
        option.value = pc;
        option.textContent = name;
        els.keySelect.appendChild(option);
      });
      els.keySelect.value = String(state.root);
    }

    function setSelectOptionText(select, labels) {
      Array.from(select.options).forEach(option => {
        if (labels[option.value]) option.textContent = labels[option.value];
      });
    }

    function populatePatterns() {
      const previousMode = state.mode;
      const group = formulaGroup();
      els.modeSelect.innerHTML = "";
      Object.entries(group).forEach(([value, formula]) => {
        const option = document.createElement("option");
        option.value = value;
        option.textContent = formula.labels[state.language];
        els.modeSelect.appendChild(option);
      });
      state.mode = group[previousMode] ? previousMode : Object.keys(group)[0];
      els.modeSelect.value = state.mode;
    }

    function localizeStatic() {
      document.documentElement.lang = state.language === "zh" ? "zh-CN" : "en";
      document.title = t("documentTitle");
      Object.entries(els.staticText).forEach(([key, element]) => {
        element.textContent = t(key);
      });
      els.languageSelect.value = state.language;
      setSelectOptionText(els.accidentalSelect, t("accidentalOptions"));
      setSelectOptionText(els.materialSelect, t("materialOptions"));
      populatePatterns();
      setSelectOptionText(els.visibilitySelect, t("visibilityOptions"));
      setSelectOptionText(els.solfegeSelect, t("solfegeOptions"));
      setSelectOptionText(els.practiceRangeSelect, t("rangeOptions"));
      setSelectOptionText(els.chordPositionSelect, t("chordPositionOptions"));
      setSelectOptionText(els.practiceType, t("practiceTypeOptions"));
      els.toggleNames.textContent = state.showNames ? t("showNames") : t("hideNames");
      els.togglePracticeOverlay.textContent = t("targetOnly");
      els.toggleAutoNext.textContent = t("autoNext");
      els.toggleChordRecognition.textContent = t("chordRecognition");
      els.newQuestion.textContent = t("newQuestion");
      els.showAnswer.textContent = t("showAnswer");
      els.cancelQuestion.textContent = t("cancelQuestion");
      els.resetStats.textContent = t("resetStats");
      els.clearChord.textContent = t("clearChord");
      els.metroToggle.textContent = state.metroTimer ? t("stop") : t("start");
      renderStats();
      if (!state.question) {
        els.questionTask.textContent = t("noQuestionTask");
        els.questionHint.textContent = t("noQuestionHint");
      }
    }

    function syncControls() {
      els.languageSelect.value = state.language;
      els.keySelect.value = String(state.root);
      els.accidentalSelect.value = state.accidental;
      els.materialSelect.value = state.material;
      els.modeSelect.value = state.mode;
      els.fretCountSelect.value = String(state.fretCount);
      els.visibilitySelect.value = state.visibility;
      els.solfegeSelect.value = state.solfege;
      els.practiceRangeSelect.value = state.practiceRange;
      els.toggleNames.classList.toggle("active", state.showNames);
      els.togglePracticeOverlay.classList.toggle("active", state.practiceOverlay);
      els.toggleAutoNext.classList.toggle("active", state.autoNext);
      els.toggleChordRecognition.classList.toggle("active", state.chordRecognition);
      els.chordPositionSelect.value = state.chordPosition;
      els.bpmRange.value = String(state.bpm);
      els.bpmValue.textContent = state.bpm;
    }

    function renderStats() {
      els.drillStats.innerHTML = `
        <div class="stat-box"><strong>${state.correctCount}</strong>${t("correctLabel")}</div>
        <div class="stat-box"><strong>${state.attemptCount}</strong>${t("attemptsLabel")}</div>
      `;
    }

    function renderFretboard() {
      const frets = Number(state.fretCount);
      const scale = currentScale();
      const scaleSet = new Set(scale);
      const grid = cellGridTemplate();
      const boardWidth = `${70 + frets * 58}px`;
      els.fretboard.style.gridTemplateColumns = grid;
      els.fretboard.style.width = boardWidth;
      els.fretboard.style.minWidth = boardWidth;
      els.fretLabels.style.gridTemplateColumns = grid;
      els.fretLabels.style.width = boardWidth;
      els.fretLabels.style.minWidth = boardWidth;
      els.markerRow.style.gridTemplateColumns = grid;
      els.markerRow.style.width = boardWidth;
      els.markerRow.style.minWidth = boardWidth;
      els.fretboard.innerHTML = "";

      strings.forEach(string => {
        const row = document.createElement("div");
        row.className = "string-row";
        row.style.gridTemplateColumns = grid;
        row.style.setProperty("--string-size", `${string.size}px`);
        for (let fret = 0; fret <= frets; fret += 1) {
          const pc = mod(string.pc + fret, 12);
          const cell = document.createElement("div");
          cell.className = `fret-cell${fret === 0 ? " open" : ""}`;
          const note = document.createElement("button");
          note.type = "button";
          note.className = "note";
          note.dataset.pc = pc;
          note.dataset.fret = fret;
          const currentStringLabel = stringLabel(string);
          note.dataset.string = string.id;
          note.dataset.stringLabel = currentStringLabel;
          note.dataset.id = `${string.id}-${fret}`;
          note.textContent = noteLabel(pc);
          if (scaleSet.has(pc)) note.classList.add("in-scale");
          if (pc === state.root) note.classList.add("root");
          if (state.chordSelections.get(string.id)?.fret === fret) note.classList.add("chord-selected");
          if (!state.showNames) note.classList.add("hidden-label");
          if (state.visibility === "scaleOnly" && !scaleSet.has(pc)) note.classList.add("muted");
          if (!isInPracticeRange(fret)) note.classList.add("out-range");
          if (state.chordRecognition && !isInChordPosition(fret)) note.classList.add("chord-window-muted");
          if (state.practiceOverlay && state.question) applyQuestionOverlay(note, pc, fret, string.id);
          note.addEventListener("click", () => handleFretClick({
            pc,
            fret,
            midi: string.midi + fret,
            stringId: string.id,
            stringNumber: string.number,
            stringLabel: currentStringLabel,
            el: note
          }));
          cell.appendChild(note);
          row.appendChild(cell);
        }
        els.fretboard.appendChild(row);
      });

      els.fretLabels.innerHTML = "";
      els.markerRow.innerHTML = "";
      for (let fret = 0; fret <= frets; fret += 1) {
        const label = document.createElement("div");
        label.className = `fret-label${fret === 0 ? " open" : ""}`;
        label.textContent = fret === 0 ? t("openString") : fret;
        els.fretLabels.appendChild(label);
        const marker = document.createElement("div");
        marker.className = `marker${fret === 0 ? " open" : ""}`;
        marker.textContent = fretMarkers.has(fret) ? (fret === 12 || fret === 24 ? "••" : "•") : "";
        els.markerRow.appendChild(marker);
      }
    }