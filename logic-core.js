    const els = {
      languageSelect: document.querySelector("#languageSelect"),
      keySelect: document.querySelector("#keySelect"),
      accidentalSelect: document.querySelector("#accidentalSelect"),
      materialSelect: document.querySelector("#materialSelect"),
      modeSelect: document.querySelector("#modeSelect"),
      fretCountSelect: document.querySelector("#fretCountSelect"),
      fretWindowSelect: document.querySelector("#fretWindowSelect"),
      visibilitySelect: document.querySelector("#visibilitySelect"),
      solfegeSelect: document.querySelector("#solfegeSelect"),
      toggleNames: document.querySelector("#toggleNames"),
      togglePracticeOverlay: document.querySelector("#togglePracticeOverlay"),
      toggleAutoNext: document.querySelector("#toggleAutoNext"),
      toggleChordRecognition: document.querySelector("#toggleChordRecognition"),
      fretboard: document.querySelector("#fretboard"),
      fretLabels: document.querySelector("#fretLabels"),
      markerRow: document.querySelector("#markerRow"),
      currentScalePill: document.querySelector("#currentScalePill"),
      displayModePill: document.querySelector("#displayModePill"),
      scaleMeta: document.querySelector("#scaleMeta"),
      scaleList: document.querySelector("#scaleList"),
      practiceType: document.querySelector("#practiceType"),
      questionTask: document.querySelector("#questionTask"),
      questionHint: document.querySelector("#questionHint"),
      answerButtons: document.querySelector("#answerButtons"),
      newQuestion: document.querySelector("#newQuestion"),
      showAnswer: document.querySelector("#showAnswer"),
      cancelQuestion: document.querySelector("#cancelQuestion"),
      resetStats: document.querySelector("#resetStats"),
      drillStats: document.querySelector("#drillStats"),
      feedback: document.querySelector("#feedback"),
      chordFretboard: document.querySelector("#chordFretboard"),
      chordFretLabels: document.querySelector("#chordFretLabels"),
      chordPositionSelect: document.querySelector("#chordPositionSelect"),
      chordStatus: document.querySelector("#chordStatus"),
      bestChord: document.querySelector("#bestChord"),
      alsoChords: document.querySelector("#alsoChords"),
      selectedChordNotes: document.querySelector("#selectedChordNotes"),
      clearChord: document.querySelector("#clearChord"),
      bpmRange: document.querySelector("#bpmRange"),
      bpmValue: document.querySelector("#bpmValue"),
      metroToggle: document.querySelector("#metroToggle"),
      tapTempo: document.querySelector("#tapTempo"),
      beatLight: document.querySelector("#beatLight"),
      staticText: {
        appTitle: document.querySelector("#appTitle"),
        appSubtitle: document.querySelector("#appSubtitle"),
        tonalityGroupTitle: document.querySelector("#tonalityGroupTitle"),
        materialGroupTitle: document.querySelector("#materialGroupTitle"),
        fretboardGroupTitle: document.querySelector("#fretboardGroupTitle"),
        drillGroupTitle: document.querySelector("#drillGroupTitle"),
        languageLabel: document.querySelector("#languageLabel"),
        keyLabel: document.querySelector("#keyLabel"),
        accidentalLabel: document.querySelector("#accidentalLabel"),
        materialLabel: document.querySelector("#materialLabel"),
        modeLabel: document.querySelector("#modeLabel"),
        fretCountLabel: document.querySelector("#fretCountLabel"),
        fretWindowLabel: document.querySelector("#fretWindowLabel"),
        visibilityLabel: document.querySelector("#visibilityLabel"),
        solfegeLabel: document.querySelector("#solfegeLabel"),
        noteNameLabel: document.querySelector("#noteNameLabel"),
        practiceLabel: document.querySelector("#practiceLabel"),
        scalePanelTitle: document.querySelector("#scalePanelTitle"),
        practicePanelTitle: document.querySelector("#practicePanelTitle"),
        practiceTypeLabel: document.querySelector("#practiceTypeLabel"),
        chordPanelTitle: document.querySelector("#chordPanelTitle"),
        chordPositionLabel: document.querySelector("#chordPositionLabel"),
        metronomeTitle: document.querySelector("#metronomeTitle"),
        tempoLabel: document.querySelector("#tempoLabel"),
        metroHelp: document.querySelector("#metroHelp")
      }
    };

    const state = {
      language: "en",
      root: 0,
      accidental: "sharp",
      material: "scale",
      mode: "major",
      fretCount: 24,
      fretWindow: "auto",
      visibility: "highlight",
      solfege: "fixed",
      showNames: true,
      practiceOverlay: false,
      autoNext: true,
      chordRecognition: false,
      chordPosition: "0-5",
      chordSelections: new Map(),
      question: null,
      rootHits: new Set(),
      correctCount: 0,
      attemptCount: 0,
      audioContext: null,
      metroTimer: null,
      bpm: 80,
      lastTap: 0
    };

    const mobileQuery = window.matchMedia("(max-width: 720px)");

    const storageKey = "guitar-fretboard-practice-v2";

    function mod(n, m) {
      return ((n % m) + m) % m;
    }

    function t(key) {
      return text[state.language][key];
    }

    function formulaGroup() {
      return state.material === "arpeggio" ? arpeggioFormulas : scaleFormulas;
    }

    function currentFormula() {
      const group = formulaGroup();
      if (!group[state.mode]) {
        state.mode = Object.keys(group)[0];
      }
      return group[state.mode];
    }

    function modeLabel(mode = state.mode) {
      return (formulaGroup()[mode] || currentFormula()).labels[state.language];
    }

    function stringLabel(string) {
      return t("stringLabel")(string.number, string.note);
    }

    function names() {
      return state.accidental === "sharp" ? sharpNames : flatNames;
    }

    function noteName(pc) {
      return names()[mod(pc, 12)];
    }

    function currentScale() {
      return currentFormula().intervals.map(interval => mod(state.root + interval, 12));
    }

    function currentDegrees() {
      const scale = currentScale();
      const degrees = currentFormula().degrees || scale.map((pc, index) => String(index + 1));
      return new Map(scale.map((pc, index) => [pc, degrees[index]]));
    }

    function noteLabel(pc) {
      const interval = mod(pc - state.root, 12);
      if (state.solfege === "degree") return currentDegrees().get(pc) || degreeNames[interval];
      if (state.solfege === "movableNote") return movableNames[interval];
      return noteName(pc);
    }

    function isMobileLayout() {
      return mobileQuery.matches;
    }

    function rangeFromValue(value, defaultRange) {
      if (value === "all") return { start: 0, end: Number(state.fretCount) };
      if (value === "auto") return defaultRange;
      const [start, end] = value.split("-").map(Number);
      return { start, end: Math.min(end, Number(state.fretCount)) };
    }

    function normalizeRange(range) {
      const maxFret = Number(state.fretCount);
      const start = Math.min(Math.max(0, range.start), maxFret);
      const end = Math.min(Math.max(start, range.end), maxFret);
      return { start, end };
    }

    function mainFretRange() {
      const autoRange = isMobileLayout()
        ? { start: 0, end: Math.min(5, Number(state.fretCount)) }
        : { start: 0, end: Number(state.fretCount) };
      return normalizeRange(rangeFromValue(state.fretWindow, autoRange));
    }

    function chordPositionRange() {
      if (state.chordPosition === "all") return { start: 0, end: Number(state.fretCount) };
      const [start, end] = state.chordPosition.split("-").map(Number);
      return { start, end: Math.min(end, Number(state.fretCount)) };
    }

    function chordDisplayRange() {
      if (state.chordPosition !== "all") return chordPositionRange();
      return { start: 0, end: Math.min(5, Number(state.fretCount)) };
    }

    function isInChordPosition(fret) {
      const { start, end } = chordPositionRange();
      return fret >= start && fret <= end;
    }

    function selectedChordArray() {
      return [...state.chordSelections.values()].sort((a, b) => b.stringNumber - a.stringNumber);
    }

    function selectedChordPcs() {
      return [...new Set(selectedChordArray().map(note => note.pc))];
    }

    function bassNotePc() {
      const selected = selectedChordArray();
      if (!selected.length) return null;
      return [...selected].sort((a, b) => a.midi - b.midi)[0].pc;
    }

    function intervalName(interval, typeSymbol = "") {
      const map = {
        0: "Root",
        1: "b9",
        2: typeSymbol.includes("add9") || typeSymbol.includes("9") ? "9" : "2",
        3: "b3",
        4: "3",
        5: "11",
        6: "b5/#11",
        7: "5",
        8: "#5",
        9: typeSymbol.includes("13") ? "13" : "6",
        10: "b7",
        11: "7"
      };
      return map[interval] || String(interval);
    }

    function missingLabel(interval, typeSymbol) {
      if (interval === 0) return "noRoot";
      if (interval === 3 || interval === 4) return "no3";
      if (interval === 6 || interval === 7 || interval === 8) return "no5";
      if (interval === 9) return typeSymbol.includes("13") ? "no13" : "no6";
      if (interval === 10 || interval === 11) return "no7";
      if (interval === 1 || interval === 2) return "no9";
      if (interval === 5) return "no11";
      return `no${intervalName(interval, typeSymbol)}`;
    }

    function formatChordSymbol(rootPc, type, bassPcValue, missing = []) {
      const root = noteName(rootPc);
      const bass = bassPcValue !== null && bassPcValue !== rootPc ? `/${noteName(bassPcValue)}` : "";
      const uniqueMissing = [...new Set(missing.map(interval => missingLabel(interval, type.symbol)))];
      const omit = uniqueMissing.length ? `(${uniqueMissing.join(",")})` : "";
      return `${root}${type.symbol}${omit}${bass}`;
    }

    function missingDefinesChordType(type, missing) {
      const symbol = type.symbol;
      if ((symbol.includes("6") || symbol.includes("13")) && missing.includes(9)) return true;
      if ((symbol.includes("maj7") || symbol.includes("Maj7") || symbol.includes("mMaj") || symbol.includes("7")) && missing.some(interval => [9, 10, 11].includes(interval))) return true;
      if (symbol.includes("b9") && missing.includes(1)) return true;
      if (symbol.includes("#9") && missing.includes(3)) return true;
      if ((symbol.includes("9") || symbol.includes("add9")) && !symbol.includes("b9") && !symbol.includes("#9") && missing.includes(2)) return true;
      if (symbol.includes("#11") && missing.includes(6)) return true;
      if (symbol.includes("11") && !symbol.includes("#11") && missing.includes(5)) return true;
      if ((symbol.includes("b5") || symbol.includes("dim")) && missing.includes(6)) return true;
      if ((symbol.includes("#5") || symbol.includes("aug")) && missing.includes(8)) return true;
      return false;
    }
