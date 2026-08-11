"""
Tool for web search using DuckDuckGo.
Configured via SEARCH_PROVIDER and SEARCH_API_KEY if needed.
"""
import os
import json
import logging
from typing import Optional
from abc import ABC, abstractmethod

logger = logging.getLogger(__name__)

class SearchProvider(ABC):
    @abstractmethod
    def search(self, query: str, num_results: int = 5) -> list[dict]:
        """Return a list of dicts with title, url, snippet, source"""
        pass

class DuckDuckGoSearchProvider(SearchProvider):
    def search(self, query: str, num_results: int = 5) -> list[dict]:
        try:
            from duckduckgo_search import DDGS
        except ImportError:
            raise ImportError("duckduckgo_search not installed.")
        
        results = []
        with DDGS() as ddgs:
            # DDGS.text can sometimes return an iterator or a list depending on version
            ddg_results = ddgs.text(query, max_results=num_results)
            if not ddg_results:
                return []
                
            for r in ddg_results:
                results.append({
                    "title": r.get("title", ""),
                    "url": r.get("href", ""),
                    "snippet": r.get("body", ""),
                    "source": "duckduckgo"
                })
        return results

class TavilySearchProvider(SearchProvider):
    def search(self, query: str, num_results: int = 5) -> list[dict]:
        raise NotImplementedError("Tavily search provider not yet implemented.")

class SerpAPISearchProvider(SearchProvider):
    def search(self, query: str, num_results: int = 5) -> list[dict]:
        raise NotImplementedError("SerpAPI search provider not yet implemented.")

def get_search_provider() -> SearchProvider:
    provider = os.getenv("SEARCH_PROVIDER", "duckduckgo").lower()
    if provider == "duckduckgo":
        return DuckDuckGoSearchProvider()
    elif provider == "tavily":
        return TavilySearchProvider()
    elif provider == "serpapi":
        return SerpAPISearchProvider()
    else:
        raise ValueError(f"Unsupported SEARCH_PROVIDER: {provider}")

async def search_web(query: str, num_results: int = 5) -> str:
    """
    Search the web for the given query.
    Returns JSON string with results, raises exceptions on failure.
    """
    provider = get_search_provider()
    
    try:
        results = provider.search(query, num_results)
        
        # If the search provider succeeded but returned exactly 0 results, 
        # it is technically a success but with empty results.
        return json.dumps({
            "query": query,
            "results": results
        })
    except Exception as e:
        logger.error(f"Search failed for query '{query}': {e}")
        # The prompt instructed to raise the error instead of silently returning empty results.
        raise e
