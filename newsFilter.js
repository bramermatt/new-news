const rssFeeds = {
    general: [
        'https://rss.nytimes.com/services/xml/rss/nyt/HomePage.xml',
        'http://feeds.bbci.co.uk/news/rss.xml',
        'https://www.aljazeera.com/xml/rss/all.xml',
    ],
    business: [
        'http://feeds.bbci.co.uk/news/business/rss.xml',
        'https://rss.nytimes.com/services/xml/rss/nyt/Business.xml',
    ],
    entertainment: [
        'http://feeds.bbci.co.uk/news/entertainment_and_arts/rss.xml',
        'https://rss.nytimes.com/services/xml/rss/nyt/Movies.xml',
    ],
    health: [
        'http://feeds.bbci.co.uk/news/health/rss.xml',
        'https://rss.nytimes.com/services/xml/rss/nyt/Health.xml',
    ],
    science: [
        'http://feeds.bbci.co.uk/news/science_and_environment/rss.xml',
        'https://rss.nytimes.com/services/xml/rss/nyt/Science.xml',
    ],
    sports: [
        'https://www.espn.com/espn/rss/news',
        'https://rss.cnn.com/rss/edition_sport.rss',
        'https://www.skysports.com/rss/12040',
    ],
    technology: [
        'http://feeds.bbci.co.uk/news/technology/rss.xml',
        'https://rss.nytimes.com/services/xml/rss/nyt/Technology.xml',
    ],
    foxnews: [
        'http://feeds.foxnews.com/foxnews/latest',
    ],
    quanta: [
        'https://www.quantamagazine.org/feed/',
    ],
};

const apiKeys = {
    reddit: 'YOUR_REDDIT_API_KEY',
    youtube: 'YOUR_YOUTUBE_API_KEY',
    twitter: 'YOUR_TWITTER_API_KEY',
};

const newsContainer = document.getElementById('news-container');
const categoryFilter = document.getElementById('category');
const searchInput = document.getElementById('search');
const generateNewsButton = document.getElementById('generate-news');
const filterButton = document.getElementById('filter-button');
const searchButton = document.getElementById('search-button');
const filterContainer = document.getElementById('filter-container');
const searchContainer = document.getElementById('search-container');
const paginationContainer = document.getElementById('pagination-container');

let currentPage = 1;
const itemsPerPage = 10;

// Toggle filter container visibility
filterButton.addEventListener('click', () => {
    filterContainer.style.display = filterContainer.style.display === 'none' ? 'block' : 'none';
});

// Toggle search container visibility
searchButton.addEventListener('click', () => {
    searchContainer.style.display = searchContainer.style.display === 'none' ? 'block' : 'none';
});

// Fetch RSS feed and parse it
async function fetchRSSFeed(url) {
    console.log(`Fetching RSS feed from: ${url}`);
    try {
        const response = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(url)}`);
        const data = await response.json();
        if (!data.items) {
            console.error(`No items found in RSS feed from: ${url}`);
            return [];
        }
        console.log(`Fetched ${data.items.length} items from ${url}`);
        return data.items;
    } catch (error) {
        console.error(`Error fetching RSS feed from: ${url}`, error);
        return [];
    }
}

// Fetch news from Reddit
async function fetchRedditNews(subreddit) {
    console.log(`Fetching news from Reddit subreddit: ${subreddit}`);
    try {
        const response = await fetch(`https://www.reddit.com/r/${subreddit}/top.json?limit=10`, {
            headers: {
                'Authorization': `Bearer ${apiKeys.reddit}`
            }
        });
        const data = await response.json();
        return data.data.children.map(post => ({
            title: post.data.title,
            link: `https://www.reddit.com${post.data.permalink}`,
            author: post.data.author,
            pubDate: new Date(post.data.created_utc * 1000).toISOString(),
            thumbnail: post.data.thumbnail,
        }));
    } catch (error) {
        console.error(`Error fetching news from Reddit subreddit: ${subreddit}`, error);
        return [];
    }
}

// Fetch news from YouTube
async function fetchYouTubeNews(channelId) {
    console.log(`Fetching news from YouTube channel: ${channelId}`);
    try {
        const response = await fetch(`https://www.googleapis.com/youtube/v3/search?key=${apiKeys.youtube}&channelId=${channelId}&part=snippet,id&order=date&maxResults=10`);
        const data = await response.json();
        return data.items.map(video => ({
            title: video.snippet.title,
            link: `https://www.youtube.com/watch?v=${video.id.videoId}`,
            author: video.snippet.channelTitle,
            pubDate: video.snippet.publishedAt,
            thumbnail: video.snippet.thumbnails.default.url,
        }));
    } catch (error) {
        console.error(`Error fetching news from YouTube channel: ${channelId}`, error);
        return [];
    }
}

// Fetch news from Twitter
async function fetchTwitterNews(username) {
    console.log(`Fetching news from Twitter user: ${username}`);
    try {
        const response = await fetch(`https://api.twitter.com/2/tweets?ids=${username}`, {
            headers: {
                'Authorization': `Bearer ${apiKeys.twitter}`
            }
        });
        const data = await response.json();
        return data.data.map(tweet => ({
            title: tweet.text,
            link: `https://twitter.com/${username}/status/${tweet.id}`,
            author: username,
            pubDate: new Date(tweet.created_at).toISOString(),
            thumbnail: '', // Twitter does not provide thumbnails in the API response
        }));
    } catch (error) {
        console.error(`Error fetching news from Twitter user: ${username}`, error);
        return [];
    }
}

// Fetch news for a category or search term
async function fetchNews(category, search) {
    console.log(`Fetching news for category: ${category}, search: ${search}`);
    let feeds = [];
    if (category === 'all') {
        feeds = Object.values(rssFeeds).flat();
    } else if (rssFeeds[category]) {
        feeds = rssFeeds[category];
    }

    const newsPromises = feeds.map(feed => fetchRSSFeed(feed));
    const newsResults = await Promise.all(newsPromises);
    let allNews = newsResults.flat();

    if (category === 'reddit') {
        const redditNews = await fetchRedditNews('news');
        allNews = allNews.concat(redditNews);
    } else if (category === 'youtube') {
        const youtubeNews = await fetchYouTubeNews('UC16niRr50-MSBwiO3YDb3RA'); // Example channel ID
        allNews = allNews.concat(youtubeNews);
    } else if (category === 'twitter') {
        const twitterNews = await fetchTwitterNews('BBCBreaking'); // Example Twitter username
        allNews = allNews.concat(twitterNews);
    }

    if (search) {
        return allNews.filter(news => news.title.toLowerCase().includes(search.toLowerCase()));
    }
    return allNews;
}

// Render the fetched news
function renderNews(newsData, category) {
    console.log(`Rendering ${newsData.length} news items for category: ${category}`);
    newsContainer.innerHTML = '';
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedNews = newsData.slice(startIndex, endIndex);

    paginatedNews.forEach(news => {
        const newsItem = `
            <div class="news-item">
                <img class="news-thumbnail" src="${news.thumbnail || 'img/default-thumbnail.jpg'}" alt="${news.title}">
                <div class="news-info">
                <p class="news-category">${category}</p>
                <h3>${news.title}</h3>
                <p class="news-description">${news.description || 'No description available.'}</p>
                <p class="news-date"> ${new Date(news.pubDate).toLocaleDateString()}</p>
                <a href="${news.link}" class="news-publisher" target="_blank"><p>${news.author || 'Unknown Source'}</p></a>
                <a href="${news.link}" class="read-more-button" target="_blank"><p>Read More</p></a>
                </div>
                
            </div>
        `;
        newsContainer.insertAdjacentHTML('beforeend', newsItem);
    });

    renderPagination(newsData.length);
}

// Render pagination buttons
function renderPagination(totalItems) {
    paginationContainer.innerHTML = '';
    const totalPages = Math.ceil(totalItems / itemsPerPage);

    for (let i = 1; i <= totalPages; i++) {
        const pageButton = document.createElement('button');
        pageButton.textContent = i;
        pageButton.className = 'page-button';
        if (i === currentPage) {
            pageButton.classList.add('active');
        }
        pageButton.addEventListener('click', () => {
            currentPage = i;
            const category = categoryFilter.value === 'all' ? 'all' : categoryFilter.value;
            const search = searchInput.value.trim();
            fetchNews(category, search).then(newsData => renderNews(newsData, category));
        });
        paginationContainer.appendChild(pageButton);
    }
}

// Event listener for the button
generateNewsButton.addEventListener('click', async () => {
    currentPage = 1;
    const search = searchInput.value.trim();
    const category = categoryFilter.value === 'all' ? 'all' : categoryFilter.value;
    const newsData = await fetchNews(category, search);
    renderNews(newsData, category);
});

// Event listener for the Enter key press
searchInput.addEventListener('keypress', async (event) => {
    if (event.key === 'Enter') {
        currentPage = 1;
        const category = categoryFilter.value === 'all' ? 'all' : categoryFilter.value;
        const search = searchInput.value.trim();
        const newsData = await fetchNews(category, search);
        renderNews(newsData, category);
    }
});

// Initial load
(async () => {
    const newsData = await fetchNews('general', '');
    renderNews(newsData, 'general'); 
})();
