# a MAL scraper made to create the database

import aiohttp, asyncio, csv, os, re, sys, random
from bs4 import BeautifulSoup
from fake_useragent import UserAgent

BASE_URL = "https://myanimelist.net/character.php?limit="
OUTPUT_FILE = "commands/mudae/data/characters.csv"
MAX_THREADS = 10
START_PAGE = 0 # 31 was last place left off, if you are "manually" adding to the database and dont want to start over
# if you are doing a custom start page, change the output file so it doesnt override it!!

HEADERS = {
    'User-Agent': UserAgent().random, # not sure if this really even matters ¯\_(ツ)_/¯
    'Accept-Language': 'en-US,en;q=0.9',
}

async def fetch_page_data(session, page, retries=3):
    actual_page = START_PAGE + page
    attempt = 0

    while attempt < retries:
        try:
            print(f"Fetching page {actual_page}, attempt {attempt + 1}... {BASE_URL + str(actual_page*50)}")
            async with session.get(BASE_URL + str(actual_page * 50), headers=HEADERS) as response:
                response.raise_for_status()
                html = await response.text()

            soup = BeautifulSoup(html, 'html.parser')
            rows = soup.select('tr.ranking-list')

            tasks = []
            for row in rows:
                rank = row.select_one('td.rank span').text.strip()
                name = row.select_one('td.people a.fs14').text.strip()
                link = row.select_one('td.people a.fs14')['href']
                favorites = row.select_one('td.favorites').text.strip().replace(',', '')
                animeography = ", ".join(a.text for a in row.select('td.animeography a'))

                img_tag = row.select_one('td.people img')
                img_url = img_tag['data-srcset'].split(' ')[0] if img_tag else ""
                img_url = img_url.split('?')[0].replace('/r/50x78/', '/')  # make it higher res

                tasks.append(fetch_character_details(session, link, int(rank), name, int(favorites), animeography, img_url))

            results = await asyncio.gather(*tasks)
            await asyncio.sleep(random.uniform(0.02, 0.14))
            return results

        except Exception as e:
            attempt += 1
            rv = random.uniform(3, 5)
            print(f"Error fetching page {actual_page}: {e}. Retrying in {rv} seconds...")
            await asyncio.sleep(rv)

    print(f"Failed to fetch page {actual_page} after {retries} attempts.")
    sys.exit(1)

async def fetch_character_details(session, link, rank, name, favorites, animeography, img_url):
    try:
        async with session.get(link, headers=HEADERS) as response:
            response.raise_for_status()
            html = await response.text()

        soup = BeautifulSoup(html, 'html.parser')
        text = soup.get_text()
        age = extract_age(text)

        return (rank, name, age, link, favorites, animeography, img_url)

    except Exception as e:
        print(f"Error fetching character details from {link}: {e}")
        return (rank, name, "undefined", link, favorites, animeography, img_url)

def extract_age(text):
    age_patterns = [
        r"Age:\s*(\d+)",
        r"Age:\s*(\d+→\d+)",
        r"(\d+)\s*(?:years? old|years?)"
    ]
    
    for pattern in age_patterns:
        match = re.search(pattern, text)
        if match:
            return match.group(1)
    return "undefined"

async def main():
    os.makedirs(os.path.dirname(OUTPUT_FILE), exist_ok=True)

    num_pages = 0
    if len(sys.argv) < 2:
        print("Number of pages not specified. Defaulting to 1.")
        num_pages = 1
    else:
        try:
            num_pages = int(sys.argv[1])
        except ValueError:
            print("Invalid number of pages specified. Defaulting to 1.")
            num_pages = 1

    num_pages = num_pages * 50 // 50

    async with aiohttp.ClientSession() as session:
        tasks = [fetch_page_data(session, page) for page in range(num_pages)]
        all_data = await asyncio.gather(*tasks)
        
    all_data = [item for sublist in all_data for item in sublist]
    all_data.sort(key=lambda x: x[0])

    with open(OUTPUT_FILE, mode='w', newline='', encoding='utf-8') as file:
        writer = csv.writer(file)
        writer.writerow(['Rank', 'Name', 'Age', 'Link', 'Favorites', 'Animeography', 'PFP'])
        writer.writerows(all_data)

    print(f"Data has been written to {OUTPUT_FILE}")

if __name__ == "__main__":
    asyncio.run(main())