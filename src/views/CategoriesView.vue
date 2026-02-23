<template>
  <div class="categories-view">
    <div class="page-header">
      <h2>{{ searchKeyword ? '搜索结果' : '分类管理' }}</h2>
      <el-button v-if="!searchKeyword" type="primary" @click="showAddDialog">
        <el-icon><Plus /></el-icon>
        新增分类
      </el-button>
    </div>

    <div v-if="searchKeyword && notes.length === 0 && !loading" class="empty-state">
      <el-empty description="未找到相关笔记" />
    </div>

    <div v-else-if="searchKeyword && notes.length > 0" class="search-results">
      <el-table
        :data="notes"
        style="width: 100%"
        @row-click="handleNoteRowClick"
        :row-style="{ cursor: 'pointer' }"
      >
        <el-table-column prop="title" label="笔记标题" min-width="200" />
        <el-table-column prop="categoryName" label="分类" width="150" />
        <el-table-column label="学习时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.time) }}
          </template>
        </el-table-column>
        <el-table-column prop="learned" label="已学内容" min-width="250" show-overflow-tooltip />
        <el-table-column label="操作" width="100" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click.stop="goToNote(row.id)">
              查看
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <div v-else-if="!searchKeyword" class="categories-list">
      <el-table
        :data="sharedCategories"
        style="width: 100%"
        @row-click="handleCategoryRowClick"
        :row-style="{ cursor: 'pointer' }"
      >
        <el-table-column prop="title" label="分类名称" min-width="300">
          <template #default="{ row }">
            <router-link :to="`/category/${row.id}`" class="category-link" @click.stop>
              {{ row.title }}
            </router-link>
          </template>
        </el-table-column>
        <el-table-column label="笔记数量" width="120" align="center">
          <template #default="{ row }">
            <el-tag>{{ getNoteCount(row.id) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click.stop="showEditDialog(row)">
              编辑
            </el-button>
            <el-button type="danger" link @click.stop="handleDelete(row)">
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <div v-if="sharedCategories.length === 0" class="empty-state">
        <el-empty description="暂无分类，点击上方按钮添加">
          <el-button type="primary" @click="showAddDialog">添加分类</el-button>
        </el-empty>
      </div>
    </div>

    <!-- 新增/编辑分类弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="400px"
    >
      <el-form :model="form" :rules="rules" ref="formRef" label-width="80px">
        <el-form-item label="分类名称" prop="title">
          <el-input v-model="form.title" placeholder="请输入分类名称" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, inject } from 'vue';
import { useRouter } from 'vue-router';
import { useCategories } from '../composables/useCategories.js';
import { useNotes } from '../composables/useNotes.js';
import { ElMessageBox, ElMessage } from 'element-plus';
import db from '../db/index';

const router = useRouter();
const searchKeyword = inject('searchKeyword', ref(''));
const sharedCategories = inject('sharedCategories', ref([]));
const { loadCategories, addCategory, updateCategory, deleteCategory } = useCategories(sharedCategories);
const { notes } = useNotes();

const dialogVisible = ref(false);
const dialogTitle = ref('');
const isEdit = ref(false);
const currentId = ref(null);
const form = ref({ title: '' });
const formRef = ref(null);
const noteCounts = ref({});

const rules = {
  title: [
    { required: true, message: '请输入分类名称', trigger: 'blur' },
    { min: 1, max: 50, message: '长度在 1 到 50 个字符', trigger: 'blur' }
  ]
};

const loadNoteCounts = async () => {
  for (const category of sharedCategories.value) {
    const count = await db.notes.where('categoryId').equals(category.id).count();
    noteCounts.value[category.id] = count;
  }
};

onMounted(async () => {
  await loadCategories();
  await loadNoteCounts();
});

watch(sharedCategories, () => {
  loadNoteCounts();
}, { deep: true });

const getNoteCount = (id) => {
  return noteCounts.value[id] || 0;
};

const showAddDialog = () => {
  isEdit.value = false;
  dialogTitle.value = '新增分类';
  form.value = { title: '' };
  dialogVisible.value = true;
};

const showEditDialog = (category) => {
  isEdit.value = true;
  dialogTitle.value = '编辑分类';
  currentId.value = category.id;
  form.value = { title: category.title };
  dialogVisible.value = true;
};

const handleSubmit = async () => {
  if (!formRef.value) return;
  await formRef.value.validate(async (valid) => {
    if (valid) {
      if (isEdit.value) {
        await updateCategory(currentId.value, form.value.title);
      } else {
        await addCategory(form.value.title);
      }
      dialogVisible.value = false;
      await loadNoteCounts();
    }
  });
};

const handleDelete = async (category) => {
  const count = getNoteCount(category.id);
  if (count > 0) {
    ElMessage.warning(`该分类下有 ${count} 条笔记，无法删除`);
    return;
  }
  ElMessageBox.confirm(
    '确定要删除该分类吗？',
    '提示',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    await deleteCategory(category.id);
  }).catch(() => {});
};

const goToNote = (id) => {
  router.push(`/note/${id}`);
};

const handleNoteRowClick = (row) => {
  goToNote(row.id);
};

const handleCategoryRowClick = (row) => {
  router.push(`/category/${row.id}`);
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
.categories-view {
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

.page-header h2 {
  margin: 0;
  color: #303133;
}

.category-link {
  color: #409eff;
  text-decoration: none;
  font-weight: 500;
}

.category-link:hover {
  text-decoration: underline;
}

.empty-state {
  margin-top: 60px;
}

.search-results {
  margin-top: 20px;
}

@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
}
</style>
