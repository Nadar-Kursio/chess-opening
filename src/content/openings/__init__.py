"""The opening catalogue.

One module per opening, each exporting a single OPENING dict. To add an opening,
drop a new module in this package and add its name to ORDER — nothing else in the
build needs to change.

ORDER is editorial, not alphabetical: it is the order openings appear in the
nav, grouped by the "section" field each opening declares — so it runs in the
same family order that file does.
"""
from importlib import import_module

ORDER = [
    "italian", "ruylopez", "scotch", "fourknights",
    "sicilian", "french", "carokann",
    "queensgambit", "slav", "london",
    "catalan", "nimzo", "kid",
    "scholarsmate", "friedliver",
]


def load():
    """Return every opening, in ORDER."""
    return [import_module(f"{__name__}.{name}").OPENING for name in ORDER]
