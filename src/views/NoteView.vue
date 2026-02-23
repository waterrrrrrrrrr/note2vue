<template>
  <div class="note-view">
    <div class="page-header">
      <div class="header-left">
        <el-button @click="goBack" :icon="ArrowLeft">返回</el-button>
        <el-tag v-if="categoryTitle" type="info">{{ categoryTitle }}</el-tag>
      </div>
      <div class="header-right">
        <template v-if="!isEditing">
          <el-button type="primary" @click="enterEditMode">
            <el-icon><Edit /></el-icon>
            编辑
          </el-button>
          <el-button type="danger" @click="handleDelete">
            <el-icon><Delete /></el-icon>
            删除
          </el-button>
        </template>
      </div>
    </div>

    <div v-if="loading" class="loading-container">
      <el-skeleton :rows="10" animated />
    </div>

    <div v-else-if="!note" class="empty-state">
      <el-empty description="笔记不存在" />
    </div>

    <div v-else class="note-content">
      <template v-if="!isEditing">
        <div class="note-detail">
          <h1 class="note-title">{{ note.title }}</h1>
          <div class="note-meta">
            <el-tag type="success" size="large">
              <el-icon><Clock /></el-icon>
              {{ formatDate(note.time) }}
            </el-tag>
          </div>

          <el-divider />

          <div class="note-section">
            <h3 class="section-title">已学内容</h3>
            <div class="section-content">{{ note.learned || '暂无内容' }}</div>
          </div>

          <div v-if="note.doubt" class="note-section">
            <h3 class="section-title">仍有疑惑</h3>
            <div class="section-content">{{ note.doubt }}</div>
          </div>

          <div v-if="note.nextGoal" class="note-section">
            <h3 class="section-title">下一个目标</h3>
            <div class="section-content">{{ note.nextGoal }}</div>
          </div>
        </div>
      </template>

      <template v-else>
        <div class="note-form">
          <el-form :model="form" :rules="rules" ref="formRef" label-width="100px">
            <el-form-item label="笔记标题" prop="title">
              <el-input v-model="form.title" placeholder="请输入笔记标题" />
            </el-form-item>

            <el-form-item label="学习时间" prop="time">
              <el-date-picker
                v-model="form.time"
                type="datetime"
                placeholder="选择学习时间"
                format="YYYY-MM-DD HH:mm"
                value-format="YYYY-MM-DDTHH:mm:ss"
                style="width: 100%"
              />
            </el-form-item>

            <el-form-item label="已学内容" prop="learned">
              <el-input
                v-model="form.learned"
                type="textarea"
                :rows="6"
                placeholder="请输入已学内容（必填）"
                @keydown.tab.prevent="handleTab($event, 'learned')"
              />
            </el-form-item>

            <el-form-item label="仍有疑惑">
              <el-input
                v-model="form.doubt"
                type="textarea"
                :rows="4"
                placeholder="请输入仍有疑惑（可选）"
                @keydown.tab.prevent="handleTab($event, 'doubt')"
              />
            </el-form-item>

            <el-form-item label="下一个目标">
              <el-input
                v-model="form.nextGoal"
                type="textarea"
                :rows="4"
                placeholder="请输入下一个目标（可选）"
                @keydown.tab.prevent="handleTab($event, 'nextGoal')"
              />
            </el-form-item>

            <el-form-item>
              <el-button type="primary" @click="handleSave">保存</el-button>
              <el-button @click="handleCancel">取消</el-button>
            </el-form-item>
          </el-form>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { ArrowLeft, Edit, Delete, Clock } from '@element-plus/icons-vue';
import { useNotes } from '../composables/useNotes.js';
import { useCategories } from '../composables/useCategories.js';
import { ElMessageBox } from 'element-plus';

const router = useRouter();
const route = useRoute();
const noteId = Number(route.params.id);

const { loadNote, updateNote, deleteNote: deleteNoteApi } = useNotes();
const { getCategory } = useCategories();

const note = ref(null);
const loading = ref(true);
const isEditing = ref(false);
const formRef = ref(null);
const categoryTitle = ref('');

const form = ref({
  title: '',
  time: '',
  learned: '',
  doubt: '',
  nextGoal: ''
});

const rules = {
  title: [
    { required: true, message: '请输入笔记标题', trigger: 'blur' },
    { min: 1, max: 100, message: '长度在 1 到 100 个字符', trigger: 'blur' }
  ],
  time: [
    { required: true, message: '请选择学习时间', trigger: 'change' }
  ],
  learned: [
    { required: true, message: '请输入已学内容', trigger: 'blur' }
  ]
};

const loadNoteData = async () => {
  loading.value = true;
  note.value = await loadNote(noteId);
  if (note.value) {
    form.value = {
      title: note.value.title,
      time: formatDateTime(note.value.time),
      learned: note.value.learned,
      doubt: note.value.doubt || '',
      nextGoal: note.value.nextGoal || ''
    };
    const category = await getCategory(note.value.categoryId);
    categoryTitle.value = category?.title || '';
  }
  loading.value = false;
};

onMounted(() => {
  loadNoteData();
});

const goBack = () => {
  if (note.value) {
    router.push(`/category/${note.value.categoryId}`);
  } else {
    router.push('/categories');
  }
};

const enterEditMode = () => {
  isEditing.value = true;
};

const handleSave = async () => {
  if (!formRef.value) return;
  await formRef.value.validate(async (valid) => {
    if (valid) {
      const success = await updateNote(noteId, form.value);
      if (success) {
        isEditing.value = false;
        await loadNoteData();
      }
    }
  });
};

const handleCancel = () => {
  form.value = {
    title: note.value.title,
    time: formatDateTime(note.value.time),
    learned: note.value.learned,
    doubt: note.value.doubt || '',
    nextGoal: note.value.nextGoal || ''
  };
  isEditing.value = false;
};

const handleDelete = () => {
  ElMessageBox.confirm(
    `确定要删除笔记"${note.value?.title}"吗？`,
    '提示',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    await deleteNoteApi(noteId);
    goBack();
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

const formatDateTime = (isoString) => {
  const date = new Date(isoString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}:00`;
};

const handleTab = (event, field) => {
  const textarea = event.target;
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const value = form.value[field];

  form.value[field] = value.substring(0, start) + '  ' + value.substring(end);

  textarea.selectionStart = textarea.selectionEnd = start + 2;
};

</script>

<style scoped>
.note-view {
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

.header-right {
  display: flex;
  gap: 12px;
}

.loading-container,
.empty-state {
  margin-top: 60px;
}

.note-detail {
  max-width: 900px;
  margin: 0 auto;
}

.note-title {
  font-size: 28px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 16px 0;
}

.note-meta {
  margin-bottom: 16px;
}

.note-section {
  margin-bottom: 32px;
}

.section-title {
  font-size: 18px;
  font-weight: 500;
  color: #409eff;
  margin: 0 0 12px 0;
  padding-bottom: 8px;
  border-bottom: 2px solid #409eff;
}

.section-content {
  font-size: 15px;
  line-height: 1.8;
  color: #606266;
  white-space: pre-wrap;
  word-wrap: break-word;
}

.note-form {
  max-width: 700px;
  margin: 0 auto;
}

@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }

  .header-right {
    width: 100%;
  }

  .note-title {
    font-size: 22px;
  }

  .note-form {
    padding: 0 10px;
  }
}
</style>
