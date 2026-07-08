    function renderChordFretboard() {
      const { start, end } = chordDisplayRange();
      const frets = [];
      for (let fret = start; fret <= end; fret += 1) frets.push(fret);
      const hasOpen = frets.includes(0);
      const grid = frets.map(fret => fret === 0 ? "58px" : "46px").join(" ");
      const boardWidth = `${frets.reduce((sum, fret) => sum + (fret === 0 ? 58 : 46), 0)}px`;
      els.chordFretboard.style.gridTemplateColumns = grid;
      els.chordFretboard.style.width = boardWidth;
      els.chordFretboard.style.minWidth = boardWidth;
      els.chordFretLabels.style.gridTemplateColumns = grid;
      els.chordFretLabels.style.width = boardWidth;
      els.chordFretLabels.style.minWidth = boardWidth;
      els.chordFretboard.innerHTML = "";
      els.chordFretLabels.innerHTML = "";

      strings.forEach(string => {
        const row = document.createElement("div");
        row.className = "chord-string-row";
        row.style.gridTemplateColumns = grid;
        row.style.setProperty("--string-size", `${string.size}px`);
        frets.forEach(fret => {
          const pc = mod(string.pc + fret, 12);
          const cell = document.createElement("div");
          cell.className = `chord-cell${fret === 0 ? " open" : ""}`;
          const note = document.createElement("button");
          note.type = "button";
          note.className = "note";
          note.dataset.pc = pc;
          note.dataset.fret = fret;
          note.dataset.string = string.id;
          note.dataset.chordId = `${string.id}-${fret}`;
          note.textContent = noteName(pc);
          if (state.chordSelections.get(string.id)?.fret === fret) note.classList.add("chord-selected");
          if (!state.chordRecognition) note.classList.add("muted");
          note.addEventListener("click", () => {
            if (!state.chordRecognition) {
              state.chordRecognition = true;
              state.question = null;
              state.rootHits.clear();
              els.answerButtons.innerHTML = "";
            }
            handleChordClick({
              pc,
              fret,
              midi: string.midi + fret,
              stringId: string.id,
              stringNumber: string.number,
              stringLabel: stringLabel(string),
              el: note
            });
          });
          cell.appendChild(note);
          row.appendChild(cell);
        });
        els.chordFretboard.appendChild(row);
      });

      frets.forEach(fret => {
        const label = document.createElement("div");
        label.className = `chord-fret-label${fret === 0 ? " open" : ""}`;
        label.textContent = fret === 0 ? t("openString") : fret;
        els.chordFretLabels.appendChild(label);
      });
    }

    function applyQuestionOverlay(note, pc, fret, stringName) {
      const q = state.question;
      let isTarget = false;
      if (q.type === "findNote") isTarget = pc === q.pc;
      if (q.type === "findDegree") isTarget = pc === q.pc;
      if (q.type === "findRoots") isTarget = pc === state.root && !state.rootHits.has(note.dataset.id);
      if (q.type === "scaleRun") isTarget = pc === q.pc;
      if (q.type === "identifyPosition") isTarget = fret === q.fret && stringName === q.stringId;
      if (!isTarget) note.classList.add("muted");
    }

    function renderScaleInfo() {
      const scale = currentScale();
      const currentModeLabel = modeLabel();
      const rootName = noteName(state.root);
      els.currentScalePill.textContent = `${rootName} ${currentModeLabel}`;
      els.displayModePill.textContent = state.visibility === "highlight" ? t("allNotesVisible") : t("scaleOnly");
      els.scaleMeta.textContent = `${rootName} ${currentModeLabel}, ${t("fixedDoNotes")}: ${scale.map(noteName).join(" - ")}`;
      els.scaleList.innerHTML = "";
      const degrees = currentDegrees();
      scale.forEach((pc, index) => {
        const item = document.createElement("span");
        item.className = `scale-note${index === 0 ? " root-badge" : ""}`;
        item.textContent = state.solfege === "degree" ? degrees.get(pc) : noteLabel(pc);
        els.scaleList.appendChild(item);
      });
    }

    function renderChordRecognition() {
      const selected = selectedChordArray();
      const matches = recognizeChords();
      els.selectedChordNotes.innerHTML = "";

      if (!selected.length) {
        els.selectedChordNotes.innerHTML = `<div class="small">${t("noSelectedNotes")}</div>`;
      } else {
        const label = document.createElement("div");
        label.className = "small";
        label.textContent = `${t("selectedNotesLabel")}: ${selected.length}`;
        els.selectedChordNotes.appendChild(label);
        selected.forEach(note => {
          const row = document.createElement("div");
          row.className = "selected-note-row";
          row.innerHTML = `
            <strong>${noteName(note.pc)}</strong>
            <span>${note.stringLabel}, ${note.fret === 0 ? t("openString") : note.fret}</span>
            <button class="ghost-btn" type="button" aria-label="Remove">×</button>
          `;
          row.querySelector("button").addEventListener("click", () => {
            state.chordSelections.delete(note.stringId);
            renderAll();
          });
          els.selectedChordNotes.appendChild(row);
        });
      }

      if (!state.chordRecognition) {
        els.chordStatus.textContent = t("chordOffStatus");
        els.bestChord.textContent = "-";
        els.alsoChords.innerHTML = "";
        return;
      }

      if (selected.length < 2) {
        els.chordStatus.textContent = t("chordNeedNotes");
        els.bestChord.textContent = "-";
        els.alsoChords.innerHTML = "";
        return;
      }

      if (!matches.length) {
        els.chordStatus.textContent = t("chordNoMatch");
        els.bestChord.textContent = "-";
        els.alsoChords.innerHTML = "";
        return;
      }

      els.chordStatus.textContent = matches[0].name;
      els.bestChord.textContent = matches[0].symbol;
      els.alsoChords.innerHTML = "";
      matches.slice(1, 7).forEach(match => {
        const chip = document.createElement("span");
        chip.className = "chord-chip";
        chip.textContent = match.symbol;
        chip.title = match.name;
        els.alsoChords.appendChild(chip);
      });
    }

    function renderAll() {
      syncControls();
      localizeStatic();
      renderFretboard();
      renderChordFretboard();
      renderScaleInfo();
      renderChordRecognition();
      saveSettings();
    }

    function setFeedback(message, kind = "") {
      els.feedback.textContent = message;
      els.feedback.className = `feedback ${kind}`;
    }

    function animateNote(el, kind) {
      el.classList.remove("correct", "wrong");
      void el.offsetWidth;
      el.classList.add(kind);
    }

    function cancelQuestion() {
      state.question = null;
      state.rootHits.clear();
      els.answerButtons.innerHTML = "";
      els.questionTask.textContent = t("noQuestionTask");
      els.questionHint.textContent = t("noQuestionHint");
      setFeedback(t("questionCanceled"));
      renderAll();
    }

    function randomItem(items) {
      return items[Math.floor(Math.random() * items.length)];
    }

    function positionsInRange(predicate = () => true) {
      const positions = [];
      strings.forEach(string => {
        for (let fret = 0; fret <= Number(state.fretCount); fret += 1) {
          const pc = mod(string.pc + fret, 12);
          if (predicate({ pc, fret, string })) {
            positions.push({ stringId: string.id, stringLabel: stringLabel(string), fret, pc });
          }
        }
      });
      return positions;
    }

    function availableScalePcs() {
      const scaleSet = new Set(currentScale());
      return [...new Set(positionsInRange(({ pc }) => scaleSet.has(pc)).map(position => position.pc))];
    }

    function randomFretPosition() {
      return randomItem(positionsInRange());
    }

    function newQuestion() {
      if (state.chordRecognition) {
        state.chordRecognition = false;
        state.chordSelections.clear();
      }
      const type = els.practiceType.value;
      const scale = availableScalePcs();
      state.rootHits.clear();
      els.answerButtons.innerHTML = "";
      setFeedback("");

      if (type === "findNote") {
        const pc = randomItem(scale);
        state.question = { type, pc };
        els.questionTask.textContent = t("findAllNote")(noteName(pc));
        els.questionHint.textContent = t("clickAnyCorrect");
      }

      if (type === "identifyPosition") {
        const target = randomFretPosition();
        state.question = { type, ...target };
        els.questionTask.textContent = t("identifyPosition")(target.stringLabel, target.fret);
        els.questionHint.textContent = t("chooseFixedName");
        names().forEach((label, pc) => {
          const btn = document.createElement("button");
          btn.type = "button";
          btn.textContent = label;
          btn.addEventListener("click", () => answerName(pc));
          els.answerButtons.appendChild(btn);
        });
      }

      if (type === "findDegree") {
        const degrees = currentDegrees();
        const pc = randomItem(scale);
        state.question = { type, pc, degree: degrees.get(pc) };
        els.questionTask.textContent = t("findDegree")(degrees.get(pc));
        els.questionHint.textContent = `${t("currentKey")}: ${noteName(state.root)} ${modeLabel()}`;
      }

      if (type === "findRoots") {
        state.question = { type };
        els.questionTask.textContent = t("findRoots")(noteName(state.root));
        els.questionHint.textContent = t("rootProgress");
      }

      if (type === "scaleRun") {
        const direction = Math.random() > 0.5 ? t("up") : t("down");
        const orderedScale = currentScale();
        const ordered = direction === t("up") ? orderedScale : [...orderedScale].reverse();
        state.question = { type, ordered, step: 0, pc: ordered[0], direction };
        els.questionTask.textContent = t("scaleRunTitle")(noteName(state.root), modeLabel(), direction);
        els.questionHint.textContent = t("stepPrompt")(1, noteName(ordered[0]));
      }

      renderAll();
    }