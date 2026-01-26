from duckduckgo_search import DDGS
import json

def test_search():
    query = "Map of Italy"
    print(f"Testing Query: '{query}'")
    
    try:
        with DDGS() as ddgs:
            # Try to get 3 results to compare
            results = list(ddgs.images(query, max_results=3))
            
            if not results:
                print("❌ NO RESULTS FOUND.")
                return

            print(f"✅ Found {len(results)} results.")
            for i, res in enumerate(results):
                print(f"Result {i+1}:")
                print(f"  Title: {res.get('title')}")
                print(f"  Image URL: {res.get('image')}")
                print(f"  Source: {res.get('url')}")
    except Exception as e:
        print(f"❌ CRASH: {e}")

if __name__ == "__main__":
    test_search()
