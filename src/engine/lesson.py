"""The opening lesson: the theory cards, cut around the moves they name.

The machine that does the cutting lives in engine/illustrate.py and serves any
prose surface; this module is its first consumer. It maps the authored theory
onto the record the site's ideas section renders: one card for the big idea,
one for the structure, one shared card for both sides' plans (the two lists
tell one story, so they share one board and one seed story), and one card per
trap, with the trap's colon-stopped name lifted off when the author wrote one.
"""
import re

from engine.illustrate import Illustrator, plays_moves, position_seeds

# A trap may open with its name: a short colon-stopped prefix with no move in it.
_NAME = re.compile(r"^([^:]{2,60}):\s*")


def _trap_name(text):
    m = _NAME.match(text)
    if m and not plays_moves(m.group(1)):
        return m.group(1), text[m.end():]
    return None, text


def build_lesson(op_id, theory, moves_lists, warn):
    """The lesson record for one opening: the theory, cut around its moves.

    Returns (record, runs found, runs on a board). The record mirrors the
    theory it was cut from -- reassembling a card's segments reproduces the
    authored prose byte for byte, which is what tests/test_emit.py holds it to.
    """
    seeds = position_seeds(moves_lists)
    cards = []

    def cut(text, where):
        card = Illustrator(seeds, warn, f"{op_id} / {where}")
        cards.append(card)
        return card.finish({"seg": card.illustrate(text)})

    plans = Illustrator(seeds, warn, f"{op_id} / plans")
    cards.append(plans)
    plans_out = plans.finish({
        side: [plans.illustrate(text) for text in theory[f"{side}_plans"]]
        for side in ("white", "black")})

    traps = []
    for i, text in enumerate(theory["traps"]):
        name, body = _trap_name(text)
        out = cut(body, f"trap {i + 1}")
        if name:
            out["name"] = name
        traps.append(out)

    record = {"idea": cut(theory["big_idea"], "big idea"),
              "structure": cut(theory["structure"], "structure"),
              "plans": plans_out,
              "traps": traps}
    return record, sum(c.found for c in cards), sum(c.resolved for c in cards)
