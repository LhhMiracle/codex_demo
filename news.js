const elements = {
    datetime: document.getElementById('datetime'),
    apiKeyInput: document.getElementById('apiKeyInput'),
    topicSelect: document.getElementById('topicSelect'),
    languageSelect: document.getElementById('languageSelect'),
    countrySelect: document.getElementById('countrySelect'),
    maxResults: document.getElementById('maxResults'),
    saveSettings: document.getElementById('saveSettings'),
    refreshNews: document.getElementById('refreshNews'),
    status: document.getElementById('status'),
    searchInput: document.getElementById('searchInput'),
    searchBtn: document.getElementById('searchBtn'),
    topStories: document.getElementById('topStories'),
    latestStories: document.getElementById('latestStories'),
    topStoryTemplate: document.getElementById('topStoryTemplate'),
    latestStoryTemplate: document.getElementById('latestStoryTemplate')
};

const STORAGE_KEY = 'globalNewsConfigV1';

const SAMPLE_ARTICLES = [
    {
        title: 'Global Markets Rally as Inflation Shows Signs of Cooling',
        description: 'Investors welcomed fresh economic data suggesting that global inflationary pressures may finally be easing. Analysts say the trend could give central banks room to pause aggressive rate hikes.',
        publishedAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
        source: { name: 'Financial Daily' },
        url: 'https://example.com/markets-rally',
        image: 'https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?auto=format&fit=crop&w=1200&q=80',
        content: 'Stock markets around the world rallied Tuesday after new inflation figures from the United States and Europe pointed to a slowdown in price growth. The data provided relief to investors concerned about rising borrowing costs.'
    },
    {
        title: 'New Climate Accord Reached at Global Summit',
        description: 'Delegates from over 190 countries agreed on a new roadmap aimed at accelerating the transition to clean energy and climate resilience initiatives.',
        publishedAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
        source: { name: 'World Climate Watch' },
        url: 'https://example.com/climate-accord',
        image: 'https://images.unsplash.com/photo-1523978591478-c753949ff840?auto=format&fit=crop&w=1200&q=80',
        content: 'After two weeks of intense negotiations, a historic climate accord has been reached. The agreement sets ambitious targets for phasing out coal and scaling up investment in renewable energy projects across emerging markets.'
    },
    {
        title: 'Breakthrough in Quantum Computing Announced by International Research Team',
        description: 'A joint team of scientists unveiled a quantum processor that dramatically reduces error rates, paving the way for practical applications in logistics and pharmaceuticals.',
        publishedAt: new Date(Date.now() - 1000 * 60 * 240).toISOString(),
        source: { name: 'Tech Frontiers' },
        url: 'https://example.com/quantum-breakthrough',
        image: 'https://images.unsplash.com/photo-1581093806997-124204d9fa9d?auto=format&fit=crop&w=1200&q=80',
        content: 'Researchers from leading universities in Europe, North America, and Asia revealed a quantum chip that can execute stable computations over longer periods. The announcement is seen as a major step toward commercial quantum services.'
    },
    {
        title: 'Global Humanitarian Aid Ramps Up After Pacific Earthquake',
        description: 'International organizations and governments are coordinating a rapid response after a 7.2 magnitude earthquake struck island nations in the Pacific.',
        publishedAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
        source: { name: 'Global Relief Network' },
        url: 'https://example.com/pacific-aid',
        image: 'https://images.unsplash.com/photo-1528825871115-3581a5387919?auto=format&fit=crop&w=1200&q=80',
        content: 'Aid agencies deployed search-and-rescue teams and emergency supplies following the overnight earthquake. Regional partners pledged additional funding to support recovery efforts and rebuild damaged infrastructure.'
    }
];

const state = {
    config: {
        apiKey: '',
        topic: 'world',
        language: 'en',
        country: 'us',
        max: 12
    },
    articles: [],
    isLoading: false,
    lastUpdated: null
};

function loadConfig() {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (!stored) return;
        const parsed = JSON.parse(stored);
        Object.assign(state.config, parsed);
    } catch (err) {
        console.error('Failed to load config from storage', err);
    }
}

function saveConfig() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state.config));
        showStatus('设置已保存，下次打开页面会自动加载。', 'success');
    } catch (err) {
        console.error('Failed to save config', err);
        showStatus('保存设置时出现问题，请检查浏览器是否允许本地存储。', 'error');
    }
}

function restoreForm() {
    elements.apiKeyInput.value = state.config.apiKey;
    elements.topicSelect.value = state.config.topic;
    elements.languageSelect.value = state.config.language;
    elements.countrySelect.value = state.config.country;
    elements.maxResults.value = state.config.max;
}

function setupEventListeners() {
    elements.saveSettings.addEventListener('click', () => {
        state.config.apiKey = elements.apiKeyInput.value.trim();
        state.config.topic = elements.topicSelect.value;
        state.config.language = elements.languageSelect.value;
        state.config.country = elements.countrySelect.value;
        state.config.max = Number(elements.maxResults.value) || 10;
        saveConfig();
    });

    elements.refreshNews.addEventListener('click', () => {
        fetchAndRenderNews();
    });

    elements.searchBtn.addEventListener('click', () => {
        const keyword = elements.searchInput.value.trim();
        fetchAndRenderNews(keyword);
    });

    elements.searchInput.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            const keyword = elements.searchInput.value.trim();
            fetchAndRenderNews(keyword);
        }
    });
}

function showStatus(message, type = '') {
    elements.status.textContent = message;
    elements.status.className = `status${type ? ` ${type}` : ''}`;
}

function updateClock() {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('zh-CN', {
        dateStyle: 'full',
        timeStyle: 'medium',
        hour12: false
    });
    elements.datetime.textContent = formatter.format(now);
}

function buildUrl(keyword) {
    const baseUrl = new URL('https://gnews.io/api/v4/top-headlines');
    baseUrl.searchParams.set('category', state.config.topic);
    baseUrl.searchParams.set('lang', state.config.language);
    baseUrl.searchParams.set('country', state.config.country);
    baseUrl.searchParams.set('max', state.config.max);

    if (keyword) {
        baseUrl.searchParams.set('q', keyword);
    }

    if (state.config.apiKey) {
        baseUrl.searchParams.set('apikey', state.config.apiKey);
    }

    return baseUrl.toString();
}

async function fetchNews(keyword) {
    if (!state.config.apiKey) {
        showStatus('未填写 API Key，以下展示的是示例新闻数据。', 'error');
        return SAMPLE_ARTICLES;
    }

    const url = buildUrl(keyword);
    try {
        state.isLoading = true;
        showStatus('正在获取新闻，请稍候…');
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`请求失败：${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        if (!Array.isArray(data.articles)) {
            throw new Error('返回数据格式异常');
        }

        if (data.articles.length === 0) {
            showStatus('没有找到匹配的新闻，请尝试调整关键词或主题。', 'error');
        } else {
            showStatus(`最新新闻已更新（共 ${data.articles.length} 条）。`, 'success');
        }

        return data.articles;
    } catch (error) {
        console.error(error);
        showStatus(`获取新闻失败：${error.message}，已展示离线示例数据。`, 'error');
        return SAMPLE_ARTICLES;
    } finally {
        state.isLoading = false;
    }
}

function summarizeText(text, maxSentences = 2) {
    if (!text) return '暂无摘要，点击查看原文了解详情。';

    const cleanText = text
        .replace(/\[[^\]]*\]/g, '')
        .replace(/\s+/g, ' ')
        .trim();

    const sentences = cleanText.match(/[^.!?。！？]+[.!?。！？]?/g) || [cleanText];
    const summary = sentences.slice(0, maxSentences).join(' ').trim();

    return summary.length > 20 ? summary : cleanText;
}

function formatRelativeTime(dateString) {
    if (!dateString) return '未知时间';
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return '未知时间';

    const diff = Date.now() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    if (minutes < 1) return '刚刚';
    if (minutes < 60) return `${minutes} 分钟前`;

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} 小时前`;

    const days = Math.floor(hours / 24);
    if (days === 1) return '昨天';
    if (days < 7) return `${days} 天前`;

    return date.toLocaleDateString('zh-CN', {
        month: 'short',
        day: 'numeric'
    });
}

function formatMeta(article) {
    const source = article.source?.name || '未知来源';
    const published = formatRelativeTime(article.publishedAt);
    return `${source} · ${published}`;
}

function renderTopStories(articles) {
    elements.topStories.innerHTML = '';
    const topThree = articles.slice(0, 3);

    if (topThree.length === 0) {
        elements.topStories.innerHTML = '<p class="empty">暂时没有热门新闻。</p>';
        return;
    }

    topThree.forEach((article) => {
        const clone = elements.topStoryTemplate.content.cloneNode(true);
        const card = clone.querySelector('.story-card');
        const link = clone.querySelector('.story-link');
        const image = clone.querySelector('.story-image');
        const title = clone.querySelector('.story-title');
        const summary = clone.querySelector('.story-summary');
        const meta = clone.querySelector('.story-meta');

        link.href = article.url || '#';
        title.textContent = article.title || '未命名标题';
        summary.textContent = summarizeText(article.description || article.content);
        meta.textContent = formatMeta(article);

        const imageUrl = article.image || article.urlToImage;
        if (imageUrl) {
            image.style.backgroundImage = `url('${imageUrl}')`;
        } else {
            image.style.background = 'linear-gradient(135deg, rgba(23,105,255,0.4), rgba(15,23,42,0.6))';
        }

        elements.topStories.appendChild(clone);
    });
}

function renderLatestStories(articles) {
    elements.latestStories.innerHTML = '';
    const remaining = articles.slice(3);

    if (remaining.length === 0) {
        elements.latestStories.innerHTML = '<p class="empty">稍后会有更多更新，敬请期待。</p>';
        return;
    }

    remaining.forEach((article) => {
        const clone = elements.latestStoryTemplate.content.cloneNode(true);
        const wrapper = clone.querySelector('.story-item');
        const timestamp = clone.querySelector('.story-timestamp');
        const title = clone.querySelector('.story-title');
        const summary = clone.querySelector('.story-summary');
        const meta = clone.querySelector('.story-meta');

        timestamp.textContent = formatRelativeTime(article.publishedAt);
        title.textContent = article.title || '未命名标题';
        title.href = article.url || '#';
        summary.textContent = summarizeText(article.description || article.content);
        meta.textContent = formatMeta(article);

        wrapper.classList.toggle('fallback', Boolean(article.isFallback));
        elements.latestStories.appendChild(clone);
    });
}

async function fetchAndRenderNews(keyword) {
    if (state.isLoading) return;

    const articles = await fetchNews(keyword);
    state.articles = articles.map((article) => ({
        ...article,
        isFallback: !state.config.apiKey
    }));
    state.lastUpdated = new Date();

    renderTopStories(state.articles);
    renderLatestStories(state.articles);
}

function initialize() {
    loadConfig();
    restoreForm();
    setupEventListeners();
    updateClock();
    setInterval(updateClock, 1000 * 30);

    fetchAndRenderNews();
}

initialize();
