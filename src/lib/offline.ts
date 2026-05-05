import type { ChatStreamEvent, CompositionEntry } from "./types";
import type { BriefDraft, Critique } from "./brief-schema";
import type { ProposeCompositionInput } from "./tools";

interface OfflineTurn {
  user: string;
  assistantPreface: string;
  proposal: ProposeCompositionInput;
}

interface OfflineScenario {
  id: "storm" | "library" | "belle-aire-candle";
  label: string;
  turns: OfflineTurn[];
  brief: BriefDraft;
  critique: Critique;
}

export const OFFLINE_SCENARIOS: OfflineScenario[] = [
  {
    id: "storm",
    label: "Storm over Provence",
    turns: [
      {
        user: "I want something that smells like a thunderstorm rolling over a lavender field at dusk.",
        assistantPreface:
          "A storm at the edge of the herbaceous — that's a very specific weather report. We don't have lavender on this organ, but we have its better-dressed cousins. I'd open with bergamote for the petrichor brightness and a touch of feuille de violette for that wet-metal cucumber edge that comes off cold soil right before the rain breaks. At the heart, géranium bourbon and violette take the place lavender would normally hold — same coolness, more skin. Iris pulls everything toward the cold-violet powder of the air just before lightning. At the base, vétiver Haïti for the wet earth and ambroxan for the radiant warmth where the storm meets a body. — Is the storm in the distance or breaking overhead?",
        proposal: {
          rationale:
            "A green-floral-vetiver opening that suggests lavender without lavender, with cold violet and damp earth in the heart and base.",
          add: [
            { compoundId: "bergamote-italian", percent: 5, role: "top" },
            { compoundId: "feuille-de-violette", percent: 2, role: "top" },
            { compoundId: "geranium-bourbon", percent: 5, role: "heart" },
            { compoundId: "violette", percent: 4, role: "heart" },
            { compoundId: "iris-orris", percent: 4, role: "heart" },
            { compoundId: "vetiver-haiti", percent: 6, role: "base" },
            { compoundId: "ambroxan", percent: 4, role: "base" },
          ],
          remove: [],
        },
      },
      {
        user: "Breaking overhead.",
        assistantPreface:
          "Then we pull back the violette — overhead means less powder, more weight. I'm doubling the vétiver and adding galbanum at the top for the green ferocity of crushed stems in driving rain. A whisper of encens at the base for the ozone-after-the-strike. Less pretty, more weather. The name in my head is *Orage Violet* — the violet here is not the flower but the colour of the sky a moment before the sky is white.",
        proposal: {
          rationale:
            "Tighten toward the violent: more vetiver, less violet, galbanum for green tension, frankincense for ozone-smoke.",
          add: [
            { compoundId: "galbanum", percent: 2, role: "top" },
            { compoundId: "violette", percent: 2, role: "heart" },
            { compoundId: "vetiver-haiti", percent: 10, role: "base" },
            { compoundId: "encens", percent: 3, role: "base" },
          ],
          remove: [],
        },
      },
    ],
    brief: {
      name: "Orage Violet",
      tagline: "the storm at the threshold of summer",
      story:
        "A Provençal storm doesn't announce itself politely. It changes the air an hour before it arrives — colder, greener, faintly metallic. *Orage Violet* lives in that hour. Bergamot and crushed violet leaf open like the first drops on dry stone; galbanum sharpens the green to a knife. At the heart, geranium and violet refuse to play the lavender they replace — cooler, more skin-adjacent, less obvious. Vetiver Haïti and a whisper of frankincense form the wet earth and the ozone after the strike. A composition for someone who prefers the moment before to the event itself.",
      targetConsumer:
        "A buyer who reads weather as architecture and prefers their luxury quiet, slightly austere, and recognizable only to those who already know.",
      occasion:
        "Late afternoon in summer; charcoal linen; an evening that may or may not happen as planned.",
      application: "fine-fragrance",
      recommendedConcentration: "Eau de Parfum, 18% concentration",
      pyramid: {
        top: [
          { compoundId: "bergamote-italian", percent: 5 },
          { compoundId: "feuille-de-violette", percent: 2 },
          { compoundId: "galbanum", percent: 2 },
        ],
        heart: [
          { compoundId: "geranium-bourbon", percent: 5 },
          { compoundId: "violette", percent: 4 },
          { compoundId: "iris-orris", percent: 4 },
        ],
        base: [
          { compoundId: "vetiver-haiti", percent: 10 },
          { compoundId: "ambroxan", percent: 4 },
          { compoundId: "encens", percent: 3 },
        ],
      },
      marketingCopy: {
        shortDescription:
          "A green-violet vetiver built around the hour before a Provençal storm. Cold, slightly metallic, almost austere.",
        longDescription:
          "Some perfumes are weather. *Orage Violet* is the colder, greener air that arrives an hour before the storm — the moment lavender fields turn the colour of the sky. Bergamot and crushed violet leaf form the first drops on dry stone. Galbanum sharpens the opening with a knife of green. At the heart, geranium and violet inherit the cool register lavender would hold, then concede it to iris — powder cold enough to read as light. Vetiver Haïti and a whisper of frankincense form the wet earth and the ozone after the strike. The amber radiance of ambroxan keeps the whole structure on skin without overwhelming it. A perfume for the moment before, not the event itself.",
        bottleHints:
          "Smoked-grey glass, magnetic stopper in oxidized brass, no logo on the front face.",
      },
      safetyProfile: {
        physicalHazards: [
          "Combustible liquid (ethanol-based fragrance solvent base)",
          "May produce flammable vapors in enclosed spaces",
        ],
        healthHazards: [
          "May cause skin sensitization in susceptible individuals (galbanum, geranium constituents)",
          "Eye irritant at high concentration; avoid contact with eyes",
        ],
        ifraSummary:
          "Compliant with IFRA 51st Amendment for Category 4 (fine fragrance) at the indicated concentration. Galbanum and geraniol-bearing materials within published category limits.",
        flashpoint: "21–24°C / 70–75°F (estimated; ethanol-base)",
        storage:
          "Store in original packaging at 15–20°C, away from direct sunlight and heat sources.",
      },
      perfumerNotes:
        "The composition resists the lavender it replaces. Geranium and violet do the cool-herbaceous work; iris carries the powder; vetiver Haïti and a whisper of frankincense do the storm. Galbanum is dosed at the absolute minimum that still reads. — M.B.",
    },
    critique: {
      overall:
        "A confident, well-structured concept brief. Voice is consistent. Composition tracks the conversation. Two minor sharpening opportunities and one small pyramid imbalance to address before transmission.",
      issues: [
        {
          severity: "minor",
          section: "tagline",
          comment:
            '"the storm at the threshold of summer" is good but pulls toward seasonal cliché. Consider a tagline that names a moment instead of a season.',
        },
        {
          severity: "minor",
          section: "pyramid",
          comment:
            "Heart total is at 13% while base is at 17%. The current weighting reads slightly bottom-heavy for an EdP — consider lifting iris by 1% if the perfumer wants more centred warmth.",
        },
        {
          severity: "major",
          section: "safety",
          comment:
            "Galbanum is correctly noted as a sensitizer constituent but the IFRA summary should mention that vetiver content (currently 10%) sits well within Cat 4 limits — the brief should call out the dose-vs-limit confidence explicitly for the perfumer downstream.",
        },
      ],
      shouldRevise: false,
    },
  },

  {
    id: "library",
    label: "First library card",
    turns: [
      {
        user: "A child's memory of a public library — old paper, polished wood, the librarian's perfume from across the desk.",
        assistantPreface:
          "Three smells, three eras, one room. The paper is iris — orris butter, that cold-violet warmth that reads as old skin and old paper at the same time. The shelves are santal mysore for the polished cream, cèdre virginia for the pencil-shaving dryness underneath. Now the librarian — that perfume across the desk, ten feet away, never close enough to know — that's a hedione lift over fève tonka and a whisper of poivre rose. Vanilla bourbon pulled almost to nothing in the base, just for the warmth of a child's hand on a card catalogue. — How present is the librarian, are they leaning over your book or three aisles away?",
        proposal: {
          rationale:
            "Iris-paper and sandalwood-shelf with a hedione-pink-pepper-tonka librarian floating above.",
          add: [
            { compoundId: "iris-orris", percent: 6, role: "heart" },
            { compoundId: "santal-mysore", percent: 6, role: "base" },
            { compoundId: "cedre-virginia", percent: 5, role: "heart" },
            { compoundId: "poivre-rose", percent: 2, role: "heart" },
            { compoundId: "hedione-pure", percent: 8, role: "heart" },
            { compoundId: "feve-tonka", percent: 3, role: "base" },
            { compoundId: "vanille-bourbon", percent: 1, role: "base" },
          ],
          remove: [],
        },
      },
    ],
    brief: {
      name: "Catalogue",
      tagline: "a perfume from three aisles away",
      story:
        "*Catalogue* is built around a child's memory of a public library — old paper, polished wood, the librarian's perfume from across the desk. Iris orris butter carries the cold-violet warmth of paper that has sat on a shelf for thirty years. Santal Mysore and Virginia cedar form the polished wood and pencil-shavings of the shelving. Hedione lifts the librarian into the room — a presence three aisles away, never close enough to identify. Pink pepper sparkles where the desk lamp catches. Tonka bean and a thread of vanilla bourbon hold the warmth of a child's hand on a card catalogue. A nostalgic perfume that refuses sentimentality.",
      targetConsumer:
        "Adults who collect books and think of fragrance as a form of memory work; readers more than wearers.",
      occasion:
        "Quiet domestic afternoons; one sweater; a book that has been waiting on a shelf for years.",
      application: "fine-fragrance",
      recommendedConcentration: "Eau de Parfum, 16% concentration",
      pyramid: {
        top: [{ compoundId: "poivre-rose", percent: 2 }],
        heart: [
          { compoundId: "iris-orris", percent: 6 },
          { compoundId: "cedre-virginia", percent: 5 },
          { compoundId: "hedione-pure", percent: 8 },
        ],
        base: [
          { compoundId: "santal-mysore", percent: 6 },
          { compoundId: "feve-tonka", percent: 3 },
          { compoundId: "vanille-bourbon", percent: 1 },
        ],
      },
      marketingCopy: {
        shortDescription:
          "Iris paper, sandalwood shelves, a librarian three aisles away. A perfume for memory work.",
        longDescription:
          "*Catalogue* opens with the dry shimmer of pink pepper and the cold-violet powder of iris orris butter — the smell of paper that has been on a shelf for three decades. Virginia cedar deepens the room with pencil-shaving dryness. Hedione lifts the librarian's perfume into the air — a presence three aisles away, never close enough to identify. Sandalwood Mysore polishes the shelving. A thread of tonka bean and Madagascar vanilla holds the warmth of a child's hand on a card catalogue. The whole composition is calibrated to read as light and absent, like a memory you only catch in your peripheral vision. *Catalogue* is built for collectors and readers — a perfume more interested in attention than in display.",
        bottleHints:
          "Cream-glazed ceramic flask in the proportion of an old library card; thin gold band at the neck; label set in a typewriter face.",
      },
      safetyProfile: {
        physicalHazards: ["Combustible liquid (ethanol-based fragrance solvent base)"],
        healthHazards: [
          "May cause skin sensitization in susceptible individuals (geraniol-bearing constituents trace)",
          "Eye irritant at high concentration",
        ],
        ifraSummary:
          "Compliant with IFRA 51st Amendment for Category 4 (fine fragrance). Iris orris and sandalwood within published category limits.",
        flashpoint: "21–24°C / 70–75°F (estimated; ethanol-base)",
        storage:
          "Store in original packaging at 15–20°C, away from direct sunlight and heat sources.",
      },
      perfumerNotes:
        "A composition built around three smells, three eras, one room. The hedione is doing more than its weight here — it is the librarian. — M.B.",
    },
    critique: {
      overall:
        "A clear, voice-consistent brief. The concept earns the materials. One major: the bottle hint is more decorative than usable for an industrial designer. Two minor sharpenings.",
      issues: [
        {
          severity: "major",
          section: "marketing",
          comment:
            'Bottle hints reference "old library card proportion" but real packaging engineers need a height-to-width ratio or stopper material. Tighten before transmitting.',
        },
        {
          severity: "minor",
          section: "pyramid",
          comment:
            "Top tier is thin (poivre rose only at 2%). Consider adding a 1% bergamote to lift the opening before iris arrives, or accept that the perfume is meant to feel un-ceremonious from the first second.",
        },
        {
          severity: "minor",
          section: "tagline",
          comment:
            '"a perfume from three aisles away" is the strongest line in the brief. Consider promoting it to the bottle copy as well.',
        },
      ],
      shouldRevise: false,
    },
  },

  {
    id: "belle-aire-candle",
    label: "Belle Aire's own brief — luxury hotel lobby",
    turns: [
      {
        user: "A premium home candle for a luxury hotel. Lobby scent. Should feel expensive but not perfumed-room expensive.",
        assistantPreface:
          "Then the answer is a fig-cedar architecture with one careful tension. Hotel lobby scent has to read at twenty paces and disappear at three — that's the entire problem. We start with a fig-leaf accord: feuille de tomate at the top for the green-resinous edge of the leaf, magnolia underneath to keep it floral but bone-dry. The fig itself is a constructed accord — cèdre virginia for the wood, santal mysore for the milk, a touch of helional for the white-flesh moisture. Now the tension: ambroxan and iso E super together carry the room from the entrance to the elevator without tipping into perfume. Cashmeran for the velvet. No vanilla, no benzoin, no sweetness anywhere — that's what makes it luxury rather than fragrance. — What's the hotel's aesthetic? Travertine and brass, or boucle and oak?",
        proposal: {
          rationale:
            "Fig-cedar lobby architecture: green-leaf top, milky-wood heart, ambroxan-cashmeran radiance. Calibrated for cold throw at distance.",
          add: [
            { compoundId: "feuille-de-tomate", percent: 2, role: "top" },
            { compoundId: "magnolia", percent: 5, role: "heart" },
            { compoundId: "helional", percent: 3, role: "top" },
            { compoundId: "cedre-virginia", percent: 8, role: "heart" },
            { compoundId: "santal-mysore", percent: 6, role: "base" },
            { compoundId: "ambroxan", percent: 5, role: "base" },
            { compoundId: "iso-e-super", percent: 12, role: "heart" },
            { compoundId: "cashmeran", percent: 4, role: "heart" },
          ],
          remove: [],
        },
      },
    ],
    brief: {
      name: "Atrium",
      tagline: "the scent of arriving",
      story:
        "*Atrium* is a lobby scent built around a single olfactory problem: how to register at twenty paces without lingering at three. The answer is a fig-cedar architecture with no sweetness anywhere — the difference between expensive and perfumed-room expensive. Tomato leaf opens with the green-resinous edge of fig leaves. Magnolia and helional sit underneath, keeping the top dry and floral-clean. The body is Virginia cedar and Mysore sandalwood — wood and milk together, the constructed fig. Iso E Super and ambroxan radiate from the wax to the room and stop. Cashmeran provides velvet without warmth. A candle for a hotel that does not need to advertise its quality.",
      targetConsumer:
        "Hospitality buyers selecting a signature scent for properties that prefer architecture to ornament; the audience is the guest who notices on arrival but not on departure.",
      occasion:
        "Lobbies, lounges, executive concierge floors; daytime through evening; the first 30 seconds after the door closes behind a guest.",
      application: "candle",
      recommendedConcentration: "Soy-coconut wax, 8% fragrance load",
      pyramid: {
        top: [
          { compoundId: "feuille-de-tomate", percent: 2 },
          { compoundId: "helional", percent: 3 },
        ],
        heart: [
          { compoundId: "magnolia", percent: 5 },
          { compoundId: "cedre-virginia", percent: 8 },
          { compoundId: "iso-e-super", percent: 12 },
          { compoundId: "cashmeran", percent: 4 },
        ],
        base: [
          { compoundId: "santal-mysore", percent: 6 },
          { compoundId: "ambroxan", percent: 5 },
        ],
      },
      marketingCopy: {
        shortDescription:
          "A fig-cedar lobby candle for hotels that prefer architecture to ornament. No sweetness, no perfume-room shortcut.",
        longDescription:
          "*Atrium* is engineered for the first 30 seconds after a guest crosses the threshold. Tomato-leaf greenness opens above a fig-cedar architecture of Virginia cedar and Mysore sandalwood — wood and milk together. Magnolia and helional keep the top dry, floral, and clean; ambroxan and iso E super radiate from the wax to the room and stop precisely there. Cashmeran provides velvet without warmth. The composition refuses every gourmand shortcut: no vanilla, no benzoin, no sweetness anywhere. The result is a lobby scent that registers at twenty paces and disappears at three — the difference between expensive and perfumed-room expensive. Designed for hospitality groups whose properties prefer to be noticed without being remarked upon.",
        bottleHints:
          "Travertine vessel, knurled brass collar, machined wax surface. Designed for lobby placement at 1.4m height; vessel diameter 110mm.",
      },
      safetyProfile: {
        physicalHazards: [
          "Combustible — open flame product. Trim wick to 6mm before each use.",
          "Wax may liquefy fully near vessel edge; place on heat-stable surface only.",
        ],
        healthHazards: [
          "Avoid prolonged inhalation in unventilated rooms",
          "Keep out of reach of children and pets",
        ],
        ifraSummary:
          "Compliant with IFRA 51st Amendment for Category 12 (Hobby/Candle). All components within published category limits at the 8% fragrance load.",
        flashpoint: "Wax matrix flashpoint > 200°C; fragrance phase 21–24°C",
        storage:
          "Store at 15–25°C in original vessel; avoid direct sunlight, which can discolor the wax surface.",
      },
      perfumerNotes:
        "The fig is constructed, not stated. The whole composition is designed for cold-throw at distance and the fastest possible decay at proximity — that calibration is the entire job. — M.B.",
    },
    critique: {
      overall:
        "Strong, on-brief, technically credible. This is a brief a Belle Aire R&D team could compound from on Monday morning. One major to address.",
      issues: [
        {
          severity: "major",
          section: "composition",
          comment:
            "Iso E Super at 12% is high for a candle — at 8% load, that is essentially a 1% Iso E in the room, which is correct for radiance but may shorten cold throw of the cedar. Worth a calibration test.",
        },
        {
          severity: "minor",
          section: "marketing",
          comment:
            'The line "the difference between expensive and perfumed-room expensive" is the brief\'s sharpest. Promote it from longDescription to a hospitality sales sheet pull-quote.',
        },
        {
          severity: "minor",
          section: "safety",
          comment:
            "Add a line on candle vessel material safety (travertine surface — confirm thermal stability of the planned travertine grade with the vendor before tooling).",
        },
      ],
      shouldRevise: false,
    },
  },
];

export const getOfflineScenario = (id: OfflineScenario["id"]) =>
  OFFLINE_SCENARIOS.find((s) => s.id === id);

export const offlineChatEvents = async function* (
  scenarioId: OfflineScenario["id"],
  turnIndex: number,
  messageId: string,
): AsyncGenerator<ChatStreamEvent> {
  const scenario = getOfflineScenario(scenarioId);
  if (!scenario) {
    yield { type: "error", message: `Unknown scenario: ${scenarioId}` };
    return;
  }
  const turn = scenario.turns[turnIndex];
  if (!turn) {
    yield { type: "error", message: `No turn ${turnIndex} in scenario ${scenarioId}` };
    return;
  }

  yield { type: "message-start", messageId };

  // Stream prose word by word for a believable feel
  const words = turn.assistantPreface.split(/(\s+)/);
  let accumulated = "";
  for (const w of words) {
    accumulated += w;
    yield { type: "text-delta", messageId, delta: w };
    await new Promise((r) => setTimeout(r, 18));
  }

  // Then emit the proposal
  yield {
    type: "tool-result",
    messageId,
    toolName: "propose_composition",
    input: turn.proposal,
  };

  yield { type: "message-finish", messageId, full: accumulated };
};

export const compositionFromScenario = (scenarioId: OfflineScenario["id"]): CompositionEntry[] => {
  const scenario = getOfflineScenario(scenarioId);
  if (!scenario) return [];
  // Apply turns in order, accumulating add/remove
  const map = new Map<string, CompositionEntry>();
  for (const turn of scenario.turns) {
    for (const id of turn.proposal.remove) map.delete(id);
    for (const item of turn.proposal.add) {
      map.set(item.compoundId, {
        compoundId: item.compoundId,
        percent: item.percent,
        role: item.role,
      });
    }
  }
  return Array.from(map.values());
};
