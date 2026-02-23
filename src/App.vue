<template>
  <el-container class="app-container">
    <el-header class="app-header">
      <div class="header-left">
        <h1 class="app-title">学习笔记</h1>
      </div>
      <div class="header-right">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索笔记..."
          prefix-icon="Search"
          clearable
          class="search-input"
          @input="handleSearch"
        />
      </div>
    </el-header>
    <el-container style="height: calc(100vh - 60px);">
      <el-aside width="200px" class="app-aside">
        <el-menu
          :default-active="activeMenu"
          @select="handleMenuSelect"
          class="category-menu"
        >
          <el-menu-item index="/categories">
            <el-icon><HomeFilled /></el-icon>
            <span>首页</span>
          </el-menu-item>
          <el-menu-item
            v-for="category in categories"
            :key="`menu-${category.id}`"
            :index="`/category/${category.id}`"
          >
            <el-icon><Folder /></el-icon>
            <span>{{ category.title }}</span>
          </el-menu-item>
        </el-menu>
      </el-aside>
      <el-main class="app-main">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { ref, computed, onMounted, provide } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useCategories } from './composables/useCategories.js';
import { useNotes } from './composables/useNotes.js';

const route = useRoute();
const router = useRouter();
const { categories, loadCategories } = useCategories();
const { searchNotes } = useNotes();

const searchKeyword = ref('');
const activeMenu = computed(() => {
  if (route.path.startsWith('/category/')) {
    return route.path;
  }
  if (route.path === '/categories' || route.path === '/') {
    return '/categories';
  }
  return '';
});

provide('searchKeyword', searchKeyword);

onMounted(() => {
  loadCategories();
});

const handleMenuSelect = (index) => {
  console.log('Menu selected:', index);
  router.push(index).catch(err => {
    console.error('Router error:', err);
  });
};

let searchTimeout;
const handleSearch = () => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    if (searchKeyword.value.trim()) {
      searchNotes(searchKeyword.value);
      if (route.name !== 'Categories') {
        router.push('/categories');
      }
    } else {
      loadCategories();
    }
  }, 300);
};
</script>

<style scoped>
.app-container {
  height: 100vh;
}

.app-header {
  background-color: #ffffff;
  border-bottom: 1px solid #e4e7ed;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
}

.header-left {
  display: flex;
  align-items: center;
}

.app-title {
  font-size: 20px;
  font-weight: 600;
  color: #409eff;
  margin: 0;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.search-input {
  width: 300px;
}

.app-aside {
  background-color: #f5f7fa;
  border-right: 1px solid #e4e7ed;
  height: 100%;
  overflow-y: auto;
}

.category-menu {
  border: none;
  background-color: transparent;
  height: 100%;
}

.app-main {
  background-color: #ffffff;
  padding: 20px;
  height: 100%;
  overflow-y: auto;
}

@media (max-width: 768px) {
  .app-header {
    flex-direction: column;
    gap: 10px;
    padding: 10px;
  }

  .search-input {
    width: 100%;
  }

  .app-aside {
    display: none;
  }
}
</style>
