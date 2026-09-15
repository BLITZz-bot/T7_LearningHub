from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from playwright.async_api import async_playwright

router = APIRouter()

class ScrapeRequest(BaseModel):
    url: str

@router.post("/scrape")
async def scrape_job(request: ScrapeRequest):
    """
    Uses Playwright to navigate to a URL (specifically Adzuna redirect links),
    waits for the redirect to complete, and extracts the visible text from the 
    destination page.
    """
    if not request.url:
        raise HTTPException(status_code=400, detail="URL is required")

    try:
        async with async_playwright() as p:
            # Launch headless Chromium
            browser = await p.chromium.launch(headless=True, args=['--no-sandbox', '--disable-setuid-sandbox', '--disable-blink-features=AutomationControlled'])
            
            # Create context with a realistic user agent to help bypass some bot protections
            context = await browser.new_context(
                user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                viewport={'width': 1280, 'height': 800}
            )
            page = await context.new_page()
            
            try:
                from playwright_stealth import stealth_async
                await stealth_async(page)
            except ImportError:
                print("playwright_stealth not installed, proceeding without stealth")

            # Set a timeout for navigation (e.g. 15 seconds)
            page.set_default_timeout(15000)

            print(f"Playwright navigating to: {request.url}")
            # Wait until the network is mostly idle to ensure redirect finishes loading
            await page.goto(request.url, wait_until="domcontentloaded")
            
            # Additional short wait to let any JS redirects or Cloudflare checks run
            try:
                await page.wait_for_load_state("networkidle", timeout=5000)
            except Exception:
                pass # networkidle might timeout if there are constant background requests, that's fine

            print(f"Final URL reached: {page.url}")

            # Extract all text from the body
            text_content = await page.evaluate("document.body.innerText")

            await browser.close()

            # Clean up the text by removing excessive blank lines
            cleaned_text = "\n".join([line.strip() for line in text_content.splitlines() if line.strip()])

            return {"url": page.url, "text": cleaned_text}

    except Exception as e:
        print(f"Playwright scraping error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
