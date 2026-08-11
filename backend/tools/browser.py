"""
Browser automation tool for reading web pages.
"""
import httpx
from bs4 import BeautifulSoup
import logging

logger = logging.getLogger(__name__)

async def open_url(url: str) -> str:
    """
    Open a URL and return the page text.
    Currently just falls back to read_page.
    Future: Uses Playwright with a fresh, sandboxed browser context.
    """
    return await read_page(url)

async def read_page(url: str) -> str:
    """
    Read the readable text content of a page (no JS rendering).
    Uses httpx to fetch and parse HTML with BeautifulSoup.

    Args:
        url: The full URL to read.

    Returns:
        Cleaned page text.
    """
    try:
        async with httpx.AsyncClient(timeout=10.0, follow_redirects=True) as client:
            response = await client.get(
                url, 
                headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"}
            )
            response.raise_for_status()
            
            soup = BeautifulSoup(response.text, 'lxml')
            
            # Remove script, style, meta, noscript elements
            for element in soup(["script", "style", "meta", "noscript", "header", "footer", "nav"]):
                element.decompose()
            
            # Get text
            text = soup.get_text(separator=' ', strip=True)
            
            # Basic cleanup (remove excessive whitespace)
            import re
            text = re.sub(r'\s+', ' ', text).strip()
            
            # Limit length to avoid blowing up context window
            return text[:15000]
            
    except Exception as e:
        logger.error(f"Failed to read page {url}: {e}")
        return f"[Error fetching page: {e}]"
