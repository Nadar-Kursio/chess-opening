# The four families every opening book divides the openings into, in the order
# they are taught: 1.e4 e5 first, then the defences that decline it, then 1.d4.
#
# A family is identified by the moves that reach it and not by a name someone
# chose, so `label` is that move order and the nav prints it under the name.
#
# This is the split the literature uses and the ECO volumes mostly follow: C is
# the Open Games, B the semi-open defences, D the Closed Games, E the Indians.
# The French is the exception the volumes make and the families do not — it is
# catalogued C00–C19 alongside the Open Games, and by move order it is a
# semi-open defence, which is where it sits here.
#
# `id` is matched against each opening's "section" field.

SECTIONS = [
    {"id": "open", "group": "Open Games", "label": "1.e4 e5"},
    {"id": "semi-open", "group": "Semi-Open Games", "label": "1.e4, Black declines e5"},
    {"id": "closed", "group": "Closed Games", "label": "1.d4 d5"},
    {"id": "indian", "group": "Indian Defences", "label": "1.d4 Nf6"},
]
