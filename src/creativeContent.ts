import type { SupportedLanguage } from "@open-party-lab/game-core";

export type CreativeTask = {
  id: string;
  kind: "text" | "photo" | "draw";
  category: string;
  prompt: string;
  maxStrokes?: 1 | 2;
  useOtherAvatar?: boolean;
};

type TaskRow = readonly [CreativeTask["kind"], string, string, string, string];

// Each pair is authored for this game; keep ids language independent so rounds
// remain stable when a room changes its display language.
const rows: readonly TaskRow[] = [
  ["text", "Caption", "Schreibt eine Bildunterschrift für den Moment, in dem die Gruppe merkt, dass niemand den Weg kennt.", "Write a caption for the moment the group realizes nobody knows the way.", "text-way"],
  ["text", "Caption", "Erfindet einen dramatischen Filmtitel für euren letzten gemeinsamen Snack.", "Invent a dramatic movie title for your last shared snack.", "text-snack-movie"],
  ["text", "Werbespruch", "Schreibt einen Werbespruch für die erstaunlichste Fähigkeit eurer Gruppe.", "Write an advert slogan for your group's most surprising talent.", "text-group-slogan"],
  ["text", "Mini-Geschichte", "Beschreibt in einem Satz, wie ein völlig normaler Dienstag zum Abenteuer wurde.", "In one sentence, describe how a perfectly ordinary Tuesday became an adventure.", "text-tuesday"],
  ["text", "Caption", "Gebt dem unsichtbaren Haustier der Gruppe einen Namen und eine kurze Charakterbeschreibung.", "Name the group's imaginary pet and give it a tiny character description.", "text-imaginary-pet"],
  ["text", "Ausrede", "Erfindet eine möglichst charmante Ausrede dafür, warum ihr fünf Minuten zu spät seid.", "Invent the most charming excuse for being five minutes late.", "text-late-excuse"],
  ["text", "Schlagzeile", "Schreibt eine harmlose Zeitungsüberschrift über das größte Talent am Tisch.", "Write a harmless newspaper headline about the biggest talent at the table.", "text-headline"],
  ["text", "Fantasie", "Welchen völlig unnötigen Feiertag sollte eure Gruppe einführen? Ein Satz genügt.", "What completely unnecessary holiday should your group invent? One sentence is enough.", "text-holiday"],
  ["text", "Caption", "Vertont die Gedanken einer Zimmerpflanze, die eure Gruppe beobachtet.", "Write the thoughts of a houseplant watching your group.", "text-plant"],
  ["text", "Titel", "Findet einen Buchtitel für die chaotischste gemeinsame Erinnerung.", "Find a book title for your most chaotic shared memory.", "text-memory-book"],
  ["text", "Superkraft", "Welche winzige, völlig nutzlose Superkraft würde einer Person am Tisch heute helfen?", "What tiny, completely useless superpower would help someone at the table today?", "text-tiny-power"],
  ["text", "Lob", "Schreibt einer Person am Tisch ein übertrieben feierliches Lob für etwas Alltägliches.", "Give someone at the table an absurdly grand compliment for something ordinary.", "text-grand-compliment"],
  ["text", "Dialog", "Schreibt den ersten Satz eines Gesprächs zwischen zwei Socken nach einer langen Reise.", "Write the opening line of a conversation between two socks after a long journey.", "text-socks"],
  ["text", "Caption", "Was wäre der Untertitel eines Gruppenfotos, auf dem alle in verschiedene Richtungen schauen?", "What would be the subtitle of a group photo where everyone looks a different way?", "text-photo-subtitle"],
  ["text", "Erfindung", "Erfindet ein Gerät, das euren Spieleabend einfacher macht, aber ein kleines Problem löst.", "Invent a gadget that makes game night easier by solving one very small problem.", "text-gadget"],
  ["text", "Rollen", "Welche überraschende Nebenrolle hätte eine Person am Tisch in einem Weltraumfilm?", "What surprising supporting role would someone at the table have in a space movie?", "text-space-role"],
  ["text", "Motto", "Formuliert ein kurzes Motto für einen Tag, an dem alles ein bisschen schiefgeht.", "Write a short motto for a day when everything goes slightly wrong.", "text-motto"],
  ["text", "Restaurant", "Gebt einem imaginären Restaurant der Gruppe einen Namen und sein seltsamstes Gericht.", "Name your group's imaginary restaurant and its strangest dish.", "text-restaurant"],
  ["text", "Caption", "Beschreibt in einem Satz, wie ein sehr höflicher Roboter euren Spieleabend zusammenfassen würde.", "In one sentence, describe how a very polite robot would recap your game night.", "text-robot"],

  ["photo", "Selfie", "Macht ein freundliches Selfie mit eurem besten Überraschungsgesicht.", "Take a friendly selfie with your best surprised expression.", "photo-surprise"],
  ["photo", "Fundstück", "Fotografiert einen Gegenstand in Reichweite, der heute schon nützlich war.", "Photograph an object within reach that has already been useful today.", "photo-useful"],
  ["photo", "Farbjagd", "Findet und fotografiert etwas in eurer Nähe, das eure Lieblingsfarbe hat.", "Find and photograph something nearby in your favourite colour.", "photo-colour"],
  ["photo", "Stillleben", "Arrangiert zwei harmlose Alltagsgegenstände wie ein Museumskunstwerk und fotografiert sie.", "Arrange two harmless everyday objects like museum art and take a photo.", "photo-museum"],
  ["photo", "Selfie", "Macht ein Selfie, auf dem ihr so tut, als hättet ihr gerade eine sehr gute Idee.", "Take a selfie pretending you just had a brilliant idea.", "photo-idea"],
  ["photo", "Nahaufnahme", "Fotografiert ein interessantes Muster oder eine Textur direkt um euch herum.", "Photograph an interesting pattern or texture right around you.", "photo-texture"],
  ["photo", "Fundstück", "Macht ein Foto von einem Gegenstand, der wie der Anfang einer Geschichte aussieht.", "Take a photo of an object that looks like the start of a story.", "photo-story-object"],
  ["photo", "Selfie", "Macht ein fröhliches Selfie mit einer Pose wie auf einem Albumcover.", "Take a cheerful selfie in a pose that belongs on an album cover.", "photo-album"],
  ["photo", "Farbjagd", "Fotografiert drei Dinge in eurer Nähe, die zusammen eine schöne Farbkombination ergeben.", "Photograph three nearby things that make a pleasing colour combination.", "photo-palette"],
  ["photo", "Stillleben", "Baut aus einem Gegenstand in Reichweite eine winzige Bühne und fotografiert sie.", "Turn an object within reach into a tiny stage and photograph it.", "photo-stage"],
  ["photo", "Selfie", "Macht ein Selfie mit dem Gesichtsausdruck: ‚Ich habe den geheimen Knopf gefunden.‘", "Take a selfie with the expression: 'I found the secret button.'", "photo-button"],
  ["photo", "Fundstück", "Fotografiert etwas Kleines in Reichweite, das ihr gern einem Außerirdischen zeigen würdet.", "Photograph something small within reach that you would show an alien.", "photo-alien"],

  ["draw", "Kritzelei", "Zeichnet eurem Selfie eine winzige Krone und einen passenden Fantasie-Titel.", "Draw a tiny crown and a fitting imaginary title over your selfie.", "draw-crown"],
  ["draw", "Kritzelei", "Macht aus einem Selfie eine freundliche Comicfigur mit zwei einfachen Linien.", "Turn a selfie into a friendly comic character using just a couple of simple lines.", "draw-comic"],
  ["draw", "Foto-Remix", "Verpasst einem Gegenstand auf eurem Foto ein Paar lustige Augen.", "Give an object in your photo a pair of funny eyes.", "draw-eyes"],
  ["draw", "Kritzelei", "Zeichnet auf eine leere Fläche eine winzige Insel mit einem sehr gemütlichen Haus.", "On a blank canvas, draw a tiny island with a very cosy house.", "draw-island"],
  ["draw", "Foto-Remix", "Zeichnet eine gestrichelte Schatzkarte über euer Foto und markiert den Schatz.", "Draw a dotted treasure map over your photo and mark the treasure.", "draw-map"],
  ["draw", "Kritzelei", "Erfindet auf einer leeren Fläche ein Maskottchen für euren Spieleabend.", "Invent a mascot for game night on a blank canvas.", "draw-mascot"],
  ["draw", "Foto-Remix", "Gebt einem Gegenstand auf eurem Foto einen Umhang und eine Superheldenpose.", "Give an object in your photo a cape and a superhero pose.", "draw-cape"],
  ["draw", "Kritzelei", "Zeichnet ein Fantasie-Wetter-Symbol über euer Selfie: Was für ein Tag seid ihr?", "Draw an imaginary weather symbol over your selfie: what kind of day are you?", "draw-weather"],
  ["draw", "Foto-Remix", "Lasst auf eurem Foto eine kleine Figur an einem Gegenstand hochklettern.", "Add a tiny character climbing an object in your photo.", "draw-climber"],
  ["draw", "Kritzelei", "Zeichnet auf einer leeren Fläche ein Raumschiff, das von einem Snack angetrieben wird.", "On a blank canvas, draw a spaceship powered by a snack.", "draw-snackship"],
  ["draw", "Foto-Remix", "Malt eurem Selfie eine Sprechblase mit einem kurzen, freundlichen Satz.", "Add a speech bubble with a short, friendly line to your selfie.", "draw-speech"],
  ["draw", "Kritzelei", "Zeichnet ein neues Fantasie-Logo für eure Gruppe, nur aus Formen und Linien.", "Draw a new imaginary logo for your group using only shapes and lines.", "draw-logo"],
  ["draw", "Foto-Remix", "Ihr bekommt das Selfie einer anderen Person. Verwandelt es mit einer Zeichnung in eine Filmfigur.", "You get another player's selfie. Turn it into a movie character with a drawing.", "draw-other-selfie"],
  ["draw", "Ein Strich", "Zeichnet mit genau einem Strich ein völlig neues Haustier für eure Gruppe.", "Draw a brand-new group pet using exactly one stroke.", "draw-one-stroke"],
  ["draw", "Zwei Striche", "Zeichnet mit höchstens zwei Strichen eine lustige neue Frisur.", "Draw a funny new hairstyle using at most two strokes.", "draw-two-strokes"],
];

export function getCreativeTasks(language: SupportedLanguage): CreativeTask[] {
  const english = language === "en";
  return rows.map(([kind, category, de, en, id]) => ({
    id,
    kind,
    category,
    prompt: english ? en : de,
    ...(id === "draw-one-stroke" ? { maxStrokes: 1 as const } : {}),
    ...(id === "draw-two-strokes" ? { maxStrokes: 2 as const } : {}),
    ...(id === "draw-other-selfie" ? { useOtherAvatar: true } : {}),
  }));
}
