
    const sharpNames = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
    const flatNames = ["C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B"];
    const movableNames = ["Do", "Ra", "Re", "Me", "Mi", "Fa", "Fi", "Sol", "Le", "La", "Te", "Ti"];
    const degreeNames = ["1", "b2", "2", "b3", "3", "4", "#4", "5", "b6", "6", "b7", "7"];
    const strings = [
      { id: "s1", number: 1, note: "E", pc: 4, midi: 64, size: 2 },
      { id: "s2", number: 2, note: "B", pc: 11, midi: 59, size: 2 },
      { id: "s3", number: 3, note: "G", pc: 7, midi: 55, size: 3 },
      { id: "s4", number: 4, note: "D", pc: 2, midi: 50, size: 4 },
      { id: "s5", number: 5, note: "A", pc: 9, midi: 45, size: 5 },
      { id: "s6", number: 6, note: "E", pc: 4, midi: 40, size: 6 }
    ];
    const scaleFormulas = {
      major: { labels: { zh: "大调", en: "Major" }, intervals: [0, 2, 4, 5, 7, 9, 11], degrees: ["1", "2", "3", "4", "5", "6", "7"] },
      naturalMinor: { labels: { zh: "自然小调", en: "Natural minor" }, intervals: [0, 2, 3, 5, 7, 8, 10], degrees: ["1", "2", "b3", "4", "5", "b6", "b7"] },
      harmonicMinor: { labels: { zh: "和声小调", en: "Harmonic minor" }, intervals: [0, 2, 3, 5, 7, 8, 11], degrees: ["1", "2", "b3", "4", "5", "b6", "7"] },
      melodicMinor: { labels: { zh: "爵士旋律小调", en: "Jazz melodic minor" }, intervals: [0, 2, 3, 5, 7, 9, 11], degrees: ["1", "2", "b3", "4", "5", "6", "7"] },
      majorPentatonic: { labels: { zh: "大调五声音阶", en: "Major pentatonic" }, intervals: [0, 2, 4, 7, 9], degrees: ["1", "2", "3", "5", "6"] },
      minorPentatonic: { labels: { zh: "小调五声音阶", en: "Minor pentatonic" }, intervals: [0, 3, 5, 7, 10], degrees: ["1", "b3", "4", "5", "b7"] }
    };
    const arpeggioFormulas = {
      majorTriad: { labels: { zh: "大三和弦琶音", en: "Major triad" }, intervals: [0, 4, 7], degrees: ["1", "3", "5"] },
      minorTriad: { labels: { zh: "小三和弦琶音", en: "Minor triad" }, intervals: [0, 3, 7], degrees: ["1", "b3", "5"] },
      diminishedTriad: { labels: { zh: "减三和弦琶音", en: "Diminished triad" }, intervals: [0, 3, 6], degrees: ["1", "b3", "b5"] },
      augmentedTriad: { labels: { zh: "增三和弦琶音", en: "Augmented triad" }, intervals: [0, 4, 8], degrees: ["1", "3", "#5"] },
      major7: { labels: { zh: "大七和弦琶音", en: "Maj7 arpeggio" }, intervals: [0, 4, 7, 11], degrees: ["1", "3", "5", "7"] },
      dominant7: { labels: { zh: "属七和弦琶音", en: "Dom7 arpeggio" }, intervals: [0, 4, 7, 10], degrees: ["1", "3", "5", "b7"] },
      minor7: { labels: { zh: "小七和弦琶音", en: "Min7 arpeggio" }, intervals: [0, 3, 7, 10], degrees: ["1", "b3", "5", "b7"] },
      halfDiminished7: { labels: { zh: "半减七和弦琶音", en: "m7b5 arpeggio" }, intervals: [0, 3, 6, 10], degrees: ["1", "b3", "b5", "b7"] },
      diminished7: { labels: { zh: "减七和弦琶音", en: "Dim7 arpeggio" }, intervals: [0, 3, 6, 9], degrees: ["1", "b3", "b5", "bb7"] },
      minorMajor7: { labels: { zh: "小大七和弦琶音", en: "MinMaj7 arpeggio" }, intervals: [0, 3, 7, 11], degrees: ["1", "b3", "5", "7"] }
    };
    const chordTypes = [
      { symbol: "5", name: "Power chord", intervals: [0, 7], required: [0, 7] },
      { symbol: "", name: "Major", intervals: [0, 4, 7], required: [0, 4] },
      { symbol: "m", name: "Minor", intervals: [0, 3, 7], required: [0, 3] },
      { symbol: "dim", name: "Diminished", intervals: [0, 3, 6], required: [0, 3, 6] },
      { symbol: "aug", name: "Augmented", intervals: [0, 4, 8], required: [0, 4, 8] },
      { symbol: "sus2", name: "Suspended 2nd", intervals: [0, 2, 7], required: [0, 2, 7] },
      { symbol: "sus4", name: "Suspended 4th", intervals: [0, 5, 7], required: [0, 5, 7] },
      { symbol: "6", name: "Major 6", intervals: [0, 4, 7, 9], required: [0, 4, 9] },
      { symbol: "m6", name: "Minor 6", intervals: [0, 3, 7, 9], required: [0, 3, 9] },
      { symbol: "add9", name: "Add 9", intervals: [0, 2, 4, 7], required: [0, 2, 4] },
      { symbol: "madd9", name: "Minor add 9", intervals: [0, 2, 3, 7], required: [0, 2, 3] },
      { symbol: "6/9", name: "Six nine", intervals: [0, 2, 4, 7, 9], required: [0, 2, 4, 9] },
      { symbol: "m6/9", name: "Minor six nine", intervals: [0, 2, 3, 7, 9], required: [0, 2, 3, 9] },
      { symbol: "maj7", name: "Major 7", intervals: [0, 4, 7, 11], required: [0, 4, 11] },
      { symbol: "7", name: "Dominant 7", intervals: [0, 4, 7, 10], required: [0, 4, 10] },
      { symbol: "m7", name: "Minor 7", intervals: [0, 3, 7, 10], required: [0, 3, 10] },
      { symbol: "mMaj7", name: "Minor major 7", intervals: [0, 3, 7, 11], required: [0, 3, 11] },
      { symbol: "m7b5", name: "Half diminished 7", intervals: [0, 3, 6, 10], required: [0, 3, 6, 10] },
      { symbol: "dim7", name: "Diminished 7", intervals: [0, 3, 6, 9], required: [0, 3, 6, 9] },
      { symbol: "7b5", name: "Dominant 7 flat 5", intervals: [0, 4, 6, 10], required: [0, 4, 6, 10] },
      { symbol: "7#5", name: "Dominant 7 sharp 5", intervals: [0, 4, 8, 10], required: [0, 4, 8, 10] },
      { symbol: "maj7#5", name: "Major 7 sharp 5", intervals: [0, 4, 8, 11], required: [0, 4, 8, 11] },
      { symbol: "9", name: "Dominant 9", intervals: [0, 2, 4, 7, 10], required: [0, 2, 4, 10] },
      { symbol: "maj9", name: "Major 9", intervals: [0, 2, 4, 7, 11], required: [0, 2, 4, 11] },
      { symbol: "m9", name: "Minor 9", intervals: [0, 2, 3, 7, 10], required: [0, 2, 3, 10] },
      { symbol: "mMaj9", name: "Minor major 9", intervals: [0, 2, 3, 7, 11], required: [0, 2, 3, 11] },
      { symbol: "7b9", name: "Dominant 7 flat 9", intervals: [0, 1, 4, 7, 10], required: [0, 1, 4, 10] },
      { symbol: "7#9", name: "Dominant 7 sharp 9", intervals: [0, 3, 4, 7, 10], required: [0, 3, 4, 10] },
      { symbol: "9b5", name: "Dominant 9 flat 5", intervals: [0, 2, 4, 6, 10], required: [0, 2, 4, 6, 10] },
      { symbol: "9#5", name: "Dominant 9 sharp 5", intervals: [0, 2, 4, 8, 10], required: [0, 2, 4, 8, 10] },
      { symbol: "7b9b5", name: "Dominant 7 flat 9 flat 5", intervals: [0, 1, 4, 6, 10], required: [0, 1, 4, 6, 10] },
      { symbol: "7b9#5", name: "Dominant 7 flat 9 sharp 5", intervals: [0, 1, 4, 8, 10], required: [0, 1, 4, 8, 10] },
      { symbol: "7#9b5", name: "Dominant 7 sharp 9 flat 5", intervals: [0, 3, 4, 6, 10], required: [0, 3, 4, 6, 10] },
      { symbol: "7#9#5", name: "Dominant 7 sharp 9 sharp 5", intervals: [0, 3, 4, 8, 10], required: [0, 3, 4, 8, 10] },
      { symbol: "11", name: "Dominant 11", intervals: [0, 4, 5, 7, 10], required: [0, 4, 5, 10] },
      { symbol: "m11", name: "Minor 11", intervals: [0, 3, 5, 7, 10], required: [0, 3, 5, 10] },
      { symbol: "maj9#11", name: "Major 9 sharp 11", intervals: [0, 2, 4, 6, 7, 11], required: [0, 2, 4, 6, 11] },
      { symbol: "7#11", name: "Dominant 7 sharp 11", intervals: [0, 4, 6, 7, 10], required: [0, 4, 6, 10] },
      { symbol: "9#11", name: "Dominant 9 sharp 11", intervals: [0, 2, 4, 6, 7, 10], required: [0, 2, 4, 6, 10] },
      { symbol: "13", name: "Dominant 13", intervals: [0, 2, 4, 7, 9, 10], required: [0, 4, 9, 10] },
      { symbol: "maj13", name: "Major 13", intervals: [0, 2, 4, 7, 9, 11], required: [0, 4, 9, 11] },
      { symbol: "m13", name: "Minor 13", intervals: [0, 2, 3, 7, 9, 10], required: [0, 3, 9, 10] },
      { symbol: "13b9", name: "Dominant 13 flat 9", intervals: [0, 1, 4, 7, 9, 10], required: [0, 1, 4, 9, 10] },
      { symbol: "13#11", name: "Dominant 13 sharp 11", intervals: [0, 2, 4, 6, 7, 9, 10], required: [0, 4, 6, 9, 10] },
      { symbol: "9sus4", name: "Dominant 9 sus4", intervals: [0, 2, 5, 7, 10], required: [0, 2, 5, 10] },
      { symbol: "13sus4", name: "Dominant 13 sus4", intervals: [0, 2, 5, 7, 9, 10], required: [0, 5, 9, 10] }
    ];