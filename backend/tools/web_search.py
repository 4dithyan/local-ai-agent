"""
Tool placeholders for the UI Research Agent.

These are interface stubs that will be implemented in a later phase
using a sandboxed Playwright browser + DuckDuckGo / SerpAPI search.

IMPORTANT: Never grant the agent access to the user's personal Chrome
profile or real system credentials.
"""

from typing import Optional


async def search_web(query: str, num_results: int = 5) -> str:
    """
    Search the web for the given query.

    V1: Returns a placeholder string.
    Future: Will call DuckDuckGo API or SerpAPI and return formatted results.

    Args:
        query: The search query string.
        num_results: Maximum number of results to return.

    Returns:
        A formatted string of search results.
    """
    # TODO: Implement with DuckDuckGo or SerpAPI
    return f"[PLACEHOLDER] Search results for: {query}"
