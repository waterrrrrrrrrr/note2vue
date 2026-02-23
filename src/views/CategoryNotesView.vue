<template>
  <div class="category-notes-view">
    <div class="page-header">
      <div class="header-left">
        <el-button @click="goBack" :icon="ArrowLeft">返回</el-button>
        <h2>{{ category?.title || '加载中...' }}</h2>
      </div>
      <el-button type="primary" @click="createNote">
        <el-icon><Plus /></el-icon>
        新建笔记
      </el-button>
    </div>

    <div v-if="loading" class="loading-container">
      <el-skeleton :rows="5" animated />
    </div>

    <div v-else-if="notes.length === 0" class="empty-state">
      <el-empty description="暂无笔记，点击上方按钮添加">
        <el-button type="primary" @click="createNote">添加笔记</el-button>
      </el-empty>
    </div>

    <div v-else class="notes-table">
      <el-table
        :data="notes"
        style="width: 100%"
        @row-click="handleRowClick"
        :row-style="{ cursor: 'pointer' }"
      >
        <el-table-column prop="title" label="笔记标题" min-width="200">
          <template #default="{ row }">
            <router-link :to="`/note/${row.id}`" class="note-link" @click.stop>
              {{ row.title }}
            </router-link>
          </template>
        </el-table-column>
        <el-table-column label="学习时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.time) }}
          </template>
        </el-table-column>
        <el-table-column prop="learned" label="已学内容" min-width="300" show-overflow-tooltip />
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click.stop="viewNote(row.id)">
              查看
            </el-button>
            <el-button type="danger" link @click="deleteNote(row, $event)">
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { ArrowLeft, Plus } from '@element-plus/icons-vue';
import { useCategories } from '../composables/useCategories.js';
import { useNotes } from '../composables/useNotes.js';
import { ElMessageBox } from 'element-plus';

const router = useRouter();
const route = useRoute();
const categoryId = computed(() => Number(route.params.id));

const { getCategory } = useCategories();
const { notes, loading, loadNotesByCategory, deleteNote: deleteNoteApi } = useNotes();

const category = ref(null);

const loadData = async (id) => {
  category.value = await getCategory(id);
  await loadNotesByCategory(id);
};

onMounted(async () => {
  await loadData(categoryId.value);
});

watch(categoryId, (newId) => {
  if (newId) {
    loadData(newId);
  }
});

const goBack = () => {
  router.push('/categories');
};

const createNote = () => {
  router.push(`/note/new?categoryId=${categoryId}`);
};

const viewNote = (id) => {
  router.push(`/note/${id}`);
};

const handleRowClick = (row) => {
  viewNote(row.id);
};

const deleteNote = (note, event) => {
  if (event) {
    event.stopPropagation();
  }
  ElMessageBox.confirm(
    `确定要删除笔记"${note.title}"吗？`,
    '提示',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    await deleteNoteApi(note.id);
    await loadNotesByCategory(categoryId.value);
  }).catch(() => {});
};

const formatDate = (isoString) => {
  const date = new Date(isoString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}`;
};
</script>

<style scoped>
.category-notes-view {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-left h2 {
  margin: 0;
  color: #303133;
}

.note-link {
  color: #409eff;
  text-decoration: none;
  font-weight: 500;
}

.note-link:hover {
  text-decoration: underline;
}

.loading-container,
.empty-state {
  margin-top: 60px;
}

@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
}
</style>
