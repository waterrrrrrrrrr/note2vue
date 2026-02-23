<template>
  <div class="note-form-view">
    <div class="page-header">
      <el-button @click="goBack" :icon="ArrowLeft">返回</el-button>
      <h2>{{ isEdit ? '编辑笔记' : '新建笔记' }}</h2>
    </div>

    <div v-if="loading" class="loading-container">
      <el-skeleton :rows="10" animated />
    </div>

    <div v-else class="note-form-container">
      <el-form :model="form" :rules="rules" ref="formRef" label-width="100px">
        <el-form-item label="所属分类" prop="categoryId">
          <el-select v-model="form.categoryId" placeholder="请选择分类" style="width: 100%">
            <el-option
              v-for="category in categories"
              :key="category.id"
              :label="category.title"
              :value="category.id"
            />
          </el-select>
        </el-form-item>

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
            :rows="8"
            placeholder="请输入已学内容（必填）"
            @keydown.tab.prevent="handleTab($event, 'learned')"
          />
        </el-form-item>

        <el-form-item label="仍有疑惑">
          <el-input
            v-model="form.doubt"
            type="textarea"
            :rows="5"
            placeholder="请输入仍有疑惑（可选）"
            @keydown.tab.prevent="handleTab($event, 'doubt')"
          />
        </el-form-item>

        <el-form-item label="下一个目标">
          <el-input
            v-model="form.nextGoal"
            type="textarea"
            :rows="5"
            placeholder="请输入下一个目标（可选）"
            @keydown.tab.prevent="handleTab($event, 'nextGoal')"
          />
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="handleSubmit">保存</el-button>
          <el-button @click="handleCancel">取消</el-button>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { ArrowLeft } from '@element-plus/icons-vue';
import { useCategories } from '../composables/useCategories.js';
import { useNotes } from '../composables/useNotes.js';


const router = useRouter();
const route = useRoute();

const { categories, loadCategories } = useCategories();
const { addNote, updateNote, loadNote } = useNotes();

const props = defineProps({
  noteId: {
    type: [String, Number],
    default: null
  }
});

const isEdit = computed(() => !!props.noteId);
const loading = ref(false);
const formRef = ref(null);

const form = ref({
  categoryId: null,
  title: '',
  time: '',
  learned: '',
  doubt: '',
  nextGoal: ''
});

const rules = {
  categoryId: [
    { required: true, message: '请选择分类', trigger: 'change' }
  ],
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

onMounted(async () => {
  loading.value = true;
  await loadCategories();

  const queryCategoryId = Number(route.query.categoryId);
  if (queryCategoryId && !isEdit.value) {
    form.value.categoryId = queryCategoryId;
  }

  if (isEdit.value) {
    const note = await loadNote(Number(props.noteId));
    if (note) {
      form.value = {
        categoryId: note.categoryId,
        title: note.title,
        time: formatDateTime(note.time),
        learned: note.learned,
        doubt: note.doubt || '',
        nextGoal: note.nextGoal || ''
      };
    }
  } else {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    form.value.time = `${year}-${month}-${day}T${hours}:${minutes}:00`;
  }
  loading.value = false;
});

const goBack = () => {
  if (form.value.categoryId) {
    router.push(`/category/${form.value.categoryId}`);
  } else {
    router.push('/categories');
  }
};

const handleSubmit = async () => {
  if (!formRef.value) return;
  await formRef.value.validate(async (valid) => {
    if (valid) {
      if (isEdit.value) {
        const success = await updateNote(Number(props.noteId), form.value);
        if (success) {
          goBack();
        }
      } else {
        const id = await addNote(form.value);
        if (id) {
          router.push(`/note/${id}`);
        }
      }
    }
  });
};

const handleCancel = () => {
  goBack();
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
.note-form-view {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.page-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
}

.page-header h2 {
  margin: 0;
  color: #303133;
}

.loading-container {
  margin-top: 60px;
}

.note-form-container {
  max-width: 700px;
  margin: 0 auto;
  width: 100%;
}

@media (max-width: 768px) {
  .page-header h2 {
    font-size: 18px;
  }

  .note-form-container {
    padding: 0 10px;
  }

  :deep(.el-form-item__label) {
    width: 80px !important;
  }
}
</style>
