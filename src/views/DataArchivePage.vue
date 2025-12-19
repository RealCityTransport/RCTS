<!-- src/views/DataArchivePage.vue -->
<template>
  <div class="data-archive-page-container">
    <aside class="wiki-sidebar">
      <h3>카테고리</h3>
      <ul>
        <li v-for="category in manifest.categories" :key="category.id">
          <a href="#" @click.prevent="selectCategory(category)">{{ category.name }}</a>
          <ul v-if="selectedCategory && selectedCategory.id === category.id" class="sub-articles">
            <li v-for="article in category.articles" :key="article.id">
              <a href="#" @click.prevent="loadArticle(article)">{{ article.title }}</a>
            </li>
          </ul>
        </li>
      </ul>
    </aside>

    <article class="wiki-content">
      <div v-if="loading" class="loading-indicator">자료를 불러오는 중입니다...</div>
      <div v-if="error" class="error-message">자료를 불러오는데 실패했습니다: {{ error }}</div>
      
      <!-- 여기 div가 핵심입니다. v-html 지시자를 사용하여 HTML을 삽입합니다. -->
      <div v-if="currentArticleHtml" v-html="currentArticleHtml"></div> 
      
      <div v-else-if="!loading && !error && !currentArticleHtml" class="no-selection-message">
        좌측 카테고리에서 자료를 선택해주세요.
      </div>
    </article>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import MarkdownIt from 'markdown-it'; 

const md = new MarkdownIt({
  html: true,       // HTML 태그 허용
  linkify: true,    // URL을 자동 링크로 변환
  typographer: true // “ ” → “” 등 문장 부호 변환
});

const GITHUB_RAW_BASE_URL = 'https://raw.githubusercontent.com/RealCityTransport/DB_Data/main/';

const manifest = ref({ categories: [] }); 
const selectedCategory = ref(null);
const currentArticleHtml = ref('');
const loading = ref(false);
const error = ref(null);

const fetchManifest = async () => {
  loading.value = true;
  error.value = null;
  try {
    const response = await fetch(`${GITHUB_RAW_BASE_URL}_data_manifest.json`);
    if (!response.ok) {
      throw new Error(`매니페스트 파일을 불러올 수 없습니다: ${response.statusText}`);
    }
    manifest.value = await response.json();
    console.log('매니페스트 불러오기 성공:', manifest.value);

    if (manifest.value.categories.length > 0) {
      const firstCategory = manifest.value.categories[0];
      selectCategory(firstCategory);
      if (firstCategory.articles.length > 0) {
        await loadArticle(firstCategory.articles[0]);
      }
    }
  } catch (e) {
    error.value = e.message;
    console.error('매니페스트 불러오기 실패:', e);
  } finally {
    loading.value = false;
  }
};

const loadArticle = async (article) => {
  loading.value = true;
  error.value = null;
  currentArticleHtml.value = ''; 
  try {
    const articlePath = article.path;
    const response = await fetch(`${GITHUB_RAW_BASE_URL}${articlePath}`);
    if (!response.ok) {
      throw new Error(`자료를 불러올 수 없습니다: ${response.statusText}`);
    }
    const markdownContent = await response.text();
    currentArticleHtml.value = md.render(markdownContent); 
    console.log(`자료 '${article.title}' 불러오기 성공.`);
  } catch (e) {
    error.value = e.message;
    console.error(`자료 '${article.title}' 불러오기 실패:`, e);
  } finally {
    loading.value = false;
  }
};

const selectCategory = (category) => {
  selectedCategory.value = category;
};

onMounted(() => {
  fetchManifest();
});
</script>

<style lang="scss">
/* 스타일 부분은 이전과 동일합니다. 변경이 필요 없습니다. */
.data-archive-page-container {
  display: flex;
  min-height: 100%;
  padding: 1.5rem;
  gap: 2rem;
  box-sizing: border-box;
  background-color: #2a2a47;
  color: #e0e0e0;
}

.wiki-sidebar {
  flex: 0 0 250px;
  background-color: #1e1e3f;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.3);
  overflow-y: auto;
  height: 100%;
  box-sizing: border-box;

  h3 {
    color: #88c0d0;
    margin-top: 0;
    margin-bottom: 1rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    padding-bottom: 0.5rem;
    font-size: 1.1rem;
  }

  ul {
    list-style: none;
    padding: 0;
    margin-bottom: 1.5rem;
    .sub-articles {
        padding-left: 1rem;
        margin-top: 0.5rem;
        margin-bottom: 0.5rem;
    }
    li {
      margin-bottom: 0.5rem;
      a {
        color: #90aaff;
        text-decoration: none;
        &:hover {
          text-decoration: underline;
          color: #c7d8ff;
        }
      }
    }
  }
}

.wiki-content {
  flex-grow: 1;
  background-color: #1e1e3f;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.3);
  overflow-y: auto;
  height: 100%;
  box-sizing: border-box;

  h1, h2, h3 {
    color: #4CAF50;
    margin-top: 2rem;
    margin-bottom: 1rem;
    border-bottom: 1px solid rgba(76, 175, 80, 0.5);
    padding-bottom: 0.5rem;
  }
  h2 { color: #88c0d0; font-size: 1.8rem; }
  h3 { color: #b0e0e6; font-size: 1.4rem; border-bottom: none;}

  p {
    line-height: 1.7;
    margin-bottom: 1rem;
  }

  ul {
    list-style: disc;
    padding-left: 1.5rem;
    margin-bottom: 1rem;
  }

  a {
    color: #90aaff;
    text-decoration: none;
    &:hover {
      text-decoration: underline;
    }
  }

  blockquote {
    background-color: rgba(136, 192, 208, 0.1);
    border-left: 4px solid #88c0d0;
    margin: 1.5rem 0;
    padding: 1rem 1.5rem;
    font-style: italic;
    color: #b0e0e6;
  }

  pre {
    background-color: #0d0d1e;
    padding: 1rem;
    border-radius: 4px;
    overflow-x: auto;
    margin: 1.5rem 0;
    code {
      font-family: 'Consolas', 'Monaco', monospace;
      color: #66e666;
    }
  }
  
  .loading-indicator, .error-message, .no-selection-message {
    text-align: center;
    padding: 2rem;
    font-size: 1.2rem;
    color: #bbb;
  }
  .error-message {
    color: #ff6b6b;
  }
}
</style>