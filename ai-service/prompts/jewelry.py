"""Jewelry prompt helpers for the Python service (mirrors Next.js prompt builder)."""

TYPE_PHRASES = {
    "ring": "fine jewelry ring",
    "necklace": "fine jewelry necklace",
    "chain": "fine jewelry chain",
    "pendant": "fine jewelry pendant",
    "bracelet": "fine jewelry bracelet",
    "earrings": "fine jewelry earrings",
}


def build_prompt(jewelry_type: str, description: str, extras: str | None = None) -> str:
    parts = [
        f"Luxury {TYPE_PHRASES.get(jewelry_type, 'fine jewelry')}",
        description.strip(),
        extras.strip() if extras else None,
        "realistic jewelry proportions",
        "isolated object",
        "centered composition",
        "no hands",
        "no human body",
        "no text",
        "no logo",
    ]
    return ", ".join(p for p in parts if p)
