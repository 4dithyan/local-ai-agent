"""
Screenshot tool placeholder.

Future: Uses Playwright to take screenshots of web pages for
visual analysis by the vision-capable Qwen3-VL model.
"""

from typing import Optional


async def take_screenshot(url: str, full_page: bool = False) -> bytes:
    """
    Take a screenshot of a URL using the sandboxed browser.

    V1: Returns empty bytes.
    Future: Uses Playwright isolated context to capture the page.

    Args:
        url: The page to screenshot.
        full_page: Whether to capture the full page or just the viewport.

    Returns:
        PNG image bytes.
    """
    # TODO: Implement with Playwright
    return b""


async def analyze_screenshot(image_bytes: bytes, question: str) -> str:
    """
    Send a screenshot to Qwen3-VL for visual analysis.

    V1: Returns placeholder.
    Future: Converts bytes to base64 and sends to Ollama vision endpoint.

    Args:
        image_bytes: The PNG image bytes to analyze.
        question: What to ask the vision model about the image.

    Returns:
        The model's analysis as a string.
    """
    # TODO: Implement with Ollama vision API
    return f"[PLACEHOLDER] Visual analysis for question: {question}"
