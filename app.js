    function handleFretClick(hit) {
      if (state.chordRecognition) {
        handleChordClick(hit);
        return;
      }

      const q = state.question;
      if (!q) {
        setFeedback(t("clickedInfo")(hit.stringLabel, hit.fret, noteName(hit.pc)));
        return;
      }

      if (q.type === "identifyPosition") {
        const isTarget = hit.stringId === q.stringId && hit.fret === q.fret;
        setFeedback(isTarget ? t("positionIs")(noteName(q.pc)) : t("useButtons"), isTarget ? "ok" : "");
        animateNote(hit.el, isTarget ? "correct" : "wrong");
        return;
      }

      if (q.type === "findNote" || q.type === "findDegree") {
        const ok = hit.pc === q.pc;
        setFeedback(ok ? t("correctNote")(noteName(hit.pc)) : t("tryAgainThisIs")(noteName(hit.pc)), ok ? "ok" : "bad");
        animateNote(hit.el, ok ? "correct" : "wrong");
        noteAttempt(ok);
        return;
      }

      if (q.type === "findRoots") {
        const ok = hit.pc === state.root;
        if (ok) state.rootHits.add(hit.el.dataset.id);
        const total = document.querySelectorAll(`.note[data-pc="${state.root}"]:not(.out-range)`).length;
        setFeedback(ok ? t("rootsFound")(state.rootHits.size, total) : t("notRoot")(noteName(hit.pc)), ok ? "ok" : "bad");
        animateNote(hit.el, ok ? "correct" : "wrong");
        state.attemptCount += 1;
        if (ok && state.rootHits.size >= total) state.correctCount += 1;
        renderStats();
        if (state.rootHits.size >= total) {
          setFeedback(t("rootsDone")(total), "ok");
          if (state.autoNext) window.setTimeout(newQuestion, 650);
        }
        renderAll();
        return;
      }

      if (q.type === "scaleRun") {
        const ok = hit.pc === q.pc;
        animateNote(hit.el, ok ? "correct" : "wrong");
        if (!ok) {
          setFeedback(t("needNote")(noteName(q.pc), noteName(hit.pc)), "bad");
          noteAttempt(false);
          return;
        }
        q.step += 1;
        if (q.step >= q.ordered.length) {
          setFeedback(t("scaleDone"), "ok");
          q.step = 0;
          noteAttempt(true);
        } else {
          setFeedback(t("nextNote")(noteName(q.ordered[q.step])), "ok");
        }
        q.pc = q.ordered[q.step];
        els.questionHint.textContent = t("stepPrompt")(q.step + 1, noteName(q.pc));
        renderAll();
      }
    }

    function handleChordClick(hit) {
      if (!isInChordPosition(hit.fret)) {
        setFeedback(t("chordOutsidePosition"), "bad");
        animateNote(hit.el, "wrong");
        return;
      }

      const current = state.chordSelections.get(hit.stringId);
      if (current && current.fret === hit.fret) {
        state.chordSelections.delete(hit.stringId);
      } else {
        state.chordSelections.set(hit.stringId, {
          pc: hit.pc,
          fret: hit.fret,
          midi: hit.midi,
          stringId: hit.stringId,
          stringNumber: hit.stringNumber,
          stringLabel: hit.stringLabel
        });
      }
      setFeedback(t("chordOnStatus"), "ok");
      renderAll();
    }

    function answerName(pc) {
      const q = state.question;
      if (!q || q.type !== "identifyPosition") return;
      const ok = pc === q.pc;
      setFeedback(ok ? t("nameAnswer")(q.stringLabel, q.fret, noteName(q.pc)) : t("wrongNameAnswer")(noteName(q.pc)), ok ? "ok" : "bad");
      noteAttempt(ok);
      document.querySelectorAll(".note").forEach(note => {
        const isTarget = note.dataset.string === q.stringId && Number(note.dataset.fret) === q.fret;
        if (isTarget) animateNote(note, ok ? "correct" : "wrong");
      });
    }

    function showAnswer() {
      if (!state.question) return;
      state.practiceOverlay = true;
      els.togglePracticeOverlay.classList.add("active");
      const q = state.question;
      if (q.type === "identifyPosition") setFeedback(t("answerPosition")(noteName(q.pc)), "ok");
      if (q.type === "findNote") setFeedback(t("answerFindNote")(noteName(q.pc)), "ok");
      if (q.type === "findDegree") setFeedback(t("answerFindDegree")(q.degree, noteName(q.pc)), "ok");
      if (q.type === "findRoots") setFeedback(t("answerRoots")(noteName(state.root)), "ok");
      if (q.type === "scaleRun") setFeedback(t("answerScaleRun")(noteName(q.pc)), "ok");
      renderAll();
    }

    function ensureAudio() {
      if (!state.audioContext) {
        state.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      }
      if (state.audioContext.state === "suspended") state.audioContext.resume();
    }

    function tick() {
      ensureAudio();
      const ctx = state.audioContext;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = 880;
      gain.gain.setValueAtTime(0.0001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.25, ctx.currentTime + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.09);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.1);
      els.beatLight.classList.add("on");
      window.setTimeout(() => els.beatLight.classList.remove("on"), 90);
    }

    function startMetronome() {
      ensureAudio();
      stopMetronome();
      tick();
      state.metroTimer = window.setInterval(tick, 60000 / state.bpm);
      els.metroToggle.textContent = t("stop");
    }

    function stopMetronome() {
      if (state.metroTimer) window.clearInterval(state.metroTimer);
      state.metroTimer = null;
      els.metroToggle.textContent = t("start");
    }

    function bindEvents() {
      els.languageSelect.addEventListener("change", event => {
        state.language = event.target.value;
        state.question = null;
        state.rootHits.clear();
        els.answerButtons.innerHTML = "";
        setFeedback("");
        renderAll();
      });
      els.keySelect.addEventListener("change", event => {
        state.root = Number(event.target.value);
        state.question = null;
        renderAll();
      });
      els.accidentalSelect.addEventListener("change", event => {
        state.accidental = event.target.value;
        populateKeys();
        renderAll();
      });
      els.materialSelect.addEventListener("change", event => {
        state.material = event.target.value;
        state.mode = Object.keys(formulaGroup())[0];
        state.question = null;
        state.rootHits.clear();
        els.answerButtons.innerHTML = "";
        setFeedback("");
        renderAll();
      });
      els.modeSelect.addEventListener("change", event => {
        state.mode = event.target.value;
        state.question = null;
        renderAll();
      });
      els.fretCountSelect.addEventListener("change", event => {
        state.fretCount = Number(event.target.value);
        renderAll();
      });
      els.fretWindowSelect.addEventListener("change", event => {
        state.fretWindow = event.target.value;
        state.question = null;
        state.rootHits.clear();
        els.answerButtons.innerHTML = "";
        setFeedback("");
        renderAll();
      });
      els.visibilitySelect.addEventListener("change", event => {
        state.visibility = event.target.value;
        renderAll();
      });
      els.solfegeSelect.addEventListener("change", event => {
        state.solfege = event.target.value;
        renderAll();
      });
      els.toggleNames.addEventListener("click", () => {
        state.showNames = !state.showNames;
        els.toggleNames.classList.toggle("active", state.showNames);
        els.toggleNames.textContent = state.showNames ? t("showNames") : t("hideNames");
        renderAll();
      });
      els.togglePracticeOverlay.addEventListener("click", () => {
        state.practiceOverlay = !state.practiceOverlay;
        els.togglePracticeOverlay.classList.toggle("active", state.practiceOverlay);
        renderAll();
      });
      els.toggleAutoNext.addEventListener("click", () => {
        state.autoNext = !state.autoNext;
        els.toggleAutoNext.classList.toggle("active", state.autoNext);
        renderAll();
      });
      els.toggleChordRecognition.addEventListener("click", () => {
        state.chordRecognition = !state.chordRecognition;
        state.question = null;
        state.rootHits.clear();
        els.answerButtons.innerHTML = "";
        setFeedback(state.chordRecognition ? t("chordOnStatus") : "");
        renderAll();
      });
      els.newQuestion.addEventListener("click", newQuestion);
      els.showAnswer.addEventListener("click", showAnswer);
      els.cancelQuestion.addEventListener("click", cancelQuestion);
      els.resetStats.addEventListener("click", () => {
        state.correctCount = 0;
        state.attemptCount = 0;
        renderStats();
      });
      els.chordPositionSelect.addEventListener("change", event => {
        state.chordPosition = event.target.value;
        state.chordSelections.clear();
        setFeedback("");
        renderAll();
      });
      els.clearChord.addEventListener("click", () => {
        state.chordSelections.clear();
        setFeedback("");
        renderAll();
      });
      els.practiceType.addEventListener("change", () => {
        state.question = null;
        els.answerButtons.innerHTML = "";
        els.questionTask.textContent = t("noQuestionTask");
        els.questionHint.textContent = t("noQuestionHint");
        setFeedback("");
        renderAll();
      });
      els.bpmRange.addEventListener("input", event => {
        state.bpm = Number(event.target.value);
        els.bpmValue.textContent = state.bpm;
        if (state.metroTimer) startMetronome();
        saveSettings();
      });
      els.metroToggle.addEventListener("click", () => {
        if (state.metroTimer) stopMetronome();
        else startMetronome();
      });
      els.tapTempo.addEventListener("click", () => {
        const now = performance.now();
        if (state.lastTap) {
          const bpm = Math.round(60000 / (now - state.lastTap));
          if (bpm >= 40 && bpm <= 220) {
            state.bpm = bpm;
            els.bpmRange.value = String(bpm);
            els.bpmValue.textContent = bpm;
            if (state.metroTimer) startMetronome();
            saveSettings();
          }
        }
        state.lastTap = now;
      });
    }

    function syncControlDisclosure() {
      document.querySelectorAll(".control-section").forEach((section, index) => {
        section.open = isMobileLayout() ? index === 0 : true;
      });
    }

    mobileQuery.addEventListener("change", () => {
      syncControlDisclosure();
      if (state.fretWindow === "auto") {
        state.question = null;
        state.rootHits.clear();
        els.answerButtons.innerHTML = "";
        renderAll();
      }
    });

    handheldLandscapeQuery.addEventListener("change", () => {
      syncControlDisclosure();
      if (state.fretWindow === "auto") {
        state.question = null;
        state.rootHits.clear();
        els.answerButtons.innerHTML = "";
        renderAll();
      }
    });

    loadSettings();
    syncControlDisclosure();
    populateKeys();
    bindEvents();
    renderAll();
  
